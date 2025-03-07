import { useHiveControllerFindAll } from 'api-client';
import { HiveList } from '@/pages/hive/components';

export const HomePage = () => {
  const { data, isLoading } = useHiveControllerFindAll();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <HiveList hives={data?.data ?? []} />;
};
