import { RatingSlider } from '@/components/common/rating-slider';

export const ObservationNumberRatingView = ({
  rating,
  label,
}: {
  rating?: number | null;
  label: string;
}) => {
  if (rating === null || rating === undefined) return null;

  return (
    <div className="grid md:grid-cols-3 grid-cols-1 gap-2">
      <div className={'col-span-1'}>{label}</div>
      <div className={'col-span-2'}>
        <RatingSlider
          value={rating}
          onChange={() => {}}
          disabled={true}
          showZeroButton={false}
        />
      </div>
    </div>
  );
};
