import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Role,
} from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { EquipmentService } from './equipment.service';
import { UsersStatsService } from './users-stats.service';
import {
  AdminResetPassword,
  ChangePassword,
  UserResponse,
  UserPreferences,
  UpdateUserInfo,
  EquipmentItemWithCalculations,
  EquipmentMultiplier,
  EquipmentPlan,
  CreateEquipmentItem,
  UpdateEquipmentItem,
  adminResetPasswordSchema,
  changePasswordSchema,
  userPreferencesSchema,
  updateUserInfoSchema,
  UserWithStatsResponse,
  UserDetailedStats,
} from 'shared-schemas';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly equipmentService: EquipmentService,
    private readonly usersStatsService: UsersStatsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('UsersController');
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with stats (admin only)' })
  async findAll(): Promise<UserWithStatsResponse[]> {
    this.logger.log('Admin requesting list of all users with stats');
    const users = await this.usersService.findAll();
    const userIds = users.map((u) => u.id);
    const statsMap = await this.usersStatsService.getUsersSummaryStats(userIds);

    return users.map((user) => ({
      ...user,
      stats: statsMap.get(user.id) || {
        apiariesCount: 0,
        hivesCount: 0,
        inspectionsCount: 0,
        lastActivityDate: null,
      },
    }));
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed user statistics (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved',
  })
  async getUserStats(@Param('id') id: string): Promise<UserDetailedStats> {
    this.logger.log(`Admin requesting detailed stats for user ${id}`);
    return this.usersStatsService.getUserDetailedStats(id);
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reset a user's password (admin only)" })
  async resetPassword(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminResetPasswordSchema))
    resetPasswordDto: AdminResetPassword,
    @Req() req: RequestWithUser,
  ): Promise<UserResponse> {
    this.logger.log(
      `Admin user ${req.user.id} resetting password for user ${id}`,
    );
    return this.usersService.resetPassword(id, resetPasswordDto.tempPassword);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change own password' })
  async changePassword(
    @Req() req: RequestWithUser,
    @Body(new ZodValidationPipe(changePasswordSchema))
    changePasswordDto: ChangePassword,
  ): Promise<UserResponse> {
    this.logger.log(`User ${req.user.id} changing their password`);

    const user = await this.usersService.findById(req.user.id);

    if (!user) {
      this.logger.warn(
        `User ${req.user.id} not found when trying to change password`,
      );
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `User ${req.user.id} provided invalid current password when changing password`,
      );
      throw new UnauthorizedException('Current password is incorrect');
    }

    this.logger.log(
      `Password change verified for user ${req.user.id}, updating password`,
    );
    return this.usersService.changePassword(
      req.user.id,
      changePasswordDto.newPassword,
    );
  }

  // Equipment endpoints using new structure
  @Get('equipment/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all equipment items for user' })
  @ApiResponse({
    status: 200,
    description: 'Equipment items retrieved',
  })
  async getEquipmentItems(
    @Req() req: RequestWithUser,
  ): Promise<EquipmentItemWithCalculations[]> {
    this.logger.log(`User ${req.user.id} requesting equipment items`);
    return this.equipmentService.getEquipmentItems(req.user.id);
  }

  @Get('equipment/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific equipment item' })
  @ApiResponse({
    status: 200,
    description: 'Equipment item retrieved',
  })
  async getEquipmentItem(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
  ): Promise<EquipmentItemWithCalculations> {
    this.logger.log(`User ${req.user.id} requesting equipment item ${itemId}`);
    return this.equipmentService.getEquipmentItem(req.user.id, itemId);
  }

  @Put('equipment/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update equipment item' })
  @ApiResponse({
    status: 200,
    description: 'Equipment item updated',
  })
  async updateEquipmentItem(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
    @Body() data: UpdateEquipmentItem,
  ): Promise<EquipmentItemWithCalculations> {
    this.logger.log(`User ${req.user.id} updating equipment item ${itemId}`);
    return this.equipmentService.updateEquipmentItem(req.user.id, itemId, data);
  }

  @Post('equipment/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create custom equipment item' })
  @ApiResponse({
    status: 201,
    description: 'Equipment item created',
  })
  async createEquipmentItem(
    @Req() req: RequestWithUser,
    @Body() data: CreateEquipmentItem,
  ): Promise<EquipmentItemWithCalculations> {
    this.logger.log(`User ${req.user.id} creating custom equipment item`);
    return this.equipmentService.createEquipmentItem(req.user.id, data);
  }

  @Delete('equipment/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete custom equipment item' })
  @ApiResponse({
    status: 204,
    description: 'Equipment item deleted',
  })
  async deleteEquipmentItem(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    this.logger.log(`User ${req.user.id} deleting equipment item ${itemId}`);
    return this.equipmentService.deleteEquipmentItem(req.user.id, itemId);
  }

  @Get('equipment/multiplier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get equipment multiplier' })
  @ApiResponse({
    status: 200,
    description: 'Equipment multiplier retrieved',
  })
  async getEquipmentMultiplier(
    @Req() req: RequestWithUser,
  ): Promise<EquipmentMultiplier> {
    this.logger.log(`User ${req.user.id} requesting equipment multiplier`);
    return this.equipmentService.getEquipmentMultiplier(req.user.id);
  }

  @Put('equipment/multiplier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update equipment multiplier' })
  @ApiResponse({
    status: 200,
    description: 'Equipment multiplier updated',
  })
  async updateEquipmentMultiplier(
    @Req() req: RequestWithUser,
    @Body() data: EquipmentMultiplier,
  ): Promise<EquipmentMultiplier> {
    this.logger.log(`User ${req.user.id} updating equipment multiplier`);
    return this.equipmentService.updateEquipmentMultiplier(
      req.user.id,
      data.targetMultiplier,
    );
  }

  @Get('equipment/plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get equipment plan with calculations' })
  @ApiResponse({
    status: 200,
    description: 'Equipment plan retrieved',
  })
  async getEquipmentPlan(@Req() req: RequestWithUser): Promise<EquipmentPlan> {
    this.logger.log(`User ${req.user.id} requesting equipment plan`);
    return this.equipmentService.getEquipmentPlan(req.user.id);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user preferences' })
  async getUserPreferences(
    @Req() req: RequestWithUser,
  ): Promise<UserPreferences | null> {
    this.logger.log(`User ${req.user.id} requesting preferences`);
    return this.usersService.getUserPreferences(req.user.id);
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user preferences' })
  async updateUserPreferences(
    @Req() req: RequestWithUser,
    @Body(new ZodValidationPipe(userPreferencesSchema))
    preferences: UserPreferences,
  ): Promise<UserPreferences> {
    this.logger.log(`User ${req.user.id} updating preferences`);
    return this.usersService.updateUserPreferences(req.user.id, preferences);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile information' })
  async getUserProfile(@Req() req: RequestWithUser): Promise<UserResponse> {
    this.logger.log(`User ${req.user.id} requesting profile`);
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password: _, ...userProfile } = user;
    return userProfile;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile information' })
  async updateUserProfile(
    @Req() req: RequestWithUser,
    @Body(new ZodValidationPipe(updateUserInfoSchema))
    updateData: UpdateUserInfo,
  ): Promise<UserResponse> {
    this.logger.log(`User ${req.user.id} updating profile`);
    return this.usersService.updateUserInfo(req.user.id, updateData);
  }
}
