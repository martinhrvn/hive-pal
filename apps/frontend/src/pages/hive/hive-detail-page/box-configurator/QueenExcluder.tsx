export const QueenExcluder = () => {
  return (
    <div className="w-64 h-2 my-1 relative">
      <div
        className="absolute inset-0 rounded-sm"
        style={{
          background:
            'repeating-linear-gradient(90deg, #666 0px, #666 2px, transparent 2px, transparent 6px)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-muted-foreground bg-background px-2 rounded">
          Queen Excluder
        </span>
      </div>
    </div>
  );
};
