import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useInspectionsControllerFindOne,
  useInspectionsControllerRemove,
} from 'api-client';
import { format } from 'date-fns';
import {
  ChevronLeft,
  Calendar,
  Thermometer,
  Cloud,
  CloudRain,
  CloudSun,
  Sun,
  X,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  ObservationNumberRatingView,
  InspectionDetailSidebar,
} from './components';

// Get weather icon based on condition
const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'sunny':
      return <Sun className="h-6 w-6 text-amber-500" />;
    case 'partly-cloudy':
      return <CloudSun className="h-6 w-6 text-blue-400" />;
    case 'cloudy':
      return <Cloud className="h-6 w-6 text-gray-500" />;
    case 'rainy':
      return <CloudRain className="h-6 w-6 text-blue-600" />;
    default:
      return <Cloud className="h-6 w-6 text-gray-500" />;
  }
};

// Get temperature color based on temperature
const getTemperatureColor = (temp: number | null) => {
  if (temp === null) return 'text-gray-500';

  if (temp <= 0) return 'text-blue-600';
  if (temp <= 15) return 'text-green-500';
  if (temp <= 30) return 'text-yellow-500';
  return 'text-red-500';
};

// Format weather condition for display
const formatWeatherCondition = (condition: string) => {
  if (!condition) return '';
  return condition
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const InspectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    data: inspection,
    isLoading,
    error,
  } = useInspectionsControllerFindOne(id ?? '', {
    query: { enabled: !!id, select: data => data.data },
  });

  const { mutate: deleteInspection } = useInspectionsControllerRemove({
    mutation: {
      onSuccess: () => {
        if (inspection?.hiveId) {
          navigate(`/hives/${inspection.hiveId}`);
        } else {
          navigate('/');
        }
      },
    },
  });

  const handleDelete = () => {
    if (id) {
      deleteInspection({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">Loading inspection details...</div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load inspection details. {error?.message}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 w-full max-w-7xl mx-auto">
      <div className="col-span-12">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/hives/${inspection.hiveId}`)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Hive
          </Button>
        </div>{' '}
      </div>

      <div className="col-span-12 lg:col-span-9">
        {/* Dashboard Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Date Card */}
          <Card>
            <CardContent>
              <h3>Date</h3>
              <div className="flex items-center">
                <Calendar className="h-8 w-8 mr-3 text-blue-500" />
                <div>
                  <div className="text-xl font-semibold">
                    {format(new Date(inspection.date), 'd MMM yyyy')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(inspection.date), 'EEEE')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Card */}
          {inspection.temperature && (
            <Card>
              <CardContent>
                <h3>Temperature</h3>
                <div className="flex items-center">
                  <Thermometer
                    className={`h-8 w-8 mr-3 ${getTemperatureColor(inspection.temperature)}`}
                  />
                  <div>
                    <div className="text-xl font-semibold">
                      {inspection.temperature}°C
                    </div>
                    <div className="text-sm text-gray-500">
                      {inspection.temperature < 5
                        ? 'Cold'
                        : inspection.temperature < 15
                          ? 'Cool'
                          : inspection.temperature < 25
                            ? 'Mild'
                            : 'Warm'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weather Conditions Card */}
          {inspection.weatherConditions && (
            <Card>
              <CardContent>
                <h3>Weather</h3>
                <div className="flex items-center">
                  {getWeatherIcon(inspection.weatherConditions)}
                  <div className="ml-3">
                    <div className="text-xl font-semibold">
                      {formatWeatherCondition(inspection.weatherConditions)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {inspection.weatherConditions === 'sunny'
                        ? 'Clear skies'
                        : inspection.weatherConditions === 'partly-cloudy'
                          ? 'Some clouds'
                          : inspection.weatherConditions === 'cloudy'
                            ? 'Overcast'
                            : 'Precipitation'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Observations Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Observations
                </div>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={'grid grid-cols-1 gap-4'}>
              <ObservationNumberRatingView
                rating={inspection.observations.strength}
                label={'Strength'}
              />
              <ObservationNumberRatingView
                rating={inspection.observations.uncappedBrood}
                label={'Uncapped Brood'}
              />
              <ObservationNumberRatingView
                rating={inspection.observations.cappedBrood}
                label={'Capped Brood'}
              />
              <ObservationNumberRatingView
                rating={inspection.observations.honeyStores}
                label={'Honey Stores'}
              />
              <ObservationNumberRatingView
                rating={inspection.observations.pollenStores}
                label={'Pollen Stores'}
              />
              <ObservationNumberRatingView
                rating={inspection.observations.queenCells}
                label={'Queen cells'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-6">
            <Alert variant="destructive">
              <AlertTitle>
                Are you sure you want to delete this inspection?
              </AlertTitle>
              <AlertDescription>
                This action cannot be undone. This will permanently delete the
                inspection and all its data.
              </AlertDescription>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Confirm Delete
                </Button>
              </div>
            </Alert>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="col-span-12 lg:col-span-3">
        <InspectionDetailSidebar
          inspectionId={id || ''}
          hiveId={inspection.hiveId}
          onDeleteClick={() => setShowDeleteConfirm(true)}
        />
      </div>
    </div>
  );
};
