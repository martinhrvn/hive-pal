export interface RequestWithApiary extends Request {
  apiaryId: string;
  apiaryRole: 'OWNER' | 'EDITOR' | 'VIEWER';
  user: {
    id: string;
  };
}

export interface ApiaryUserFilter {
  apiaryId: string;
  userId: string;
}
