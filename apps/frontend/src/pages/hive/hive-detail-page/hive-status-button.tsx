import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HiveStatus } from '@/pages/hive/components';
import { useUpdateHive } from '@/api/hooks';
import { HiveResponse, HiveStatus as HiveStatusValue } from 'shared-schemas';

type HiveStatusEnum = HiveResponse['status'];

const ALL_STATUSES: { value: HiveStatusEnum; label: string }[] = [
  { value: HiveStatusValue.ACTIVE, label: 'Active' },
  { value: HiveStatusValue.INACTIVE, label: 'Inactive' },
  { value: HiveStatusValue.DEAD, label: 'Dead' },
  { value: HiveStatusValue.SOLD, label: 'Sold' },
  { value: HiveStatusValue.UNKNOWN, label: 'Unknown' },
  { value: HiveStatusValue.ARCHIVED, label: 'Archived' },
];

type HiveStatusButtonProps = {
  hiveId: string;
  status: HiveStatusEnum | undefined;
  apiaryId?: string;
};

export const HiveStatusButton: React.FC<HiveStatusButtonProps> = ({
  hiveId,
  status,
  apiaryId,
}) => {
  const [open, setOpen] = useState(false);
  const { mutateAsync: updateHive, isPending } = useUpdateHive();

  const handleSelect = async (newStatus: HiveStatusEnum) => {
    if (newStatus === status) {
      setOpen(false);
      return;
    }
    try {
      await updateHive({
        id: hiveId,
        data: { id: hiveId, status: newStatus },
        apiaryId,
      });
      toast.success(`Hive status updated to ${newStatus.toLowerCase()}`);
    } catch {
      toast.error('Failed to update hive status');
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Change hive status"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <HiveStatus status={status} />
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuSeparator className="sr-only" />
        {ALL_STATUSES.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleSelect(value)}
            className={value === status ? 'font-semibold' : ''}
          >
            <HiveStatus status={value} />
            <span className="ml-2">{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
