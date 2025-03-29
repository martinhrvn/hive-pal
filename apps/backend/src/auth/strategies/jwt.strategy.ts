// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/request-with-user.interface';
import { User } from 'shared-schemas';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  validate(payload: JwtPayload): User {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name ?? '',
      passwordChangeRequired: payload.passwordChangeRequired,
    };
  }
}
