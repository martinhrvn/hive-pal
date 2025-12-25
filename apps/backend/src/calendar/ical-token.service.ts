import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface ICalTokenPayload {
  sub: string; // userId
  apiaryId: string;
  purpose: 'ical';
}

@Injectable()
export class ICalTokenService {
  constructor(private jwtService: JwtService) {}

  generateSubscriptionToken(userId: string, apiaryId: string): string {
    const payload: ICalTokenPayload = {
      sub: userId,
      apiaryId,
      purpose: 'ical',
    };

    // Token expires in 1 year
    return this.jwtService.sign(payload, { expiresIn: '365d' });
  }

  validateSubscriptionToken(
    token: string,
  ): { userId: string; apiaryId: string } | null {
    try {
      const payload = this.jwtService.verify<ICalTokenPayload>(token);

      // Validate it's an iCal token
      if (payload.purpose !== 'ical') {
        return null;
      }

      return {
        userId: payload.sub,
        apiaryId: payload.apiaryId,
      };
    } catch {
      return null;
    }
  }
}
