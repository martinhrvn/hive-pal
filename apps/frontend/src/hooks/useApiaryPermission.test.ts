import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApiaryPermission } from './useApiaryPermission';

const apiaries = [
  { id: 'a', name: 'A', role: 'OWNER' },
  { id: 'b', name: 'B', role: 'EDITOR' },
  { id: 'c', name: 'C', role: 'VIEWER' },
];

const useApiaryMock = vi.fn();
vi.mock('./use-apiary', () => ({ useApiary: () => useApiaryMock() }));

describe('useApiaryPermission', () => {
  beforeEach(() => {
    useApiaryMock.mockReturnValue({
      activeApiary: apiaries[2],
      apiaries,
      viewAllApiaries: false,
    });
  });

  it('uses the selected apiary when no apiary is given', () => {
    const { role, canEdit, isOwner } = useApiaryPermission();
    expect(role).toBe('VIEWER');
    expect(canEdit).toBe(false);
    expect(isOwner).toBe(false);
  });

  it("uses the resource's apiary when one is given", () => {
    expect(useApiaryPermission('a')).toMatchObject({
      role: 'OWNER',
      isOwner: true,
      canEdit: true,
    });
    expect(useApiaryPermission('b')).toMatchObject({
      role: 'EDITOR',
      isOwner: false,
      canEdit: true,
    });
    expect(useApiaryPermission('unknown').canEdit).toBe(false);
  });

  it('answers per apiary and falls back to the selected apiary when unknown', () => {
    const { canEditApiary } = useApiaryPermission();
    expect(canEditApiary('a')).toBe(true);
    expect(canEditApiary('c')).toBe(false);
    // Unknown resource apiary: fall back to the selected apiary (VIEWER here)
    expect(canEditApiary(undefined)).toBe(false);
  });

  it('reports whether any apiary is editable and whether apiaries are loaded', () => {
    expect(useApiaryPermission().canEditAny).toBe(true);
    expect(useApiaryPermission().isLoaded).toBe(true);

    useApiaryMock.mockReturnValue({
      activeApiary: undefined,
      apiaries: undefined,
      viewAllApiaries: true,
    });
    const loading = useApiaryPermission();
    expect(loading.isLoaded).toBe(false);
    expect(loading.canEditAny).toBe(false);
    expect(loading.viewAllApiaries).toBe(true);
  });
});
