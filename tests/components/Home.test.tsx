import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '../../components/Home';

const bibleServiceMocks = vi.hoisted(() => ({
  getDailyVerse: vi.fn(),
  getReadingPercentage: vi.fn(),
  getReadingProgress: vi.fn(),
  parseReference: vi.fn(),
}));

vi.mock('../../services/bibleService', () => ({
  getDailyVerse: bibleServiceMocks.getDailyVerse,
  getReadingPercentage: bibleServiceMocks.getReadingPercentage,
  getReadingProgress: bibleServiceMocks.getReadingProgress,
  parseReference: bibleServiceMocks.parseReference,
}));

describe('Home', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    bibleServiceMocks.getDailyVerse.mockReturnValue({
      text: 'O Senhor e fiel.',
      reference: '2 Tessalonicenses 3:3',
    });
    bibleServiceMocks.getReadingProgress.mockReturnValue({
      bookAbbrev: 'gn',
      bookName: 'Genesis',
      chapter: 1,
      timestamp: Date.now(),
    });
    bibleServiceMocks.getReadingPercentage.mockResolvedValue(2);
    bibleServiceMocks.parseReference.mockResolvedValue({
      bookAbbrev: '2ts',
      chapter: 3,
      verse: 3,
    });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it('renderiza blocos editoriais e permite navegar pelo menu explorar', async () => {
    const onNavigate = vi.fn();

    await act(async () => {
      root.render(<Home onNavigate={onNavigate} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Inspiracao diaria');
    expect(container.textContent).toContain('O Senhor e fiel.');
    expect(container.textContent).toContain('2 Tessalonicenses 3:3');
    expect(container.textContent).toContain('Genesis 1');
    expect(container.textContent).toContain('2%');
    expect(container.textContent).toContain('Explorar');

    const favoritosButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Favoritos')
    );
    expect(favoritosButton).not.toBeUndefined();

    await act(async () => {
      favoritosButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onNavigate).toHaveBeenCalledWith('CADERNO', { notebookTab: 'FAVORITOS' });
  });
});
