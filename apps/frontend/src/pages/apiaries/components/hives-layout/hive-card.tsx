import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HiveResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';

interface HiveCardProps {
  hive: HiveResponse;
  isDragging?: boolean;
  className?: string;
}

export const HiveCard = ({ hive, isDragging, className }: HiveCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'INACTIVE':
        return 'bg-yellow-500';
      case 'DEAD':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card
      className={cn(
        'p-3 cursor-move hover:shadow-md transition-shadow min-w-[120px] max-w-[160px]',
        isDragging && 'opacity-50',
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm truncate">{hive.name}</h4>
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              getStatusColor(hive.status)
            )}
          />
        </div>
        
        <Badge variant="outline" className="text-xs">
          {hive.status}
        </Badge>
        
        {hive.lastInspectionDate && (
          <p className="text-xs text-muted-foreground">
            Last: {new Date(hive.lastInspectionDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </Card>
  );
};