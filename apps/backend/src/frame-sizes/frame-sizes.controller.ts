import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { FrameSizesService } from './frame-sizes.service';
import { createFrameSizeSchema, CreateFrameSizeDto } from 'shared-schemas';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Role,
} from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { ZodValidation } from '../common';

@ApiTags('frame-sizes')
@Controller()
export class FrameSizesController {
  constructor(private readonly frameSizesService: FrameSizesService) {}

  // --- User endpoints ---

  @Get('frame-sizes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available frame sizes' })
  async findAll(@Req() req: RequestWithUser) {
    return this.frameSizesService.findAll(req.user.id);
  }

  @Post('frame-sizes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new frame size for review' })
  @ApiResponse({
    status: 201,
    description: 'Frame size submitted successfully',
  })
  @ZodValidation(createFrameSizeSchema)
  async create(
    @Body() createDto: CreateFrameSizeDto,
    @Req() req: RequestWithUser,
  ) {
    return this.frameSizesService.create({
      ...createDto,
      createdByUserId: req.user.id,
    });
  }

  // --- Admin endpoints ---

  @Get('admin/frame-sizes/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending frame size submissions (admin)' })
  async findPending() {
    return this.frameSizesService.findPending();
  }

  @Get('admin/frame-sizes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all frame sizes (admin)' })
  async findAllAdmin() {
    return this.frameSizesService.findAllAdmin();
  }

  @Put('admin/frame-sizes/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a frame size submission (admin)' })
  async approve(@Param('id') id: string) {
    return this.frameSizesService.approve(id);
  }

  @Put('admin/frame-sizes/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a frame size submission (admin)' })
  async reject(@Param('id') id: string) {
    return this.frameSizesService.reject(id);
  }

  @Delete('admin/frame-sizes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a frame size (admin, non-built-in only)' })
  async remove(@Param('id') id: string) {
    return this.frameSizesService.remove(id);
  }
}
