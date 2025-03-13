import { Request } from 'express';
import { User } from './user.interface';

export interface RequestWithUser extends Request {
  user: User;
}

export interface JwtPayload {
  email: string;
  sub: string;
  role: string;
}

export interface RequestWithJWTUser extends Request {
  user: JwtPayload;
}
