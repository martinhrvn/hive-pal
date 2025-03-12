import { useParams, useNavigate } from 'react-router-dom';
import {
  useHiveControllerFindOne,
  useInspectionsControllerFindOne,
} from 'api-client';
import { format } from 'date-fns';
import {
  ChevronLeft,
  Cloud,
  CloudRain,
  CloudSun,
  Sun,
  X,
  ClipboardList,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  ObservationNumberRatingView,
  InspectionDetailSidebar,
} from './components';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { StatisticCards } from '@/pages/hive/hive-detail-page/statistic-cards.tsx';

// Get weather icon based on condition
const getWeatherIcon = (condition: string) => {
  switch (condition.toLowerCase()) {
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

  const {
    data: inspection,
    isLoading,
    error,
  } = useInspectionsControllerFindOne(id ?? '', {
    query: { enabled: !!id, select: data => data.data },
  });
  const { data: hive } = useHiveControllerFindOne(inspection?.hiveId ?? '', {
    query: { enabled: !!inspection?.hiveId, select: data => data.data },
  });

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
    <Page>
      <MainContent>
        <div className="p-4  mb-4">
          <div className="flex flex-col justify-between items-start gap-2">
            <div>
              <h3 className="font-medium flex gap-5">
                {hive?.name}
                <a
                  href={`/hives/${inspection.hiveId}`}
                  className="flex items-center text-xs"
                >
                  View hive
                  <ChevronRight size={16} className="ml-1" />
                </a>
              </h3>
            </div>
            <div className="text-xs">
              {format(inspection.date, 'dd/MM/yyyy HH:mm')}
            </div>

            <div>
              <span className="text-sm text-gray-500">
                {inspection.temperature && <>{inspection.temperature}°C</>}
                {inspection.weatherConditions && (
                  <div className={'flex items-center gap-2'}>
                    {formatWeatherCondition(inspection.weatherConditions)}{' '}
                    {getWeatherIcon(inspection.weatherConditions)}
                  </div>
                )}
              </span>
            </div>
          </div>
        </div>
        {/* Info Cards Section */}
        <div className="flex gap-4 mb-6 "></div>
        <StatisticCards score={inspection.score} />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
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
              </div>
              <div className="space-y-6">
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
            </div>
          </CardContent>
        </Card>

        {inspection.notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{inspection.notes}</p>
            </CardContent>
          </Card>
        )}
      </MainContent>

      <Sidebar>
        <InspectionDetailSidebar
          inspectionId={id || ''}
          hiveId={inspection.hiveId}
        />
      </Sidebar>
    </Page>
  );
};
