import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPlan = {
  id: 'bible-1y',
  title: 'Biblia em 1 ano',
  description: 'Plano teste',
  totalDays: 2,
  days: [
    { day: 1, chapters: [{ bookAbbrev: 'gn', bookName: 'Genesis', chapter: 1 }] },
    { day: 2, chapters: [{ bookAbbrev: 'gn', bookName: 'Genesis', chapter: 2 }] },
  ],
};

describe('readingPlanService', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    });

    localStorage.clear();
    vi.restoreAllMocks();
    vi.resetModules();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(mockPlan), { status: 200, headers: { 'content-type': 'application/json' } }))
    );
  });

  it('ativa plano manual e conclui dia automaticamente ao abrir capitulos do dia', async () => {
    const service = await import('../../services/readingPlanService');

    service.activatePlan(new Date('2026-01-01T10:00:00'));

    const today = await service.getTodayPlan(new Date('2026-01-01T12:00:00'));
    expect(today?.dayIndex).toBe(1);
    expect(today?.completed).toBe(false);

    await service.markChapterOpened('gn', 1, new Date('2026-01-01T13:00:00'));

    const done = await service.getTodayPlan(new Date('2026-01-01T14:00:00'));
    expect(done?.completed).toBe(true);
  });
});
