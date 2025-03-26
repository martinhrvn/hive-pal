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
        <div className="flex items-center gap-4">
          <div className="grow grid grid-cols-10 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => {
              const color = rating >= value ? 'bg-amber-300' : 'bg-gray-200';
              return (
                <div
                  key={value}
                  className={`rounded h-8 w-full ${color}`}
                ></div>
              );
            })}
          </div>
          <span className="p-1 px-5 block bg-gray-100 rounded font-semibold text-lg">
            {rating}
          </span>
        </div>
      </div>
    </div>
  );
};
