import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { pillVariants } from './pill-variants';


export interface PillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pillVariants> {
  color?: 'neutral' | 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate';
  asChild?: boolean;
  icon?: React.ReactNode;
}

const Pill = React.forwardRef<HTMLButtonElement, PillProps>(
  (
    {
      className,
      color,
      size,
      active,
      asChild = false,
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        role="checkbox"
        aria-checked={active ?? undefined}
        data-state={active ? 'checked' : 'unchecked'}
        className={cn(pillVariants({ color, size, active, className }))}
        ref={ref}
        {...props}
      >
        {icon}
        {children}
      </Comp>
    );
  },
);

Pill.displayName = 'Pill';

export { Pill };
