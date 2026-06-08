import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiaryContextGuard } from './apiary-context.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('ApiaryContextGuard', () => {
  let guard: ApiaryContextGuard;
  let prisma: { apiary: { findFirst: Mock } };

  beforeEach(async () => {
    prisma = {
      apiary: {
        findFirst: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiaryContextGuard,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = module.get<ApiaryContextGuard>(ApiaryContextGuard);
  });

  function createMockContext(overrides: {
    headers?: Record<string, string>;
    query?: Record<string, string>;
    user?: { id: string } | undefined;
  }) {
    const request = {
      headers: overrides.headers ?? {},
      query: overrides.query ?? {},
      user: overrides.user,
      apiaryId: undefined as string | undefined,
      apiaryRole: undefined as string | undefined,
    };

    return {
      context: {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as unknown as Parameters<typeof guard.canActivate>[0],
      request,
    };
  }

  it('should throw BadRequestException when apiaryId is missing from both header and query', async () => {
    const { context } = createMockContext({ user: { id: 'user-1' } });

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw ForbiddenException when user is not authenticated', async () => {
    const { context } = createMockContext({
      headers: { 'x-apiary-id': 'apiary-1' },
      user: undefined,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw NotFoundException when apiary is not found or user has no access', async () => {
    prisma.apiary.findFirst.mockResolvedValue(null);

    const { context } = createMockContext({
      headers: { 'x-apiary-id': 'apiary-1' },
      user: { id: 'user-1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('should set apiaryId and role OWNER when user owns the apiary', async () => {
    prisma.apiary.findFirst.mockResolvedValue({
      id: 'apiary-1',
      userId: 'user-1',
      members: [],
    });

    const { context, request } = createMockContext({
      headers: { 'x-apiary-id': 'apiary-1' },
      user: { id: 'user-1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.apiaryId).toBe('apiary-1');
    expect(request.apiaryRole).toBe('OWNER');
  });

  it('should set role EDITOR for an active member with EDITOR role', async () => {
    prisma.apiary.findFirst.mockResolvedValue({
      id: 'apiary-1',
      userId: 'other-user',
      members: [{ role: 'EDITOR' }],
    });

    const { context, request } = createMockContext({
      headers: { 'x-apiary-id': 'apiary-1' },
      user: { id: 'user-1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.apiaryId).toBe('apiary-1');
    expect(request.apiaryRole).toBe('EDITOR');
  });

  it('should set role VIEWER for an active member with VIEWER role', async () => {
    prisma.apiary.findFirst.mockResolvedValue({
      id: 'apiary-1',
      userId: 'other-user',
      members: [{ role: 'VIEWER' }],
    });

    const { context, request } = createMockContext({
      headers: { 'x-apiary-id': 'apiary-1' },
      user: { id: 'user-1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.apiaryRole).toBe('VIEWER');
  });

  it('should accept apiaryId from query param when header is missing', async () => {
    prisma.apiary.findFirst.mockResolvedValue({
      id: 'apiary-1',
      userId: 'user-1',
      members: [],
    });

    const { context, request } = createMockContext({
      query: { apiaryId: 'apiary-1' },
      user: { id: 'user-1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.apiaryId).toBe('apiary-1');
  });

  it('should throw ForbiddenException when user has no valid role', async () => {
    prisma.apiary.findFirst.mockResolvedValue({
      id: 'apiary-1',
      userId: 'other-user',
      members: [],
    });

    const { context } = createMockContext({
      headers: { 'x-apiary-id': 'apiary-1' },
      user: { id: 'user-1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
