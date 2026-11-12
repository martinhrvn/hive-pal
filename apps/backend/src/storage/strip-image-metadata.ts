import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

type Image = ReturnType<typeof sharp>;

/**
 * Formats sharp can re-encode. HEIC is missing on purpose: decoding it needs an
 * HEVC decoder that the prebuilt sharp binaries do not ship, so HEIC uploads
 * are stored as they arrive.
 */
const ENCODERS: Record<string, (image: Image) => Image> = {
  'image/jpeg': (image) => image.jpeg({ quality: 90 }),
  'image/png': (image) => image.png(),
  'image/webp': (image) => image.webp({ quality: 90 }),
};

/**
 * Returns the upload with its embedded metadata removed: EXIF (including the
 * GPS position a phone camera records, which would reveal where an apiary
 * is), XMP and IPTC. The EXIF orientation is applied to the pixels first so
 * the photo stays upright, and the ICC colour profile is kept.
 *
 * Other file types (PDF, HEIC) are returned unchanged. A file that claims to
 * be an image but cannot be decoded is rejected.
 */
export async function stripImageMetadata(
  file: Express.Multer.File,
): Promise<Express.Multer.File> {
  const encode = ENCODERS[file.mimetype];
  if (!encode) return file;

  try {
    const image = sharp(file.buffer, { animated: true })
      .autoOrient()
      .keepIccProfile();
    const buffer = await encode(image).toBuffer();
    return { ...file, buffer, size: buffer.length };
  } catch {
    throw new BadRequestException('The uploaded file is not a valid image');
  }
}
