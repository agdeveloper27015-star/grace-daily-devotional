import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shareVerse } from '../../services/shareService';

describe('shareService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('usa navigator.share quando disponivel', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
    });

    const result = await shareVerse({
      text: 'Posso todas as coisas',
      reference: 'Filipenses 4:13',
      bookAbbrev: 'fp',
      chapter: 4,
      verse: 13,
    });

    expect(result).toBe('shared');
    expect(shareMock).toHaveBeenCalled();
  });

  it('faz fallback para clipboard quando Web Share nao existe', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    });

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const result = await shareVerse({
      text: 'O Senhor e meu pastor',
      reference: 'Salmos 23:1',
    });

    expect(result).toBe('copied');
    expect(writeText).toHaveBeenCalled();
  });
});
