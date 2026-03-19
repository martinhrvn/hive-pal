import { useEffect, useState } from 'react';
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
import { useDenyJoinRequest } from '@/api/hooks';

export const DenyJoinRequestPage = () => {
  const { token } = useParams<{ token: string }>();
  const [done, setDone] = useState(false);
  const denyMutation = useDenyJoinRequest();

  useEffect(() => {
    if (!token) return;
    denyMutation.mutate(
      { token },
      {
        onSuccess: () => setDone(true),
      },
    );
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const denyError =
    denyMutation.error && (denyMutation.error as any)?.response?.data?.message
      ? (denyMutation.error as any).response.data.message
      : denyMutation.error
        ? 'Something went wrong. The request may have already been processed.'
        : null;

  if (denyMutation.isPending) {
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

  if (denyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle>Could Not Process</CardTitle>
            <CardDescription>{denyError}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => (window.location.href = '/')}>
              Go to Hive Pal
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
              <CheckIcon className="h-8 w-8 text-slate-600" />
            </div>
          </div>
          <CardTitle>Request Denied</CardTitle>
          <CardDescription>
            The join request has been denied. The requester will be notified by email.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go to Hive Pal
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
