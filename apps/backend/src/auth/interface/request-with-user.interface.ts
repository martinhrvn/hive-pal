import { Request } from 'express';
import { User } from 'shared-schemas';

export interface RequestWithUser extends Request {
  user: User;
}

export interface JwtPayload {
  email: string;
  sub: string;
  role: User['role'];
  name: User['name'];
  passwordChangeRequired: boolean;
}

export interface RequestWithJWTUser extends Request {
  user: JwtPayload;
}
