import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const statusPillVariants = cva(
  [
    'inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset transition-[color,background-color,transform]',
    '[&>svg]:size-3.5 [&>svg]:shrink-0',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    '[button&]:active:scale-[0.97] [a&]:active:scale-[0.97]',
  ],
  {
    variants: {
      tone: {
        neutral:
          'bg-muted text-muted-foreground ring-border [button&]:hover:bg-accent [a&]:hover:bg-accent',
        success:
          'bg-success-muted text-success-foreground ring-success/25 [button&]:hover:bg-success/15 [a&]:hover:bg-success/15',
        warning:
          'bg-warning-muted text-warning-foreground ring-warning/30 [button&]:hover:bg-warning/20 [a&]:hover:bg-warning/20',
        danger:
          'bg-destructive/10 text-destructive-foreground ring-destructive/25 [button&]:hover:bg-destructive/15 [a&]:hover:bg-destructive/15',
        info: 'bg-info-muted text-info-foreground ring-info/25 [button&]:hover:bg-info/15 [a&]:hover:bg-info/15',
      },
      size: {
        default: 'px-2.5 py-1 text-xs',
        sm: 'px-2 py-0.5 text-xs',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'default' },
  },
);

export type StatusTone = NonNullable<
  VariantProps<typeof statusPillVariants>['tone']
>;

/**
 * Small rounded status label. Renders a `<span>` by default; pass `asChild`
 * to style a `<button>` or `<Link>` (hover/press feedback then applies).
 */
export function StatusPill({
  className,
  tone,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof statusPillVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';
  return (
    <Comp
      data-slot="status-pill"
      className={cn(statusPillVariants({ tone, size }), className)}
      {...props}
    />
  );
}
