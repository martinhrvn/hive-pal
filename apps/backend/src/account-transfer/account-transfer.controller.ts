import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as crypto from 'node:crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { StorageService } from '../storage/storage.interface';
import { AccountTransferService } from './account-transfer.service';
import { AccountTransferExportRunner } from './account-transfer.export.runner';
import { AccountTransferImportRunner } from './account-transfer.import.runner';
import { toJobResponse } from './dto/job.dto';

@Controller('account-transfer')
@UseGuards(JwtAuthGuard)
export class AccountTransferController {
  constructor(
    private readonly jobs: AccountTransferService,
    private readonly exportRunner: AccountTransferExportRunner,
    private readonly importRunner: AccountTransferImportRunner,
    private readonly storage: StorageService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('AccountTransferController');
  }

  @Post('export')
  async startExport(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const job = await this.jobs.createJob(userId, 'EXPORT');
    setImmediate(() => {
      this.exportRunner.run(job.id, userId).catch((err) => {
        this.logger.error({
          message: 'Unhandled export runner error',
          jobId: job.id,
          error: (err as Error).message,
        });
      });
    });
    return { jobId: job.id };
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async startImport(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const userId = req.user.id;

    // Stash the upload in storage so the runner can read it later
    const inputKey = `account-transfer/imports/${userId}/${crypto.randomUUID()}.zip`;
    await this.storage.uploadObject(
      inputKey,
      file.buffer,
      file.mimetype || 'application/zip',
    );

    const job = await this.jobs.createJob(userId, 'IMPORT', inputKey);
    setImmediate(() => {
      this.importRunner.run(job.id, userId).catch((err) => {
        this.logger.error({
          message: 'Unhandled import runner error',
          jobId: job.id,
          error: (err as Error).message,
        });
      });
    });
    return { jobId: job.id };
  }

  @Get('jobs')
  async listJobs(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const list = await this.jobs.listJobs(userId);
    return list.map(toJobResponse);
  }

  @Get('jobs/:id')
  async getJob(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const userId = req.user.id;
    const job = await this.jobs.getJob(userId, id);
    return toJobResponse(job);
  }

  @Get('jobs/:id/download')
  async downloadResult(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const job = await this.jobs.getJob(userId, id);
    if (job.type !== 'EXPORT') {
      throw new BadRequestException('Only export jobs have downloads');
    }
    if (job.status !== 'COMPLETED' || !job.resultStorageKey) {
      throw new NotFoundException('Result not available');
    }
    if (job.resultExpiresAt && job.resultExpiresAt < new Date()) {
      throw new GoneException('Result has expired and was purged');
    }
    const stream = await this.storage.getObject(job.resultStorageKey);
    const filename = `hivepal-export-${userId}-${job.createdAt.toISOString().slice(0, 10)}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    stream.pipe(res);
  }

  @Delete('jobs/:id')
  async deleteJob(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    await this.jobs.deleteJob(req.user.id, id);
    return { ok: true };
  }
}
