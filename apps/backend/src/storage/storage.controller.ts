import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import * as mime from 'mime-types';
import { StorageService } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

@Controller('storage')
export class StorageController {
  constructor(
    @Inject(StorageService)
    private readonly storageService: StorageService,
  ) { }

  @Get('files/*key')
  async serveFile(
    @Param('key') key: string,
    @Query('token') token: string,
    @Query('expires') expires: string,
    @Res() res: Response,
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

    try {
      await stat(filePath);
    } catch {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }
}
