import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ObservationNumberRatingView } from './observation-number-rating-view';

type ObservationsCardProps = {
  observations?: {
    strength?: number | null;
    uncappedBrood?: number | null;
    cappedBrood?: number | null;
    honeyStores?: number | null;
    pollenStores?: number | null;
    queenCells?: number | null;
    broodPattern?: string | null;
    additionalObservations?: string[];
    reminderObservations?: string[];
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
        <div className="space-y-4">
          {/* Numeric Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Brood Pattern */}
          {observations.broodPattern && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Brood Pattern</h4>
              <Badge variant="outline" className="capitalize">
                {observations.broodPattern.replace('_', ' ')}
              </Badge>
            </div>
          )}

          {/* Additional Observations (Badges/Tags) */}
          {observations.additionalObservations && observations.additionalObservations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Observations</h4>
              <div className="flex flex-wrap gap-2">
                {observations.additionalObservations.map((observation, index) => (
                  <Badge key={index} variant="secondary" className="capitalize">
                    {observation.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reminder Observations */}
          {observations.reminderObservations && observations.reminderObservations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Reminders</h4>
              <div className="flex flex-wrap gap-2">
                {observations.reminderObservations.map((observation, index) => (
                  <Badge key={index} variant="destructive" className="capitalize">
                    {observation.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
