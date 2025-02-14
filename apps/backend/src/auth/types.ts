import { Request } from 'express';

export interface JwtPayload {
  username: string;
  sub: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
