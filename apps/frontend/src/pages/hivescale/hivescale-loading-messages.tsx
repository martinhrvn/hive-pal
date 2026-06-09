import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeeLoadingMessagesProps {
  /** Milliseconds each message stays on screen before cycling. */
  intervalMs?: number;
  className?: string;
}

export const BeeLoadingMessages = ({
  intervalMs = 1800,
  className,
}: BeeLoadingMessagesProps) => {
  const { t } = useTranslation('hivescale');

  const messages = useMemo(() => {
    const raw = t('loading.messages', { returnObjects: true });
    return Array.isArray(raw) && raw.length > 0
      ? (raw as string[])
      : [t('loading.fallback')];
  }, [t]);

  const [index, setIndex] = useState(() => {
    // Pick a random starting message. crypto.getRandomValues is used instead of
    // Math.random() purely to satisfy static analysis (the value is cosmetic and
    // not security-sensitive); it is widely supported in modern browsers.
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0];
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex(prev => prev + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  const message = messages[index % messages.length];

  return (
    <div
      className={cn(
        'flex h-96 w-full flex-col items-center justify-center gap-4 text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" aria-hidden />
      {/* key forces a remount so the fade-in animation replays each cycle */}
      <p
        key={index}
        className="animate-in fade-in min-h-6 text-center text-sm font-medium duration-700"
      >
        {message}
      </p>
    </div>
  );
};
