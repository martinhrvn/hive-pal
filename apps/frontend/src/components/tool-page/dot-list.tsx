import { cn } from '@/lib/utils';

interface DotListProps {
  readonly items: readonly string[];
  readonly className?: string;
}

export function DotList({ items, className }: DotListProps) {
  return (
    <ul className={cn('space-y-3 text-sm text-muted-foreground', className)}>
      {items.map(item => (
        <li key={item} className="flex gap-2">
          <span
            aria-hidden
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
