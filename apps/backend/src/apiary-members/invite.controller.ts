import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiaryMembersService } from './apiary-members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Standalone endpoint for accepting apiary invitations by token.
 * Does not require an apiaryId path segment — the token identifies the invite.
 */
@ApiTags('invite')
@Controller('invite')
export class InviteController {
  constructor(private readonly membersService: ApiaryMembersService) {}

  @Post('accept/:token')
  @UseGuards(JwtAuthGuard)
  acceptInvite(
    @Param('token') token: string,
  ): Promise<{ apiaryId: string }> {
    return this.membersService.acceptInvite(token);
  }
}
