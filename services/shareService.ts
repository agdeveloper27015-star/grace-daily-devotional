interface ShareVersePayload {
  text: string;
  reference: string;
  bookAbbrev?: string;
  chapter?: number;
  verse?: number;
}

export type ShareResult = 'shared' | 'copied' | 'failed';

const buildDeepLink = (payload: ShareVersePayload): string => {
  const base = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, '') || window.location.origin;

  if (!payload.bookAbbrev || !payload.chapter) {
    return base;
  }

  const url = new URL(base);
  url.searchParams.set('book', payload.bookAbbrev);
  url.searchParams.set('chapter', String(payload.chapter));
  if (payload.verse) {
    url.searchParams.set('verse', String(payload.verse));
  }

  return url.toString();
};

const copyToClipboard = async (value: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // no-op
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};

export const shareVerse = async (payload: ShareVersePayload): Promise<ShareResult> => {
  const deepLink = buildDeepLink(payload);
  const body = `"${payload.text}"\n\n${payload.reference}\n${deepLink}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: payload.reference,
        text: `"${payload.text}"\n\n${payload.reference}`,
        url: deepLink,
      });
      return 'shared';
    } catch {
      // user canceled or share failed; fallback to copy
    }
  }

  const copied = await copyToClipboard(body);
  return copied ? 'copied' : 'failed';
};
