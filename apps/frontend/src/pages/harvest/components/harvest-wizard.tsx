import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useCreateHarvest } from '@/api/hooks/useHarvests';
import { useHives } from '@/api/hooks/useHives';
import { CreateHarvest, HarvestHive } from 'shared-schemas';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useApiary } from '@/hooks/use-apiary';
import { useDateFormat } from '@/hooks/use-date-format';

export const HarvestWizard = () => {
  const { t } = useTranslation(['harvest', 'common']);
  const { formatDate } = useDateFormat();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [selectedHives, setSelectedHives] = useState<Map<string, number>>(
    new Map(),
  );

  const { activeApiaryId } = useApiary();
  const navigate = useNavigate();
  const createHarvest = useCreateHarvest();
  const { data: hives = [] } = useHives({
    apiaryId: activeApiaryId || undefined,
  });

  const handleHiveToggle = (hiveId: string, checked: boolean) => {
    const newSelectedHives = new Map(selectedHives);
    if (checked) {
      newSelectedHives.set(hiveId, 1); // Default to 1 frame
    } else {
      newSelectedHives.delete(hiveId);
    }
    setSelectedHives(newSelectedHives);
  };

  const handleFrameCountChange = (hiveId: string, frames: number) => {
    if (frames > 0) {
      const newSelectedHives = new Map(selectedHives);
      newSelectedHives.set(hiveId, frames);
      setSelectedHives(newSelectedHives);
    }
  };

  const handleSubmit = async () => {
    if (selectedHives.size === 0) {
      toast.error(t('harvest:wizard.selectAtLeastOne'));
      return;
    }

    const harvestHives: HarvestHive[] = Array.from(selectedHives).map(
      ([hiveId, framesTaken]) => ({
        hiveId,
        framesTaken,
      }),
    );

    const data: CreateHarvest = {
      date: date.toISOString(),
      notes: notes || undefined,
      harvestHives,
    };

    try {
      const harvest = await createHarvest.mutateAsync(data);
      toast.success(t('harvest:wizard.started'));
      setOpen(false);
      navigate(`/harvests/${harvest.id}`);
    } catch (error) {
      toast.error(t('harvest:wizard.startFailed'));
      console.error('Failed to create harvest:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('harvest:wizard.start')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('harvest:wizard.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">{t('harvest:wizard.date')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    formatDate(date)
                  ) : (
                    <span>{t('harvest:wizard.pickDate')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={newDate => newDate && setDate(newDate)}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hive Selection */}
          <div className="space-y-2">
            <Label>{t('harvest:wizard.selectHives')}</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
              {hives.map(hive => (
                <div key={hive.id} className="flex items-center space-x-4 py-2">
                  <Checkbox
                    id={hive.id}
                    checked={selectedHives.has(hive.id)}
                    onCheckedChange={checked =>
                      handleHiveToggle(hive.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={hive.id}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {hive.name}
                  </Label>
                  {selectedHives.has(hive.id) && (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        value={selectedHives.get(hive.id) || 1}
                        onChange={e =>
                          handleFrameCountChange(
                            hive.id,
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {t('harvest:framesUnit', {
                          count: selectedHives.get(hive.id) || 1,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('harvest:selectedSummary', {
                hives: t('harvest:selectedHives', {
                  count: selectedHives.size,
                }),
                frames: t('harvest:totalFrames', {
                  count: Array.from(selectedHives.values()).reduce(
                    (a, b) => a + b,
                    0,
                  ),
                }),
              })}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('harvest:wizard.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('harvest:wizard.notesPlaceholder')}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createHarvest.isPending}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createHarvest.isPending || selectedHives.size === 0}
            >
              {createHarvest.isPending
                ? t('harvest:wizard.starting')
                : t('harvest:wizard.start')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
