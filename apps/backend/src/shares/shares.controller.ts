import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { SharesService } from './shares.service';
import { ShareImageService } from './image/share-image.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import { createShareLinkSchema, CreateShareLink } from 'shared-schemas';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';

@Controller('shares')
export class SharesController {
  constructor(
    private readonly sharesService: SharesService,
    private readonly shareImageService: ShareImageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ZodValidation(createShareLinkSchema)
  async createShareLink(
    @Request() req: RequestWithUser,
    @Body() dto: CreateShareLink,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.sharesService.createShareLink(req.user.id, dto, baseUrl);
  }

  // Must be before :token to avoid the wildcard matching "image"
  @Get(':token/image')
  @Header('Content-Type', 'image/png')
  @Header('Cache-Control', 'no-cache')
  async getShareImage(@Param('token') token: string, @Res() res: Response) {
    const data = await this.sharesService.getSharedResource(token);
    const png = await this.shareImageService.generateImage(data);
    res.send(png);
  }

  @Get(':token')
  async getSharedResource(@Param('token') token: string) {
    return this.sharesService.getSharedResource(token);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async revokeShareLink(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sharesService.revokeShareLink(id, req.user.id);
  }
}
