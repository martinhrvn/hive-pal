import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { EditIcon, Icon, PlusCircle, TrashIcon } from 'lucide-react';
import { bee } from '@lucide/lab';
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
        <PlusCircle className="mr-2 h-4 w-4" /> Add Inspection
      </Link>

      <Link
        to={hiveId ? `/hives/${hiveId}/queens/create` : '/queens/create'}
        className={buttonVariants({
          variant: 'outline',
          className: 'w-full justify-start',
        })}
      >
        <Icon iconNode={bee} className="mr-2 h-4 w-4" /> Add Queen
      </Link>

      <Separator className="my-2" />

      <Link
        to={hiveId ? `/hives/${hiveId}/edit` : '#'}
        className={buttonVariants({
          variant: 'outline',
          className: 'w-full justify-start',
        })}
      >
        <EditIcon className="mr-2 h-4 w-4" />
        Edit Hive
      </Link>

      <Button
        variant="outline"
        className="w-full justify-start mt-4"
        disabled={!hiveId}
      >
        <TrashIcon className="mr-2 h-4 w-4" />
        Remove Hive
      </Button>
    </CardContent>
  </Card>
);
