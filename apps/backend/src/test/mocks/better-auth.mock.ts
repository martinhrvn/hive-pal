/**
 * Lightweight stand-in for the ESM-only Better Auth packages
 * (`better-auth`, `better-auth/*`, `@better-auth/passkey`,
 * `@thallesp/nestjs-better-auth`) so that ts-jest (CommonJS) unit tests can
 * import modules that transitively pull in Better Auth without crashing on
 * `Cannot use import statement outside a module`.
 *
 * Only the named bindings actually referenced by the auth wiring are needed;
 * guards are overridden in unit tests, so none of this is ever executed.
 *
 * This mock is mapped in `jest.config.cjs` only — the e2e config uses the real
 * packages.
 */

// @thallesp/nestjs-better-auth
export class AuthGuard {
  canActivate(): boolean {
    return true;
  }
}

export const AuthModule = {
  forRoot: () => ({ module: class MockAuthModule {} }),
};

export class AuthService {}

// better-auth
export const betterAuth = () => ({
  api: { getSession: () => Promise.resolve(null) },
  handler: () => Promise.resolve(undefined),
  options: {},
});

// better-auth/adapters/prisma
export const prismaAdapter = () => () => ({});

// better-auth/plugins
export const magicLink = () => ({});
export const admin = () => ({});
export const customSession = () => ({});

// @better-auth/passkey
export const passkey = () => ({});

// better-auth/api
export const createAuthMiddleware = (fn: unknown) => fn;

// better-auth/crypto
export const hashPassword = () => Promise.resolve('');
export const verifyPassword = () => Promise.resolve(false);

// better-auth/node
export const fromNodeHeaders = () => ({});

export default {};
