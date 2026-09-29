import { NotFoundException } from '@nestjs/common';
import { PhotosService } from './photos.service';

describe('PhotosService', () => {
  describe('create', () => {
    const file = {
      originalname: 'a.jpg',
      mimetype: 'image/jpeg',
      size: 10,
    } as Express.Multer.File;

    const makeService = () => {
      const fileUpload = {
        validateFile: vi.fn(),
        assertApiaryWritable: vi.fn(),
        validateHiveBelongsToApiary: vi.fn(),
        uploadFile: vi.fn().mockResolvedValue({ id: 'p1', storageKey: 'k' }),
      };
      const prisma = { photo: { create: vi.fn() } };
      const logger = { log: vi.fn(), setContext: vi.fn() };
      const svc = new PhotosService(
        prisma as unknown as ConstructorParameters<typeof PhotosService>[0],
        fileUpload as unknown as ConstructorParameters<typeof PhotosService>[1],
        logger as unknown as ConstructorParameters<typeof PhotosService>[2],
      );
      return { svc, fileUpload, prisma };
    };

    it('checks write access to the apiary named in the body before uploading', async () => {
      const { svc, fileUpload, prisma } = makeService();
      fileUpload.assertApiaryWritable.mockRejectedValue(
        new NotFoundException('nope'),
      );

      await expect(
        svc.create({ apiaryId: 'apiary-c' }, file, {
          apiaryId: 'apiary-a',
          userId: 'user-1',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(fileUpload.assertApiaryWritable).toHaveBeenCalledWith(
        'apiary-c',
        'user-1',
      );
      expect(fileUpload.uploadFile).not.toHaveBeenCalled();
      expect(prisma.photo.create).not.toHaveBeenCalled();
    });
  });
});
