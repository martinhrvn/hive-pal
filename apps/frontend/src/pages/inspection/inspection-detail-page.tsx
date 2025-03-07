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
  Pencil,
  Trash,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Section } from '@/components/common';

// Observation types mapping (same as in form component)
const OBSERVATION_TYPES = [
  { value: 'queen_sighting', label: 'Queen Sighting' },
  { value: 'brood_pattern', label: 'Brood Pattern' },
  { value: 'honey_stores', label: 'Honey Stores' },
  { value: 'pollen_stores', label: 'Pollen Stores' },
  { value: 'population_strength', label: 'Population Strength' },
  { value: 'temperament', label: 'Temperament' },
  { value: 'disease_presence', label: 'Disease Presence' },
  { value: 'pest_presence', label: 'Pest Presence' },
  { value: 'queen_cells', label: 'Queen Cells' },
  { value: 'swarm_tendency', label: 'Swarm Tendency' },
];

// Get the label for the observation type
const getTypeLabel = (value: string) => {
  const type = OBSERVATION_TYPES.find(t => t.value === value);
  return type ? type.label : value;
};

// Helper to get severity color based on numeric value (1-10)
const getValueColor = (value: number | null) => {
  if (value === null) return 'bg-gray-200';

  if (value <= 3) return 'bg-red-500';
  if (value <= 5) return 'bg-yellow-500';
  if (value <= 7) return 'bg-blue-500';
  return 'bg-green-500';
};

const ObservationItem = ({ observation }: { observation: any }) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md">
            {getTypeLabel(observation.type)}
          </CardTitle>
          {observation.numericValue && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {observation.numericValue}/10
              </span>
              <div
                className={`h-4 w-4 rounded-full ${getValueColor(observation.numericValue)}`}
                title={`Rating: ${observation.numericValue}/10`}
              />
            </div>
          )}
        </div>
      </CardHeader>

      {observation.notes && (
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-line">
            {observation.notes}
          </p>
        </CardContent>
      )}
    </Card>
  );
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
    <div className="container mx-auto max-w-3xl p-4">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(`/hives/${inspection.hiveId}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Hive
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/inspections/${id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Details</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(inspection.date), 'MMMM d, yyyy')}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weather Section */}
          <Section title="Weather Conditions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inspection.temperature && (
                <div className="flex items-center gap-2 text-sm">
                  <Thermometer className="h-4 w-4 text-gray-500" />
                  <span>Temperature: {inspection.temperature}°C</span>
                </div>
              )}
              {inspection.weatherConditions && (
                <div className="flex items-center gap-2 text-sm">
                  <Cloud className="h-4 w-4 text-gray-500" />
                  <span>Conditions: {inspection.weatherConditions}</span>
                </div>
              )}
              {!inspection.temperature && !inspection.weatherConditions && (
                <p className="text-muted-foreground text-sm">
                  No weather data recorded
                </p>
              )}
            </div>
          </Section>

          {/* Observations Section */}
          <Section
            title="Observations"
            titleExtra={
              <span className="text-muted-foreground text-sm">
                {inspection.observations?.length || 0} recorded
              </span>
            }
          >
            {inspection.observations && inspection.observations.length > 0 ? (
              <div className="space-y-3">
                {inspection.observations.map((observation: any) => (
                  <ObservationItem
                    key={observation.id}
                    observation={observation}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No observations recorded
              </p>
            )}
          </Section>
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
  );
};
