import { Request } from 'express';
import { User } from './user.interface';

export interface RequestWithUser extends Request {
  user: User;
}
