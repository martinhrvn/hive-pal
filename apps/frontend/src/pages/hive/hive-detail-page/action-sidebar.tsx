import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { EditIcon, PlusCircle, TrashIcon } from 'lucide-react';

type ActionSideBarProps = {
  hiveId?: string;
};
export const ActionSideBar: React.FC<ActionSideBarProps> = ({ hiveId }) => (
  <Card>
    <CardHeader>
      <CardTitle>Actions</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col space-y-2">
      <Link
        to={
          hiveId ? `/hives/${hiveId}/inspections/create` : '/inspections/create'
        }
        className={buttonVariants({
          variant: 'outline',
          className: 'w-full justify-start',
        })}
      >
        <PlusCircle /> Add Inspection
      </Link>

      <Separator className="my-2" />

      <Link
        to={hiveId ? `/hives/${hiveId}/edit` : '#'}
        className={buttonVariants({
          variant: 'outline',
          className: 'w-full justify-start',
        })}
      >
        <EditIcon />
        Edit Hive
      </Link>

      <Button
        variant="outline"
        className="w-full justify-start mt-4"
        disabled={!hiveId}
      >
        <TrashIcon />
        Remove Hive
      </Button>
    </CardContent>
  </Card>
);
