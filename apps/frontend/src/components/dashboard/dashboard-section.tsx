import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLocalStorageBoolean } from '@/hooks/use-local-storage-boolean';
import { cn } from '@/lib/utils';

type DashboardSectionProps = {
  /** localStorage key remembering whether the section is expanded. */
  storageKey: string;
  title: string;
  /** Right-aligned header content, e.g. a link or a menu. */
  action?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * A collapsible dashboard section with a consistent heading row. Every
 * section on the home page uses this, so headers line up and share rhythm.
 */
export function DashboardSection({
  storageKey,
  title,
  action,
  children,
}: DashboardSectionProps) {
  const [open, setOpen] = useLocalStorageBoolean(storageKey, true);
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
          <h2 id={headingId}>
            <CollapsibleTrigger className="group -ml-1 flex items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-foreground transition-colors hover:text-honey-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ChevronDown
                className={cn(
                  'size-4 text-muted-foreground transition-transform group-hover:text-honey-foreground',
                  !open && '-rotate-90',
                )}
              />
              {title}
            </CollapsibleTrigger>
          </h2>
          {action}
        </div>
        <CollapsibleContent>{children}</CollapsibleContent>
      </Collapsible>
    </section>
  );
}
