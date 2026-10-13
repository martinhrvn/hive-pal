import { cva, type VariantProps } from 'class-variance-authority';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const iconBadgeVariants = cva(
  'flex shrink-0 items-center justify-center rounded-full',
  {
    variants: {
      tone: {
        honey: 'bg-honey-muted text-honey-foreground',
        info: 'bg-info-muted text-info-foreground',
      },
      size: {
        sm: 'size-6 rounded-md [&>svg]:size-4',
        md: 'size-10 [&>svg]:size-5',
        lg: 'size-12 [&>svg]:size-6',
      },
    },
    defaultVariants: { tone: 'honey', size: 'md' },
  },
);

/** A round tinted container for a single icon. */
export function IconBadge({
  tone,
  size,
  className,
  children,
}: VariantProps<typeof iconBadgeVariants> & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(iconBadgeVariants({ tone, size }), className)}>
      {children}
    </div>
  );
}

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Call-to-action(s), stacked under the description. */
  children?: React.ReactNode;
};

/** A centered empty state card: icon, title, description, then actions. */
export function EmptyState({
  icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <Card className="items-center gap-4 px-6 py-10 text-center">
      <IconBadge size="lg">{icon}</IconBadge>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-md text-muted-foreground">{description}</p>
      </div>
      {children}
    </Card>
  );
}
