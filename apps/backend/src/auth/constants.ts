// auth/constants.ts
export const jwtConstants = {
  secret:
    process.env.JWT_SECRET ||
    'your-temporary-secret-key-change-this-in-production',
};
