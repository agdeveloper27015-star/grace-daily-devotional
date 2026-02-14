import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DAILY_VERSES } from '../../data/dailyVerses';

const mockBible = [
  {
    abbrev: 'gn',
    name: 'Genesis',
    chapters: [
      ['v1', 'v2'],
      ['v3'],
    ],
  },
  {
    abbrev: 'ex',
    name: 'Exodo',
    chapters: [['v4']],
  },
];

describe('bibleService', () => {
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
      vi.fn(async () => new Response(JSON.stringify(mockBible), { status: 200, headers: { 'content-type': 'application/json' } }))
    );
  });

  it('carrega a Biblia local e calcula versiculos lidos por capitulos unicos', async () => {
    const service = await import('../../services/bibleService');

    service.markChapterRead('gn', 1);
    service.markChapterRead('gn', 1);
    service.markChapterRead('gn', 2);

    const chapters = service.getChaptersRead();
    expect(chapters).toHaveLength(2);

    const totalVerses = await service.getTotalReadVerses();
    expect(totalVerses).toBe(3);

    expect(fetch).toHaveBeenCalledWith('/data/pt_acf.json');
  });

  it('retorna versiculo diario deterministico sem deslocamento no dia 1', async () => {
    const service = await import('../../services/bibleService');

    const jan1 = service.getDailyVerse(new Date('2026-01-01T12:00:00'));
    const jan2 = service.getDailyVerse(new Date('2026-01-02T12:00:00'));

    expect(jan1.reference).toBe(DAILY_VERSES[0].reference);
    expect(jan2.reference).toBe(DAILY_VERSES[1].reference);
    expect(service.DAILY_VERSE_COUNT).toBe(365);
  });
});
