import { cva } from 'class-variance-authority';

export const pillVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-3 text-sm font-medium gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      color: {
        neutral: '',
        blue: '',
        green: '',
        red: '',
        amber: '',
        purple: '',
        slate: '',
      },
      size: {
        sm: 'h-6 text-xs py-0 px-2 [&>svg]:size-3.5',
        md: 'h-8 py-0 [&>svg]:size-4',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // Neutral - Default
      {
        color: 'neutral',
        active: false,
        className:
          'bg-background border-border hover:border-gray-400 [&>svg]:text-gray-400',
      },
      {
        color: 'neutral',
        active: true,
        className: 'bg-gray-100 border-gray-500 [&>svg]:text-gray-600',
      },

      // Blue
      {
        color: 'blue',
        active: false,
        className:
          'bg-background border-border hover:border-blue-400 [&>svg]:text-blue-400',
      },
      {
        color: 'blue',
        active: true,
        className: 'bg-blue-100 border-blue-500 [&>svg]:text-blue-600',
      },

      // Green
      {
        color: 'green',
        active: false,
        className:
          'bg-background border-border hover:border-green-400 [&>svg]:text-green-400',
      },
      {
        color: 'green',
        active: true,
        className: 'bg-green-100 border-green-500 [&>svg]:text-green-600',
      },

      // Red
      {
        color: 'red',
        active: false,
        className:
          'bg-background border-border hover:border-red-400 [&>svg]:text-red-400',
      },
      {
        color: 'red',
        active: true,
        className: 'bg-red-100 border-red-500 [&>svg]:text-red-600',
      },

      // Amber
      {
        color: 'amber',
        active: false,
        className:
          'bg-background border-border hover:border-amber-400 [&>svg]:text-amber-400',
      },
      {
        color: 'amber',
        active: true,
        className: 'bg-amber-100 border-amber-500 [&>svg]:text-amber-600',
      },

      // Purple
      {
        color: 'purple',
        active: false,
        className:
          'bg-background border-border hover:border-purple-400 [&>svg]:text-purple-400',
      },
      {
        color: 'purple',
        active: true,
        className: 'bg-purple-100 border-purple-500 [&>svg]:text-purple-600',
      },

      // Slate
      {
        color: 'slate',
        active: false,
        className:
          'bg-background border-border hover:border-slate-400 [&>svg]:text-slate-400',
      },
      {
        color: 'slate',
        active: true,
        className: 'bg-slate-100 border-slate-500 [&>svg]:text-slate-600',
      },
    ],
    defaultVariants: {
      color: 'neutral',
      size: 'md',
      active: false,
    },
  },
);
