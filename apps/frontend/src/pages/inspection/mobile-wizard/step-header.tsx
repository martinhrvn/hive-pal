interface StepHeaderProps {
  title: string;
  hint?: string;
}

// Compact editorial step header. The wizard shell already shows the step
// number, so this just leads with the title and one quiet line of guidance.
export function StepHeader({ title, hint }: StepHeaderProps) {
  return (
    <div className="text-center">
      <h2 className="font-display text-2xl leading-tight">{title}</h2>
      {hint && (
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
