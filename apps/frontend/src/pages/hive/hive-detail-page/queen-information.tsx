import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { CalendarDays, MoreHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonVariants } from '@/components/ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActiveQueen } from 'shared-schemas';

type QueenInformationProps = {
  hiveId?: string;
  activeQueen?: ActiveQueen | null;
  onQueenUpdated?: () => void;
};
export const QueenInformation: React.FC<QueenInformationProps> = ({
  activeQueen,
  hiveId,
  onQueenUpdated,
}) => {
  const { t } = useTranslation('queen');
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
        return 'bg-white border border-gray-200';
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
    <Card className="p-3 sm:p-0">
      {/* Mobile compact view */}
      <div className="sm:hidden">
        {activeQueen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-full border border-gray-600 ${getColor(activeQueen?.color)}`}
              />
              <span className="text-sm font-medium">
                {activeQueen?.marking} • {activeQueen?.year}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            {activeQueen && (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleReplaceQueen}>
                    {t('actions.replaceQueen')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkQueenState('DEAD')}>
                    {t('actions.markAsDead')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleMarkQueenState('REPLACED')}
                  >
                    {t('actions.markAsLostMissing')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('information.noActiveQueen')}
            </span>
            <Link
              to={`/hives/${hiveId}/queens/create`}
              className={buttonVariants({
                size: 'sm',
                variant: 'ghost',
              })}
            >
              <BeeIcon className="mr-2 h-4 w-4" /> {t('actions.addQueen')}
            </Link>
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden sm:block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-3">
            <div
              className={`h-5 w-5 rounded-full border border-gray-600 ${getColor(activeQueen?.color)}`}
            />
            {t('singular')} {activeQueen?.marking}
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
                    {t('actions.replaceQueen')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkQueenState('DEAD')}>
                    {t('actions.markAsDead')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleMarkQueenState('REPLACED')}
                  >
                    {t('actions.markAsLostMissing')}
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
                  <span>
                    {t('fields.installedOn', { date: 'January 15, 2025' })}
                  </span>
                  <span className="text-muted-foreground">
                    ({t('fields.via', { source: 'Package' })})
                  </span>
                </div>

                <div className="flex items-center gap-3"></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-muted-foreground mb-4">
                {t('information.noActiveQueen')}
              </p>
              <Link
                to={`/hives/${hiveId}/queens/create`}
                className={buttonVariants({
                  size: 'sm',
                })}
              >
                <BeeIcon className="mr-2 h-4 w-4" /> {t('actions.addQueen')}
              </Link>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <span>{activeQueen?.year}</span>
          <div className="flex gap-1 items-center">-</div>
        </CardFooter>
      </div>
    </Card>
  );
};
