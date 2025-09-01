import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, Role } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { FeedbackType, FeedbackStatus } from '@prisma/client';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit feedback (authentication optional)' })
  @ApiResponse({
    status: 201,
    description: 'Feedback submitted successfully',
  })
  async createFeedback(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Req() req: RequestWithUser,
  ) {
    // Check if user is authenticated (optional)
    const userId = req.user?.id || null;
    return this.feedbackService.create({
      ...createFeedbackDto,
      userId,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all feedback (admin only)' })
  async getAllFeedback(
    @Query('type') type?: FeedbackType,
    @Query('status') status?: FeedbackStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.feedbackService.findAll({
      type,
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my feedback submissions' })
  async getMyFeedback(@Req() req: RequestWithUser) {
    return this.feedbackService.findByUserId(req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update feedback status (admin only)' })
  async updateFeedbackStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFeedbackStatusDto,
  ) {
    return this.feedbackService.updateStatus(id, updateStatusDto.status);
  }
}