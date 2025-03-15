export interface RequestWithApiary extends Request {
  apiaryId: string;
  user: {
    id: string;
  };
}

export interface ApiaryUserFilter {
  apiaryId: string;
  userId: string;
}
