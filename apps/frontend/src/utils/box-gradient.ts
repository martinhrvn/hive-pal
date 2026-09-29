import { BoxVariantEnum } from 'shared-schemas';
import { getBoxHeightMm } from './box-display';

const MUTED_GRADIENT =
  'linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--muted)))';

export function buildBoxGradient(
  boxes?: {
    position: number;
    color?: string;
    variant?: BoxVariantEnum | null;
    type?: string;
  }[],
): string {
  if (!boxes || boxes.length === 0) {
    return MUTED_GRADIENT;
  }
  // Sort descending by position so highest position (top box) is first in the gradient
  const sorted = [...boxes].sort((a, b) => b.position - a.position);
  const colored = sorted.filter(b => !!b.color);
  if (colored.length === 0) {
    return MUTED_GRADIENT;
  }
  if (colored.length === 1) {
    return colored[0].color as string;
  }
  // Hard stops with no blending, each band weighted by the box's real-world
  // height so the preview mirrors the actual stack (e.g. a Dadant feeder is a
  // third of a brood box, not an equal share).
  const weights = colored.map(b =>
    getBoxHeightMm(b.variant ?? undefined, b.type),
  );
  const total = weights.reduce((sum, w) => sum + w, 0);
  let acc = 0;
  const stops: string[] = [];
  colored.forEach((b, i) => {
    const start = ((acc / total) * 100).toFixed(1);
    acc += weights[i];
    const end = ((acc / total) * 100).toFixed(1);
    stops.push(`${b.color} ${start}%`, `${b.color} ${end}%`);
  });
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}
