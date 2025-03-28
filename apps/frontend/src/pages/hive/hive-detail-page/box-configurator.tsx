import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HiveDetailResponse } from 'shared-schemas';

/**
 * A component for configuring boxes in a hive
 * This is a placeholder that will be implemented later
 */
export const BoxConfigurator = ({
  hive,
}: {
  hive: HiveDetailResponse | undefined;
}) => {
  return (
    <div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Box Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This section allows you to configure the boxes in your hive. You can
            add, remove, and reorder boxes to match your physical hive setup.
          </p>

          {hive?.boxes && hive.boxes.length > 0 ? (
            <div className="space-y-4">
              <p>Current configuration:</p>
              <div className="border rounded-md p-4">
                {hive.boxes.map((box, index) => (
                  <div
                    key={box.id || index}
                    className="p-3 border border-dashed rounded-md mb-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Box {index + 1}</span>
                      <span className="text-sm text-muted-foreground">
                        Max frames: {box.maxFrameCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No boxes configured yet.</p>
          )}

          <div className="mt-6 text-center">
            <p className="italic text-muted-foreground">
              Full box configuration functionality will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
