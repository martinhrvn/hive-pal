import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { CalendarDays, Circle, MoreHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button.tsx';
import { HiveDetailResponseDtoActiveQueen } from 'api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type QueenInformationProps = {
  hiveId?: string;
  activeQueen?: HiveDetailResponseDtoActiveQueen;
  onQueenUpdated?: () => void;
};
export const QueenInformation: React.FC<QueenInformationProps> = ({
  activeQueen,
  hiveId,
  onQueenUpdated,
}) => {
  const navigate = useNavigate();

  const getColor = (color?: string | null) => {
    switch (color?.toLowerCase()) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-amber-500';
      case 'red':
        return 'text-red-500';
      case 'blue':
        return 'text-blue-500';
      case 'white':
        return 'bg-white';
      default:
        return 'bg-white';
    }
  };
  const handleMarkQueenState = (newState: 'DEAD' | 'REPLACED') => {
    console.log(`Mark queen as ${newState.toLowerCase()}`, activeQueen?.id);
    // In a real implementation, we would call the API here
    if (onQueenUpdated) {
      onQueenUpdated();
    }
  };

  const handleReplaceQueen = () => {
    navigate(`/hives/${hiveId}/queens/create`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-3">
          {<Circle className={`h-5 w-5 ${getColor(activeQueen?.color)}`} />}
          Queen {activeQueen?.marking}
        </CardTitle>

        <div className="flex items-center space-x-2">
          <BeeIcon className="h-4 w-4 text-muted-foreground" />
          {activeQueen && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleReplaceQueen}>
                  Replace Queen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMarkQueenState('DEAD')}>
                  Mark as Dead
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleMarkQueenState('REPLACED')}
                >
                  Mark as Lost/Missing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeQueen ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>Installed on January 15, 2025</span>
                <span className="text-muted-foreground">(via Package)</span>
              </div>

              <div className="flex items-center gap-3"></div>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-muted-foreground mb-4">No active queen found</p>
            <Link
              to={`/hives/${hiveId}/queens/create`}
              className={buttonVariants({
                size: 'sm',
              })}
            >
              <BeeIcon className="mr-2 h-4 w-4" /> Add Queen
            </Link>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <span>{activeQueen?.year}</span>
        <div className="flex gap-1 items-center">-</div>
      </CardFooter>
    </Card>
  );
};
