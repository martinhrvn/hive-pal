import { useId, type ReactNode } from 'react';

/** A titled group of fields; sections are separated by a rule. */
export const FormSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0"
    >
      <div className="space-y-1">
        <h3 id={headingId} className="font-overline text-muted-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
};
