import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiaryMembersService } from './apiary-members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ApiaryRoleGuard } from '../guards/apiary-role.guard';
import { RequireApiaryRole } from '../guards/decorators/require-apiary-role.decorator';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { ZodValidation } from '../common';
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  InviteMember,
  UpdateMemberRole,
  ApiaryMember,
} from 'shared-schemas';

/**
 * Public endpoint — no JWT required. Accepts an invite token from email link.
 * Redirecting to login happens on the frontend; after login the frontend calls this.
 */
@ApiTags('apiary-members')
@Controller('apiaries/:apiaryId/members')
export class ApiaryMembersController {
  constructor(private readonly membersService: ApiaryMembersService) {}

  /**
   * Accept an invitation by token. The caller must be authenticated (JWT) and
   * must be the invited user. The token is used to look up the invite.
   */
  @Post('accept/:token')
  @UseGuards(JwtAuthGuard)
  acceptInvite(
    @Param('token') token: string,
  ): Promise<{ apiaryId: string }> {
    return this.membersService.acceptInvite(token);
  }

  @Get()
  @UseGuards(JwtAuthGuard, ApiaryContextGuard)
  findAll(@Req() req: RequestWithApiary): Promise<ApiaryMember[]> {
    return this.membersService.findAll(req.apiaryId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryRoleGuard)
  @RequireApiaryRole('OWNER')
  @ZodValidation(inviteMemberSchema)
  invite(
    @Req() req: RequestWithApiary,
    @Body() dto: InviteMember,
  ): Promise<ApiaryMember> {
    return this.membersService.invite(req.apiaryId, req.user.id, dto);
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryRoleGuard)
  @RequireApiaryRole('OWNER')
  @ZodValidation(updateMemberRoleSchema)
  updateRole(
    @Param('userId') targetUserId: string,
    @Req() req: RequestWithApiary,
    @Body() dto: UpdateMemberRole,
  ): Promise<ApiaryMember> {
    return this.membersService.updateRole(
      req.apiaryId,
      targetUserId,
      req.user.id,
      dto,
    );
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryRoleGuard)
  @RequireApiaryRole('OWNER')
  removeMember(
    @Param('userId') targetUserId: string,
    @Req() req: RequestWithApiary,
  ): Promise<void> {
    return this.membersService.removeMember(
      req.apiaryId,
      targetUserId,
      req.user.id,
    );
  }
}
