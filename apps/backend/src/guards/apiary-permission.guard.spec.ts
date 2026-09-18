import type { Mock } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiaryPermissionGuard } from './apiary-permission.guard';

describe('ApiaryPermissionGuard', () => {
  let guard: ApiaryPermissionGuard;
  let reflector: { getAllAndOverride: Mock };

  beforeEach(() => {
    // Default: handlers are NOT @ApiaryOptional().
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    guard = new ApiaryPermissionGuard(reflector as unknown as Reflector);
  });

  function createMockContext(method: string, apiaryRole?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ method, apiaryRole }),
      }),
      getHandler: () => () => undefined,
      getClass: () => class {},
    } as unknown as Parameters<typeof guard.canActivate>[0];
  }

  it('should allow GET requests for VIEWER role', () => {
    expect(guard.canActivate(createMockContext('GET', 'VIEWER'))).toBe(true);
  });

  it('should allow GET requests for EDITOR role', () => {
    expect(guard.canActivate(createMockContext('GET', 'EDITOR'))).toBe(true);
  });

  it('should allow GET requests for OWNER role', () => {
    expect(guard.canActivate(createMockContext('GET', 'OWNER'))).toBe(true);
  });

  it('should allow POST requests for OWNER role', () => {
    expect(guard.canActivate(createMockContext('POST', 'OWNER'))).toBe(true);
  });

  it('should allow PATCH requests for EDITOR role', () => {
    expect(guard.canActivate(createMockContext('PATCH', 'EDITOR'))).toBe(true);
  });

  it('should allow DELETE requests for OWNER role', () => {
    expect(guard.canActivate(createMockContext('DELETE', 'OWNER'))).toBe(true);
  });

  it('should throw ForbiddenException for POST with VIEWER role', () => {
    expect(() =>
      guard.canActivate(createMockContext('POST', 'VIEWER')),
    ).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException for PATCH with VIEWER role', () => {
    expect(() =>
      guard.canActivate(createMockContext('PATCH', 'VIEWER')),
    ).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException for DELETE with VIEWER role', () => {
    expect(() =>
      guard.canActivate(createMockContext('DELETE', 'VIEWER')),
    ).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException for a write without an apiary role', () => {
    expect(() => guard.canActivate(createMockContext('POST'))).toThrow(
      ForbiddenException,
    );
  });

  describe('@ApiaryOptional() handlers', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(true);
    });

    it('skips the header-role check for writes (service authorizes at the resource level)', () => {
      expect(guard.canActivate(createMockContext('POST'))).toBe(true);
      expect(guard.canActivate(createMockContext('PATCH', 'VIEWER'))).toBe(
        true,
      );
      expect(guard.canActivate(createMockContext('DELETE', 'VIEWER'))).toBe(
        true,
      );
    });
  });
});
