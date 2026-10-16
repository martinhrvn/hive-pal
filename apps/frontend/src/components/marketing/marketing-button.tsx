import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// The marketing pages are always light. Building on the shadcn button's
// `default` variant (which has no dark: classes) keeps the outline and ghost
// variants from picking up dark-input styles when the OS is in dark mode.
const marketingButtonVariants = cva('', {
  variants: {
    variant: {
      primary:
        'bg-amber-400 text-stone-950 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.55)] hover:bg-amber-300',
      dark: 'bg-stone-900 text-amber-50 hover:bg-stone-800',
      outline:
        'border border-stone-900/20 bg-transparent text-stone-900 hover:bg-stone-900 hover:text-amber-50',
      outlineOnImage:
        'border border-amber-50/40 bg-stone-950/20 text-amber-50 backdrop-blur-sm hover:bg-amber-50 hover:text-stone-900',
      ghost:
        'bg-transparent text-stone-700 hover:bg-stone-900/5 hover:text-stone-900',
    },
  },
});

type MarketingButtonProps = Readonly<
  Omit<ComponentProps<typeof Button>, 'variant'> &
    Required<VariantProps<typeof marketingButtonVariants>>
>;

export function MarketingButton({
  variant,
  className,
  ...props
}: MarketingButtonProps) {
  return (
    <Button
      variant="default"
      className={cn(marketingButtonVariants({ variant }), className)}
      {...props}
    />
  );
}
