import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { apiaryAccessWhere } from '../common';
import {
  computeTreatmentIngredientMasses,
  type ConcentrationUnit,
  type CreateTreatmentProductDto,
  type UpdateTreatmentProductDto,
  type CreateActiveIngredientDto,
  type AppliedIngredientTotal,
} from 'shared-schemas';

const productInclude = {
  ingredients: { include: { activeIngredient: true } },
} as const;

@Injectable()
export class TreatmentProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Built-in (global) products plus the caller's own custom products. */
  async findAll(userId: string) {
    return this.prisma.treatmentProduct.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      include: productInclude,
      orderBy: [{ isBuiltIn: 'desc' }, { name: 'asc' }],
    });
  }

  async findOneForUser(userId: string, id: string) {
    const product = await this.prisma.treatmentProduct.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product || (product.userId !== null && product.userId !== userId)) {
      throw new NotFoundException('Treatment product not found');
    }
    return product;
  }

  async create(userId: string, dto: CreateTreatmentProductDto) {
    await this.assertNameFree(userId, dto.name);
    return this.prisma.treatmentProduct.create({
      data: {
        userId,
        createdByUserId: userId,
        isBuiltIn: false,
        name: dto.name,
        physicalForm: dto.physicalForm,
        applicationMethod: dto.applicationMethod ?? null,
        defaultUnit: dto.defaultUnit ?? null,
        density: dto.density ?? null,
        withdrawalPeriodDays: dto.withdrawalPeriodDays ?? null,
        ingredients: {
          create: (dto.ingredients ?? []).map((i) => ({
            activeIngredientId: i.activeIngredientId,
            concentration: i.concentration,
            concentrationUnit: i.concentrationUnit,
          })),
        },
      },
      include: productInclude,
    });
  }

  async update(userId: string, id: string, dto: UpdateTreatmentProductDto) {
    const existing = await this.prisma.treatmentProduct.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Treatment product not found');
    if (existing.userId === null || existing.isBuiltIn) {
      throw new ForbiddenException('Built-in products cannot be edited');
    }
    if (existing.userId !== userId) {
      throw new NotFoundException('Treatment product not found');
    }
    if (dto.name && dto.name !== existing.name) {
      await this.assertNameFree(userId, dto.name);
    }

    return this.prisma.treatmentProduct.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        physicalForm: dto.physicalForm ?? undefined,
        applicationMethod:
          dto.applicationMethod === undefined
            ? undefined
            : dto.applicationMethod,
        defaultUnit:
          dto.defaultUnit === undefined ? undefined : dto.defaultUnit,
        density: dto.density === undefined ? undefined : dto.density,
        withdrawalPeriodDays:
          dto.withdrawalPeriodDays === undefined
            ? undefined
            : dto.withdrawalPeriodDays,
        // Replace the composition wholesale when provided.
        ...(dto.ingredients !== undefined
          ? {
              ingredients: {
                deleteMany: {},
                create: dto.ingredients.map((i) => ({
                  activeIngredientId: i.activeIngredientId,
                  concentration: i.concentration,
                  concentrationUnit: i.concentrationUnit,
                })),
              },
            }
          : {}),
      },
      include: productInclude,
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.treatmentProduct.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Treatment product not found');
    if (existing.userId === null || existing.isBuiltIn) {
      throw new ForbiddenException('Built-in products cannot be deleted');
    }
    if (existing.userId !== userId) {
      throw new NotFoundException('Treatment product not found');
    }
    await this.prisma.treatmentProduct.delete({ where: { id } });
    return { success: true };
  }

  // --- Active ingredients ---

  async listActiveIngredients() {
    return this.prisma.activeIngredient.findMany({
      orderBy: [{ isBuiltIn: 'desc' }, { name: 'asc' }],
    });
  }

  async createActiveIngredient(userId: string, dto: CreateActiveIngredientDto) {
    const existing = await this.prisma.activeIngredient.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException('An active ingredient with this key exists');
    }
    return this.prisma.activeIngredient.create({
      data: {
        key: dto.key,
        name: dto.name,
        isBuiltIn: false,
        createdByUserId: userId,
      },
    });
  }

  // --- Per-colony aggregation: applied active-ingredient totals + withdrawal ---

  /**
   * Applied active-ingredient totals + current withdrawal status for one hive.
   * Verifies the caller can access the hive (owned or shared apiary).
   */
  async getHiveTreatmentSummary(
    userId: string,
    hiveId: string,
    from?: Date,
    to?: Date,
  ) {
    const hive = await this.prisma.hive.findFirst({
      where: { id: hiveId, apiary: apiaryAccessWhere(userId) },
      select: { id: true },
    });
    if (!hive) {
      throw new NotFoundException('Hive not found or access denied');
    }

    const treatments = await this.fetchTreatments([hiveId], from, to);
    const allTreatments =
      from || to ? await this.fetchTreatments([hiveId]) : treatments;

    return {
      hiveId,
      from: from ?? null,
      to: to ?? null,
      ingredientTotals: this.aggregateIngredientTotals(treatments),
      withdrawal: this.computeWithdrawal(allTreatments),
    };
  }

  /** Per-hive applied ingredient totals across an apiary the caller can access. */
  async getApiaryIngredientTotals(
    userId: string,
    apiaryId: string,
    from?: Date,
    to?: Date,
  ) {
    const hives = await this.prisma.hive.findMany({
      where: { apiaryId, apiary: apiaryAccessWhere(userId) },
      select: { id: true, name: true },
    });
    const byHive = await Promise.all(
      hives.map(async (h) => {
        const treatments = await this.fetchTreatments([h.id], from, to);
        return {
          hiveId: h.id,
          hiveName: h.name,
          ingredientTotals: this.aggregateIngredientTotals(treatments),
        };
      }),
    );
    return { apiaryId, from: from ?? null, to: to ?? null, byHive };
  }

  private fetchTreatments(hiveIds: string[], from?: Date, to?: Date) {
    const dateFilter =
      from || to
        ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {};
    return this.prisma.action.findMany({
      where: { hiveId: { in: hiveIds }, type: 'TREATMENT', ...dateFilter },
      orderBy: { date: 'desc' },
      include: {
        treatmentAction: {
          include: {
            treatmentProduct: {
              include: { ingredients: { include: { activeIngredient: true } } },
            },
          },
        },
      },
    });
  }

  private aggregateIngredientTotals(
    treatments: Awaited<ReturnType<typeof this.fetchTreatments>>,
  ): AppliedIngredientTotal[] {
    const totals = new Map<string, AppliedIngredientTotal>();
    for (const action of treatments) {
      const ta = action.treatmentAction;
      const product = ta?.treatmentProduct;
      if (!ta || !product) continue; // uncatalogued treatment: no composition
      const masses = computeTreatmentIngredientMasses(ta.quantity, ta.unit, {
        density: product.density,
        ingredients: product.ingredients.map((i) => ({
          activeIngredientId: i.activeIngredientId,
          concentration: i.concentration,
          concentrationUnit: i.concentrationUnit as ConcentrationUnit,
        })),
      });
      for (const ing of product.ingredients) {
        const res = masses[ing.activeIngredientId];
        const entry =
          totals.get(ing.activeIngredientId) ??
          ({
            activeIngredientId: ing.activeIngredientId,
            key: ing.activeIngredient.key,
            name: ing.activeIngredient.name,
            totalMg: 0,
            incompleteCount: 0,
          } satisfies AppliedIngredientTotal);
        if (res.incomplete || res.mg == null) {
          entry.incompleteCount += 1;
        } else {
          entry.totalMg += res.mg;
        }
        totals.set(ing.activeIngredientId, entry);
      }
    }
    return [...totals.values()].sort((a, b) => b.totalMg - a.totalMg);
  }

  private computeWithdrawal(
    treatments: Awaited<ReturnType<typeof this.fetchTreatments>>,
  ) {
    const now = Date.now();
    let latestUntil = 0;
    let source: { productName: string; productId: string; until: Date } | null =
      null;
    for (const action of treatments) {
      const product = action.treatmentAction?.treatmentProduct;
      if (!product || product.withdrawalPeriodDays == null) continue;
      const until =
        action.date.getTime() +
        product.withdrawalPeriodDays * 24 * 60 * 60 * 1000;
      if (until > latestUntil) {
        latestUntil = until;
        source = {
          productName: product.name,
          productId: product.id,
          until: new Date(until),
        };
      }
    }
    if (!source) return { inWithdrawal: false, until: null, product: null };
    return {
      inWithdrawal: latestUntil > now,
      until: source.until,
      product: { id: source.productId, name: source.productName },
    };
  }

  private async assertNameFree(userId: string, name: string) {
    const clash = await this.prisma.treatmentProduct.findFirst({
      where: { userId, name },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException('You already have a product with this name');
    }
  }
}
