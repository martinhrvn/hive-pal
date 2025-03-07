import { HiveResponseDto } from 'api-client/dist/model';
import { useNavigate } from 'react-router-dom';
import { HiveStatus } from './hive-status';
import { ChevronRight, DotIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type HiveListProps = {
  hives: HiveResponseDto[];
};

export const HiveList: React.FC<HiveListProps> = ({ hives }) => {
  const navigate = useNavigate();
  return (
    <div>
      <button onClick={() => navigate('/hives/create/')}>Create hive</button>
      <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        {hives.map(hive => (
          <Card key={hive.id}>
            <CardHeader className={'flex justify-between flex-row'}>
              <CardTitle>{hive.name}</CardTitle>
              <HiveStatus status={hive.status} />
            </CardHeader>

            <CardContent>
              <div className={'flex items-start flex-col'}>
                <div className={'flex gap-4 items-center'}>
                  <h2 className={'text-xl text-accent-foreground '}>
                    {hive.name}
                  </h2>
                </div>
                <div className={'flex items-center text-gray-400'}>
                  <p className={'col-start-1 text-xs/6'}>
                    {hive.notes ?? 'No notes'}
                  </p>
                  <DotIcon />
                  {hive.lastInspectionDate ? (
                    <p className={'col-start-1 text-xs/6'}>
                      Last inspected on {hive.lastInspectionDate}
                    </p>
                  ) : (
                    <p className={'col-start-1 text-xs/6'}>No inspection yet</p>
                  )}
                </div>
              </div>
              <p className={'col-start-1 flex'}>
                <a href={`/hives/${hive.id}`} className={'flex gap-4'}>
                  Show details <ChevronRight />
                </a>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
