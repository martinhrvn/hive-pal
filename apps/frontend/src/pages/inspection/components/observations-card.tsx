import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ObservationNumberRatingView } from './observation-number-rating-view';

type ObservationsCardProps = {
  observations?: {
    strength?: number | null;
    uncappedBrood?: number | null;
    cappedBrood?: number | null;
    honeyStores?: number | null;
    pollenStores?: number | null;
    queenCells?: number | null;
  };
};

export const ObservationsCard = ({
  observations = {},
}: ObservationsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Observations
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ObservationNumberRatingView
            rating={observations.strength}
            label={'Strength'}
          />
          <ObservationNumberRatingView
            rating={observations.uncappedBrood}
            label={'Uncapped Brood'}
          />
          <ObservationNumberRatingView
            rating={observations.cappedBrood}
            label={'Capped Brood'}
          />
          <ObservationNumberRatingView
            rating={observations.honeyStores}
            label={'Honey Stores'}
          />
          <ObservationNumberRatingView
            rating={observations.pollenStores}
            label={'Pollen Stores'}
          />
          <ObservationNumberRatingView
            rating={observations.queenCells}
            label={'Queen cells'}
          />
        </div>
      </CardContent>
    </Card>
  );
};
