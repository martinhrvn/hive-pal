import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Req,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as mime from 'mime-types';
import { pipeline } from 'node:stream/promises';
import { ByteRange, StorageService } from './storage.interface';
import { MediaUrlService } from './media-url.service';

// User uploads are served from our own origin, so only types that browsers
// render passively are allowed inline. Anything else (including SVG and HTML,
// which can run script) is sent as a download.
const INLINE_TYPES =
  /^(?:image\/(?:jpeg|png|webp|gif|avif|heic)|audio\/[\w.+-]+|video\/[\w.+-]+|application\/pdf)$/;

/**
 * Parses a single-range `Range` header against an object of `size` bytes.
 * Returns `undefined` when the whole object should be sent, or `null` when the
 * range cannot be satisfied.
 */
export function parseRange(
  header: string | undefined,
  size: number,
): ByteRange | null | undefined {
  if (!header) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2]) || size === 0) return null;

  if (!match[1]) {
    // Suffix range: the last N bytes.
    const length = Number.parseInt(match[2], 10);
    if (length === 0) return null;
    return { start: Math.max(size - length, 0), end: size - 1 };
  }

  const start = Number.parseInt(match[1], 10);
  const end = match[2]
    ? Math.min(Number.parseInt(match[2], 10), size - 1)
    : size - 1;
  if (start > end) return null;
  return { start, end };
}

@Controller('storage')
export class StorageController {
  constructor(
    @Inject(StorageService)
    private readonly storageService: StorageService,
    private readonly mediaUrls: MediaUrlService,
  ) {}

  @Get('files/*key')
  async serveFile(
    @Param('key') keyParam: string | string[],
    @Query('token') token: string,
    @Query('expires') expires: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    // Express 5 hands wildcard params over as an array of path segments.
    const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam;

    if (!token || !expires) {
      throw new HttpException('Missing token or expires', HttpStatus.FORBIDDEN);
    }

    const expiresNum = Number.parseInt(expires, 10);
    if (Number.isNaN(expiresNum)) {
      throw new HttpException('Invalid expires', HttpStatus.BAD_REQUEST);
    }

    if (!this.mediaUrls.verify(key, token, expiresNum)) {
      throw new HttpException('Invalid or expired token', HttpStatus.FORBIDDEN);
    }

    if (!this.storageService.isEnabled()) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    const info = await this.storageService.statObject(key);
    if (!info) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    const detected = info.contentType || mime.lookup(key) || '';
    const inline = INLINE_TYPES.test(detected);

    res.setHeader(
      'Content-Type',
      inline ? detected : 'application/octet-stream',
    );
    if (!inline) {
      res.setHeader('Content-Disposition', 'attachment');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', this.mediaUrls.cacheControl(expiresNum));
    res.setHeader('Accept-Ranges', 'bytes');

    const rangeHeader = req.headers.range;
    const range = parseRange(
      typeof rangeHeader === 'string' ? rangeHeader : undefined,
      info.size,
    );

    if (range === null) {
      res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
      res.setHeader('Content-Range', `bytes */${info.size}`);
      res.end();
      return;
    }

    if (range) {
      res.status(HttpStatus.PARTIAL_CONTENT);
      res.setHeader(
        'Content-Range',
        `bytes ${range.start}-${range.end}/${info.size}`,
      );
      res.setHeader('Content-Length', range.end - range.start + 1);
    } else {
      res.setHeader('Content-Length', info.size);
    }

    const body = await this.storageService.getObject(key, range);
    try {
      await pipeline(body, res);
    } catch {
      // Client went away mid-stream, or the storage read failed after headers
      // were sent; there is nothing left to report to the client.
      res.destroy();
    }
  }
}
