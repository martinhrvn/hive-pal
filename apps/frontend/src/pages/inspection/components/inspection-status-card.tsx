import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InspectionStatus } from 'shared-schemas';
import { useUpdateInspection } from '@/api/hooks/useInspections';
import { useQueryClient } from '@tanstack/react-query';

const getStatusConfig = (status: InspectionStatus) => {
  switch (status) {
    case InspectionStatus.SCHEDULED:
      return {
        icon: <Clock className="h-5 w-5" />,
        label: 'Scheduled',
        badgeVariant: 'default' as const,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      };
    case InspectionStatus.OVERDUE:
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        label: 'Overdue',
        badgeVariant: 'destructive' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      };
    case InspectionStatus.COMPLETED:
      return {
        icon: <CheckCircle className="h-5 w-5" />,
        label: 'Completed',
        badgeVariant: 'default' as const,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    case InspectionStatus.CANCELLED:
      return {
        icon: <XCircle className="h-5 w-5" />,
        label: 'Cancelled',
        badgeVariant: 'secondary' as const,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
      };
    default:
      return {
        icon: <Clock className="h-5 w-5" />,
        label: 'Unknown',
        badgeVariant: 'secondary' as const,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
      };
  }
};

type InspectionStatusCardProps = {
  inspectionId: string;
  status: InspectionStatus;
  inspectionDate: string;
};

export const InspectionStatusCard = ({ 
  inspectionId, 
  status, 
  inspectionDate 
}: InspectionStatusCardProps) => {
  const queryClient = useQueryClient();
  const { mutate: updateInspection, isPending } = useUpdateInspection();
  
  const statusConfig = getStatusConfig(status);
  const showActions = status === InspectionStatus.SCHEDULED || status === InspectionStatus.OVERDUE;

  const handleComplete = () => {
    updateInspection({
      id: inspectionId,
      data: {
        status: InspectionStatus.COMPLETED,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inspections'] });
      }
    });
  };

  const handleCancel = () => {
    updateInspection({
      id: inspectionId,
      data: {
        status: InspectionStatus.CANCELLED,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inspections'] });
      }
    });
  };

  return (
    <Card className="p-6">
      <CardHeader className="pb-3">
        <CardTitle>
          <div className="flex items-center gap-2">
            {statusConfig.icon}
            Status
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Current Status</div>
            <Badge 
              variant={statusConfig.badgeVariant}
              className={`${statusConfig.bgColor} ${statusConfig.color} text-lg px-3 py-1`}
            >
              {statusConfig.label}
            </Badge>
          </div>

          {showActions && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Actions</div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleComplete}
                  disabled={isPending}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isPending}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Inspection
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};