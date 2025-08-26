import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Check,
  Edit,
  Droplets,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useHarvest,
  useUpdateHarvest,
  useSetHarvestWeight,
  useFinalizeHarvest,
  useReopenHarvest,
  useDeleteHarvest,
} from '@/api/hooks/useHarvests';
import { toast } from 'sonner';
import { useState } from 'react';
import { HarvestStatus } from 'shared-schemas';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const HarvestDetailPage = () => {
  const { harvestId } = useParams<{ harvestId: string }>();
  const navigate = useNavigate();
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weight, setWeight] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: harvest, isLoading } = useHarvest(harvestId!);
  const updateHarvest = useUpdateHarvest();
  const setHarvestWeight = useSetHarvestWeight();
  const finalizeHarvest = useFinalizeHarvest();
  const reopenHarvest = useReopenHarvest();
  const deleteHarvest = useDeleteHarvest();

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!harvest) {
    return <div className="p-6">Harvest not found</div>;
  }

  const totalFrames = harvest.harvestHives.reduce(
    (sum, hh) => sum + hh.framesTaken,
    0,
  );

  const handleSetWeight = async () => {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    try {
      await setHarvestWeight.mutateAsync({
        harvestId: harvest.id,
        data: { totalWeight: weightValue },
      });
      toast.success('Weight set successfully');
      setIsEditingWeight(false);
      setWeight('');
    } catch {
      toast.error('Failed to set weight');
    }
  };

  const handleUpdateNotes = async () => {
    try {
      await updateHarvest.mutateAsync({
        harvestId: harvest.id,
        data: { notes },
      });
      toast.success('Notes updated');
      setIsEditingNotes(false);
    } catch {
      toast.error('Failed to update notes');
    }
  };

  const handleFinalize = async () => {
    try {
      await finalizeHarvest.mutateAsync(harvest.id);
      toast.success('Harvest finalized successfully');
    } catch {
      toast.error('Failed to finalize harvest');
    }
  };

  const handleReopen = async () => {
    try {
      await reopenHarvest.mutateAsync(harvest.id);
      toast.success('Harvest reopened for editing');
    } catch {
      toast.error('Failed to reopen harvest');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteHarvest.mutateAsync(harvest.id);
      toast.success('Harvest deleted');
      navigate('/harvests');
    } catch {
      toast.error('Failed to delete harvest');
    }
  };

  const getStatusColor = (status: HarvestStatus) => {
    switch (status) {
      case HarvestStatus.DRAFT:
        return 'bg-gray-500';
      case HarvestStatus.IN_PROGRESS:
        return 'bg-yellow-500';
      case HarvestStatus.COMPLETED:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/harvests')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Harvest Details</h1>
          <Badge className={cn(getStatusColor(harvest.status), 'text-white')}>
            {harvest.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          {harvest.status === HarvestStatus.COMPLETED && (
            <Button variant="outline" onClick={handleReopen}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reopen
            </Button>
          )}
          {harvest.status === HarvestStatus.IN_PROGRESS &&
            harvest.totalWeight && (
              <Button onClick={handleFinalize}>
                <Check className="mr-2 h-4 w-4" />
                Finalize
              </Button>
            )}
          {harvest.status === HarvestStatus.DRAFT && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Harvest?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    the harvest.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Harvest Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="font-medium">
                {format(new Date(harvest.date), 'PPP')}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Total Hives</Label>
              <p className="font-medium">{harvest.harvestHives.length}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Total Frames</Label>
              <p className="font-medium">{totalFrames}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Total Weight</Label>
              {harvest.status !== HarvestStatus.COMPLETED &&
              !harvest.totalWeight &&
              !isEditingWeight ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingWeight(true)}
                >
                  <Droplets className="mr-2 h-4 w-4" />
                  Set Weight
                </Button>
              ) : isEditingWeight ? (
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="0.0"
                    className="w-24"
                  />
                  <span className="flex items-center">kg</span>
                  <Button size="sm" onClick={handleSetWeight}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingWeight(false);
                      setWeight('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <p className="font-medium">
                  {harvest.totalWeight
                    ? `${harvest.totalWeight} kg`
                    : 'Not set'}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground">Notes</Label>
              {harvest.status !== HarvestStatus.COMPLETED &&
                !isEditingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotes(harvest.notes || '');
                      setIsEditingNotes(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleUpdateNotes}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingNotes(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{harvest.notes || 'No notes'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hives Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hive Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {harvest.harvestHives.map(hh => (
              <div
                key={hh.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{hh.hiveName}</p>
                  <p className="text-sm text-muted-foreground">
                    {hh.framesTaken} frames
                  </p>
                </div>
                {hh.honeyAmount && (
                  <div className="text-right">
                    <p className="font-medium">
                      {hh.honeyAmount.toFixed(2)} kg
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {hh.honeyPercentage?.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {harvest.status === HarvestStatus.DRAFT && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-900">Draft Harvest</AlertTitle>
          <AlertDescription className="text-yellow-700">
            This harvest is in draft status. Set the total weight to proceed
            with calculations.
          </AlertDescription>
        </Alert>
      )}

      {harvest.status === HarvestStatus.IN_PROGRESS && harvest.totalWeight && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900">Ready to Finalize</AlertTitle>
          <AlertDescription className="text-blue-700">
            Weight has been set and distribution calculated. Click "Finalize" to
            create harvest actions for each hive.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
