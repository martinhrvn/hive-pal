import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { UserPreferences, UpdateUserInfo } from 'shared-schemas';

// S3 DeleteObjects accepts at most 1000 keys per request.
const S3_DELETE_BATCH_SIZE = 1000;

@Injectable()
export class UsersService {
  constructor(
    private prismaService: PrismaService,
    private storageService: StorageService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('UsersService');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  /**
   * Returns a lightweight list of all users (id, email, name).
   * Used by the swarm alert scheduler to iterate over users that
   * may have swarm alerts configured.
   */
  async getAllUsers(): Promise<
    Array<{ id: string; email: string; name: string | null }>
  > {
    return this.prismaService.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user || !user.preferences) {
      return null;
    }

    return user.preferences as UserPreferences;
  }

  async updateUserPreferences(
    userId: string,
    preferences: UserPreferences,
  ): Promise<UserPreferences> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { preferences: preferences as object },
    });

    return updatedUser.preferences as UserPreferences;
  }

  async updateUserInfo(
    userId: string,
    updateData: UpdateUserInfo,
  ): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.email && { email: updateData.email }),
      },
    });
  }

  /**
   * Permanently deletes the user and all data they own (apiaries, hives,
   * inspections, queens, harvests, photos, etc.). Content the user contributed
   * to apiaries they don't own (e.g. inspections in a shared apiary) is kept,
   * with the creator reference set to null — handled by `onDelete: SetNull` on
   * the relevant relations in the schema. Owned data is removed via DB cascade
   * (`onDelete: Cascade` down from `Apiary.user`).
   *
   * Stored media (S3 / local storage) for owned apiaries is deleted on a
   * best-effort basis before the database delete; storage failures are logged
   * but never block account deletion.
   */
  async deleteAccount(userId: string): Promise<void> {
    this.logger.log({ message: 'Account deletion requested', userId });

    const ownedApiaries = await this.prismaService.apiary.findMany({
      where: { userId },
      select: { id: true },
    });
    const ownedApiaryIds = ownedApiaries.map((a) => a.id);

    const storageKeys = await this.collectOwnedStorageKeys(userId, ownedApiaryIds);
    await this.deleteStorageObjects(storageKeys, userId);

    // AccountTransferJob has no FK to User, so it does not cascade — remove it
    // explicitly (its storage artifacts were gathered above).
    await this.prismaService.accountTransferJob.deleteMany({ where: { userId } });

    // Single delete cascades all owned data and auth records (sessions,
    // accounts, passkeys, equipment, memberships, ...) and nulls out the
    // creator on the user's contributions to other people's apiaries.
    await this.prismaService.user.delete({ where: { id: userId } });

    this.logger.log({
      message: 'Account deleted',
      userId,
      apiariesRemoved: ownedApiaryIds.length,
      storageKeysRemoved: storageKeys.length,
    });
  }

  /**
   * Gathers every storage key belonging to the user: media in their owned
   * apiaries (photos, documents, quick-check photos, inspection audio) plus
   * their account-transfer artifacts.
   */
  private async collectOwnedStorageKeys(
    userId: string,
    ownedApiaryIds: string[],
  ): Promise<string[]> {
    const keys: string[] = [];

    if (ownedApiaryIds.length > 0) {
      const [photos, documents, quickCheckPhotos, audio] = await Promise.all([
        this.prismaService.photo.findMany({
          where: { apiaryId: { in: ownedApiaryIds } },
          select: { storageKey: true },
        }),
        this.prismaService.document.findMany({
          where: { apiaryId: { in: ownedApiaryIds } },
          select: { storageKey: true },
        }),
        this.prismaService.quickCheckPhoto.findMany({
          where: { quickCheck: { apiaryId: { in: ownedApiaryIds } } },
          select: { storageKey: true },
        }),
        this.prismaService.inspectionAudio.findMany({
          where: {
            inspection: { hive: { apiaryId: { in: ownedApiaryIds } } },
          },
          select: { storageKey: true },
        }),
      ]);

      keys.push(
        ...photos.map((p) => p.storageKey),
        ...documents.map((d) => d.storageKey),
        ...quickCheckPhotos.map((p) => p.storageKey),
        ...audio.map((a) => a.storageKey),
      );
    }

    const transferJobs = await this.prismaService.accountTransferJob.findMany({
      where: { userId },
      select: { inputStorageKey: true, resultStorageKey: true },
    });
    for (const job of transferJobs) {
      if (job.inputStorageKey) keys.push(job.inputStorageKey);
      if (job.resultStorageKey) keys.push(job.resultStorageKey);
    }

    return [...new Set(keys.filter(Boolean))];
  }

  /** Best-effort deletion of storage objects; never throws. */
  private async deleteStorageObjects(
    keys: string[],
    userId: string,
  ): Promise<void> {
    if (keys.length === 0 || !this.storageService.isEnabled()) {
      return;
    }

    for (let i = 0; i < keys.length; i += S3_DELETE_BATCH_SIZE) {
      const batch = keys.slice(i, i + S3_DELETE_BATCH_SIZE);
      try {
        await this.storageService.deleteObjects(batch);
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete storage objects during account deletion',
          userId,
          batchSize: batch.length,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}
