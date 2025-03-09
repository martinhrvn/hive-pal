import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button.tsx';
import { HiveDetailResponseDtoActiveQueen } from 'api-client';

type QueenInformationProps = {
  hiveId?: string;
  activeQueen?: HiveDetailResponseDtoActiveQueen;
};
export const QueenInformation: React.FC<QueenInformationProps> = ({
  activeQueen,
  hiveId,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Queen Information</CardTitle>
        <BeeIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {activeQueen ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <span className="text-emerald-600 font-semibold">
                {activeQueen.status}
              </span>
            </div>
            {activeQueen.year && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Year:</span>
                <span>{activeQueen.year}</span>
              </div>
            )}
            {activeQueen.color && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Color:</span>
                <span>{activeQueen.color}</span>
              </div>
            )}
            {activeQueen.source && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Source:</span>
                <span>{activeQueen.source}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-medium">Installed:</span>
              <span className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {activeQueen?.installedAt &&
                  new Date(activeQueen.installedAt).toLocaleDateString()}
              </span>
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
    </Card>
  );
};
