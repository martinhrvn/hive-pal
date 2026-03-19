import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAcceptInvite } from '@/api/hooks';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const acceptInvite = useAcceptInvite();

  useEffect(() => {
    if (!token) return;
    acceptInvite.mutate(token, {
      onSuccess: ({ apiaryId }) => {
        toast.success('You have joined the apiary!');
        navigate(`/apiaries/${apiaryId}`, { replace: true });
      },
    });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (acceptInvite.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Accepting invitation...</p>
        </div>
      </div>
    );
  }

  if (acceptInvite.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">Invitation invalid</h1>
          <p className="text-muted-foreground text-sm">
            This invite link may have already been used or has expired.
          </p>
          <Button asChild>
            <Link to="/">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (acceptInvite.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
          <p className="text-muted-foreground">Redirecting you to the apiary...</p>
        </div>
      </div>
    );
  }

  return null;
}
