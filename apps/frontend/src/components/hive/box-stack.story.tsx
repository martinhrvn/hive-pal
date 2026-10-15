import { BoxTypeEnum, type Box } from 'shared-schemas';
import { BoxStack } from './box-stack';

const box = (position: number, type: BoxTypeEnum): Box =>
  ({
    id: `box-${position}`,
    position,
    type,
    frameCount: 10,
    hasExcluder: false,
    winterized: false,
  }) as Box;

/** A stack of `count` boxes: brood at the bottom, honey supers above. */
export const Stack = ({
  count,
  size = 'card',
}: {
  count: number;
  size?: 'card' | 'minimap';
}) => (
  <div className="w-44 p-4">
    <BoxStack
      size={size}
      boxes={Array.from({ length: count }, (_, i) =>
        box(i, i === 0 ? BoxTypeEnum.BROOD : BoxTypeEnum.HONEY),
      )}
    />
  </div>
);
