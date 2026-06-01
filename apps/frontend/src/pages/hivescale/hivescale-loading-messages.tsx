import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Playful bee-themed status lines shown while measurement data is being
// fetched/prepared. They cycle so a longer load feels alive instead of stuck.
const BEE_LOADING_MESSAGES = [
  'Data bee-ing prepared...',
  'Gathering fresh hive insights...',
  'Worker bees are sorting the combs...',
  'Extracting the sweet stuff...',
  'Buzzing through your data...',
  'Foraging for information...',
  "Honey, we're processing your request...",
  'The hive mind is thinking...',
  'Uncapping the latest data...',
  'Bee patient, results are on the way...',
  'Pollinating your dashboard...',
  'Waggle dance in progress...',
  "Checking the queen's records...",
  'Swarming through the database...',
  'Building the comb, one cell at a time...',
  'Hive got your data right here...',
  'Beehind the scenes magic happening...',
  'Cross-pollinating datasets...',
  'Preparing a fresh batch of hive metrics...',
] as const;

interface BeeLoadingMessagesProps {
  /** Milliseconds each message stays on screen before cycling. */
  intervalMs?: number;
  className?: string;
}

export const BeeLoadingMessages = ({
  intervalMs = 1800,
  className,
}: BeeLoadingMessagesProps) => {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * BEE_LOADING_MESSAGES.length),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex(prev => (prev + 1) % BEE_LOADING_MESSAGES.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

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
        {BEE_LOADING_MESSAGES[index]}
      </p>
    </div>
  );
};
