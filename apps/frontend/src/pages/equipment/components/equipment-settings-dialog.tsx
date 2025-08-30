import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, Loader2 } from 'lucide-react';
import { useEquipment, EquipmentSettingsDto } from '@/api/hooks/useEquipment';

const equipmentSettingsSchema = z.object({
  // Tracking toggles
  trackDeepBoxes: z.boolean(),
  trackShallowBoxes: z.boolean(),
  trackBottoms: z.boolean(),
  trackCovers: z.boolean(),
  trackFrames: z.boolean(),
  trackQueenExcluders: z.boolean(),
  trackFeeders: z.boolean(),

  // Equipment per hive ratios
  deepBoxesPerHive: z.number().min(0).max(10),
  shallowBoxesPerHive: z.number().min(0).max(10),
  framesPerHive: z.number().min(0).max(100),
  bottomsPerHive: z.number().min(0).max(5),
  coversPerHive: z.number().min(0).max(5),
  queenExcludersPerHive: z.number().min(0).max(5),
  feedersPerHive: z.number().min(0).max(5),

  // Planning multiplier
  targetMultiplier: z.number().min(1).max(5).step(0.1),
});

type EquipmentSettingsFormData = z.infer<typeof equipmentSettingsSchema>;

interface EquipmentSettingsDialogProps {
  children: React.ReactNode;
}

export const EquipmentSettingsDialog = ({ children }: EquipmentSettingsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useEquipment();

  const form = useForm<EquipmentSettingsFormData>({
    resolver: zodResolver(equipmentSettingsSchema),
    defaultValues: settings.data || {
      trackDeepBoxes: true,
      trackShallowBoxes: true,
      trackBottoms: true,
      trackCovers: true,
      trackFrames: true,
      trackQueenExcluders: true,
      trackFeeders: false,
      deepBoxesPerHive: 1,
      shallowBoxesPerHive: 2,
      framesPerHive: 20,
      bottomsPerHive: 1,
      coversPerHive: 1,
      queenExcludersPerHive: 1,
      feedersPerHive: 0,
      targetMultiplier: 1.5,
    },
  });

  // Reset form when settings data changes
  React.useEffect(() => {
    if (settings.data) {
      form.reset(settings.data);
    }
  }, [settings.data, form]);

  const onSubmit = (data: EquipmentSettingsFormData) => {
    updateSettings.mutate(data as EquipmentSettingsDto, {
      onSuccess: () => {
        setIsOpen(false);
      },
    });
  };

  if (settings.isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Equipment Settings
          </DialogTitle>
          <DialogDescription>
            Configure which equipment types to track and their ratios per hive for planning.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Equipment Tracking Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Equipment Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Choose which equipment types you want to track in your inventory.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trackDeepBoxes"
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between space-y-0 p-3 border rounded">
                      <div>
                        <FormLabel>Deep Boxes</FormLabel>
                        <FormDescription className="text-xs">
                          Track deep/brood boxes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackShallowBoxes"
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between space-y-0 p-3 border rounded">
                      <div>
                        <FormLabel>Shallow Boxes</FormLabel>
                        <FormDescription className="text-xs">
                          Track shallow/honey supers
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackFrames"
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between space-y-0 p-3 border rounded">
                      <div>
                        <FormLabel>Frames</FormLabel>
                        <FormDescription className="text-xs">
                          Track frame counts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackBottoms"
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between space-y-0 p-3 border rounded">
                      <div>
                        <FormLabel>Bottom Boards</FormLabel>
                        <FormDescription className="text-xs">
                          Track bottom boards
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackCovers"
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between space-y-0 p-3 border rounded">
                      <div>
                        <FormLabel>Top Covers</FormLabel>
                        <FormDescription className="text-xs">
                          Track top covers/lids
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackQueenExcluders"
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between space-y-0 p-3 border rounded">
                      <div>
                        <FormLabel>Queen Excluders</FormLabel>
                        <FormDescription className="text-xs">
                          Track queen excluders
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackFeeders"
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between space-y-0 p-3 border rounded">
                      <div>
                        <FormLabel>Feeders</FormLabel>
                        <FormDescription className="text-xs">
                          Track feeding equipment
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Equipment Ratios Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Equipment per Hive</h3>
              <p className="text-sm text-muted-foreground">
                Set the standard amount of each equipment type per hive for planning calculations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deepBoxesPerHive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deep Boxes per Hive</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shallowBoxesPerHive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shallow Boxes per Hive</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="framesPerHive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frames per Hive</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bottomsPerHive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bottom Boards per Hive</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coversPerHive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Covers per Hive</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="queenExcludersPerHive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Queen Excluders per Hive</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feedersPerHive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feeders per Hive</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Multiplier</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 1.5)}
                        />
                      </FormControl>
                      <FormDescription>
                        Target hives = Current hives × multiplier (e.g., 1.5 = 50% buffer)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Settings
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};