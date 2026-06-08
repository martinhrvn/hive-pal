import type { Request } from 'express';
import { ApiaryRole } from '@/prisma/client';

export interface RequestWithApiary extends Request {
  apiaryId: string;
  apiaryRole: ApiaryRole;
  user: {
    id: string;
  };
}

export interface ApiaryUserFilter {
  apiaryId: string;
  userId: string;
}
