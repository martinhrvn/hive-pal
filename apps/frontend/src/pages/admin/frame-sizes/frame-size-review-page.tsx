import React from 'react';
import { useIsAdmin } from '@/hooks/use-is-admin';
import {
  useAdminFrameSizes,
  useApproveFrameSize,
  useRejectFrameSize,
  useDeleteFrameSize,
} from '@/api/hooks/useFrameSizes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Check, X, Trash2, RefreshCw } from 'lucide-react';
import { FrameSize, FrameSizeStatus } from 'shared-schemas';

const getStatusBadgeVariant = (
  status: string,
): 'destructive' | 'secondary' | 'default' | 'outline' => {
  switch (status) {
    case 'PENDING':
      return 'secondary';
    case 'APPROVED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const FrameSizeReviewPage: React.FC = () => {
  const isAdmin = useIsAdmin();
  const { data: frameSizes = [], isLoading, refetch } = useAdminFrameSizes();
  const approveMutation = useApproveFrameSize();
  const rejectMutation = useRejectFrameSize();
  const deleteMutation = useDeleteFrameSize();

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    );
  }

  const pendingSizes = frameSizes.filter(
    (fs: FrameSize) => fs.status === FrameSizeStatus.PENDING,
  );
  const otherSizes = frameSizes.filter(
    (fs: FrameSize) => fs.status !== FrameSizeStatus.PENDING,
  );

  return (
    <div className="space-y-6">
      {/* Pending Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pending Frame Size Submissions
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Review and approve community-submitted frame sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Width (mm)</TableHead>
                  <TableHead>Height (mm)</TableHead>
                  <TableHead>Depth (mm)</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : pendingSizes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No pending submissions
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingSizes.map((fs: FrameSize) => (
                    <TableRow key={fs.id}>
                      <TableCell className="font-medium">{fs.name}</TableCell>
                      <TableCell>{fs.width}</TableCell>
                      <TableCell>{fs.height}</TableCell>
                      <TableCell>{fs.depth}</TableCell>
                      <TableCell>
                        {format(new Date(fs.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMutation.mutate(fs.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectMutation.mutate(fs.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* All Frame Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>All Frame Sizes</CardTitle>
          <CardDescription>
            Manage approved and rejected frame sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Dimensions (mm)</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherSizes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No frame sizes found
                    </TableCell>
                  </TableRow>
                ) : (
                  otherSizes.map((fs: FrameSize) => (
                    <TableRow key={fs.id}>
                      <TableCell className="font-medium">{fs.name}</TableCell>
                      <TableCell>
                        {fs.width} x {fs.height} x {fs.depth}
                      </TableCell>
                      <TableCell>
                        {fs.isBuiltIn ? (
                          <Badge variant="outline">Built-in</Badge>
                        ) : (
                          <Badge variant="secondary">Community</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(fs.status)}>
                          {fs.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!fs.isBuiltIn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(fs.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FrameSizeReviewPage;
