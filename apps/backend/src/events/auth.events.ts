export class UserLoginEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly lastLoginAt: Date | null,
  ) {}
}
