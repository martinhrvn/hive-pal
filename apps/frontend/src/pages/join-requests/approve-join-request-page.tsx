import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckIcon, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useJoinRequestInfo, useApproveJoinRequest } from '@/api/hooks';

export const ApproveJoinRequestPage = () => {
  const { token } = useParams<{ token: string }>();
  const [role, setRole] = useState('VIEWER');
  const [done, setDone] = useState(false);

  const { data: info, isLoading, error } = useJoinRequestInfo(token ?? '');
  const approveMutation = useApproveJoinRequest();

  const handleApprove = async () => {
    if (!token) return;
    try {
      await approveMutation.mutateAsync({ token, role });
      setDone(true);
    } catch { /* error shown inline */ }
  };

  let approveError: string | null = null;
  if (approveMutation.error) {
    approveError = (approveMutation.error as any)?.response?.data?.message
      ?? 'Something went wrong. Please try again.';
  }

  let infoError: string | null = null;
  if (error) {
    infoError = (error as any)?.response?.data?.message
      ?? 'This link is invalid or has already been used.';
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (infoError || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle>Link Unavailable</CardTitle>
            <CardDescription>{infoError ?? 'This link is no longer valid.'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle>Request Approved</CardTitle>
            <CardDescription>
              <strong>{info.requesterName}</strong> has been added to <strong>{info.apiaryName}</strong> as <strong>{role}</strong>. They'll receive a confirmation email.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => { globalThis.location.href = '/'; }}>Open Hive Pal</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Approve Join Request</CardTitle>
          <CardDescription>
            <strong>{info.requesterName}</strong> ({info.requesterEmail}) wants to join your apiary <strong>"{info.apiaryName}"</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-select">Assign a role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">Editor — can add inspections and manage hives</SelectItem>
                <SelectItem value="VIEWER">Viewer — read-only access</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {approveError && <p className="text-sm text-destructive">{approveError}</p>}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleApprove}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Approving…</>
              : '✓ Approve and Add Member'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
