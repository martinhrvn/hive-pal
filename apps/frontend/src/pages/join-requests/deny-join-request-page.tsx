import { useEffect } from 'react';
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
  const denyMutation = useDenyJoinRequest();

  useEffect(() => {
    if (!token) return;
    denyMutation.mutate({ token });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  let denyError: string | null = null;
  if (denyMutation.error) {
    denyError = (denyMutation.error as any)?.response?.data?.message
      ?? 'Something went wrong. The request may have already been processed.';
  }

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
            <Button variant="outline" onClick={() => { globalThis.location.href = '/'; }}>
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
          <Button variant="outline" onClick={() => { globalThis.location.href = '/'; }}>
            Go to Hive Pal
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
