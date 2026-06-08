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
import { StorageService } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { createReadStream, type Stats } from 'node:fs';
import { stat } from 'node:fs/promises';

@Controller('storage')
export class StorageController {
  constructor(
    @Inject(StorageService)
    private readonly storageService: StorageService,
  ) {}

  @Get('files/*key')
  async serveFile(
    @Param('key') key: string,
    @Query('token') token: string,
    @Query('expires') expires: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    if (!(this.storageService instanceof LocalStorageService)) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    if (!token || !expires) {
      throw new HttpException('Missing token or expires', HttpStatus.FORBIDDEN);
    }

    const expiresNum = Number.parseInt(expires, 10);
    if (Number.isNaN(expiresNum)) {
      throw new HttpException('Invalid expires', HttpStatus.BAD_REQUEST);
    }

    if (!this.storageService.verifyToken(key, token, expiresNum)) {
      throw new HttpException('Invalid or expired token', HttpStatus.FORBIDDEN);
    }

    let filePath: string;
    try {
      filePath = this.storageService.getFilePath(key);
    } catch {
      throw new HttpException('Invalid path', HttpStatus.BAD_REQUEST);
    }

    let fileStats: Stats;
    try {
      fileStats = await stat(filePath);
    } catch {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    const fileSize = fileStats.size;

    const mimeType = mime.lookup(filePath);
    const contentType =
      typeof mimeType === 'string' ? mimeType : 'application/octet-stream';

    const rangeHeader = req.headers.range;
    const range = typeof rangeHeader === 'string' ? rangeHeader : undefined;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Accept-Ranges', 'bytes');

    // No range → send full file
    if (!range) {
      res.setHeader('Content-Length', fileSize);
      createReadStream(filePath).pipe(res);
      return;
    }

    // Parse range
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (!match) {
      res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      res.end();
      return;
    }

    const start = match[1] ? Number.parseInt(match[1], 10) : 0;
    const end = match[2] ? Number.parseInt(match[2], 10) : fileSize - 1;

    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start < 0 ||
      end >= fileSize ||
      start > end
    ) {
      res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      res.end();
      return;
    }

    const chunkSize = end - start + 1;

    res.status(HttpStatus.PARTIAL_CONTENT);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);

    createReadStream(filePath, { start, end }).pipe(res);
  }
}
