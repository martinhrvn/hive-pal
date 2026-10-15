import { cn } from '@/lib/utils';

type FeaturePhotoProps = {
  /** Photo URL; without one the `fallback` background is shown instead. */
  src?: string | null;
  alt: string;
  /** CSS background (e.g. `buildBoxGradient(boxes)`) used when there is no photo. */
  fallback?: string;
  /** Size classes; callers keep their own `@container` breakpoints. */
  className?: string;
  imgClassName?: string;
  /** Extra classes for the readability gradient, e.g. a side-layout variant. */
  overlayClassName?: string;
  /** Faint honey wash over the photo. */
  tint?: boolean;
};

/**
 * Cover photo block shared by the hive card, hive detail and apiary headers:
 * an object-cover image (or a fallback background) with a gradient overlay.
 * Overlays never take pointer events, so a stretched link above still works.
 */
export const FeaturePhoto = ({
  src,
  alt,
  fallback,
  className,
  imgClassName,
  overlayClassName,
  tint,
}: FeaturePhotoProps) => (
  <div className={cn('relative overflow-hidden bg-muted', className)}>
    {src ? (
      <img
        src={src}
        alt={alt}
        className={cn('absolute inset-0 size-full object-cover', imgClassName)}
      />
    ) : (
      fallback && (
        <div className="absolute inset-0" style={{ background: fallback }} />
      )
    )}
    <div
      className={cn(
        'pointer-events-none absolute inset-0 bg-gradient-to-t from-card/40 via-transparent to-transparent',
        overlayClassName,
      )}
    />
    {tint && (
      <div className="pointer-events-none absolute inset-0 bg-honey/5" />
    )}
  </div>
);
