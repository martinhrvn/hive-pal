import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { stripImageMetadata } from './strip-image-metadata';

const asUpload = (buffer: Buffer, mimetype: string): Express.Multer.File =>
  ({
    buffer,
    mimetype,
    size: buffer.length,
    originalname: 'photo',
  }) as Express.Multer.File;

/** A 4x2 image carrying EXIF (camera, GPS) and an orientation tag of 6 (rotate 90°). */
const imageWithExif = (format: 'jpeg' | 'png' | 'webp') =>
  sharp({
    create: { width: 4, height: 2, channels: 3, background: '#d97706' },
  })
    .withExif({
      IFD0: { Make: 'PhoneCam', Model: 'X1' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '48/1 8/1 0/1' },
    })
    .withMetadata({ orientation: 6 })
    .toFormat(format)
    .toBuffer();

describe('stripImageMetadata', () => {
  it.each([
    ['jpeg', 'image/jpeg'],
    ['png', 'image/png'],
    ['webp', 'image/webp'],
  ] as const)(
    'removes EXIF from %s and keeps the photo upright',
    async (format, mimetype) => {
      const input = await imageWithExif(format);
      expect((await sharp(input).metadata()).exif).toBeDefined();

      const result = await stripImageMetadata(asUpload(input, mimetype));

      const meta = await sharp(result.buffer).metadata();
      expect(meta.exif).toBeUndefined();
      expect(meta.orientation).toBeUndefined();
      // Orientation 6 was baked into the pixels: 4x2 became 2x4.
      expect([meta.width, meta.height]).toEqual([2, 4]);
      expect(meta.format).toBe(format);
      expect(result.size).toBe(result.buffer.length);
    },
  );

  it('passes files it cannot re-encode through unchanged', async () => {
    const pdf = asUpload(Buffer.from('%PDF-1.7'), 'application/pdf');
    const heic = asUpload(Buffer.from('heic bytes'), 'image/heic');

    expect(await stripImageMetadata(pdf)).toBe(pdf);
    expect(await stripImageMetadata(heic)).toBe(heic);
  });

  it('rejects a file that claims to be an image but is not one', async () => {
    await expect(
      stripImageMetadata(asUpload(Buffer.from('not an image'), 'image/jpeg')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
