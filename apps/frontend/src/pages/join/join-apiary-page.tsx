import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInviteInfo, useJoinApiary } from '@/api/hooks';
import { useAuth } from '@/context/auth-context';
import { Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function JoinApiaryPage() {
  const { token } = useParams<{ token: string }>();
  const { isLoggedIn } = useAuth();
  const { data, isLoading, error } = useInviteInfo(token ?? '');
  const joinMutation = useJoinApiary();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    if (!token) return;
    try {
      await joinMutation.mutateAsync(token);
      setJoined(true);
    } catch {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invite not found</h2>
            <p className="text-muted-foreground mb-4">
              This invite link may have been revoked or is invalid.
            </p>
            <Link to="/">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invite expired</h2>
            <p className="text-muted-foreground mb-4">
              This invite link has expired. Ask the apiary owner for a new one.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already joined or is the owner
  if (data.alreadyMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Already a member</h2>
            <p className="text-muted-foreground mb-4">
              You already have access to <strong>{data.apiaryName}</strong>.
            </p>
            <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Successfully joined — pending approval
  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Request sent!</h2>
            <p className="text-muted-foreground mb-4">
              Your request to join <strong>{data.apiaryName}</strong> has been
              submitted. The owner will review it shortly.
            </p>
            <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabel = data.role === 'EDITOR' ? 'Full access' : 'View only';

  // Not logged in — show sign in / sign up options
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl">Join {data.apiaryName}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You&apos;ve been invited to join this apiary with{' '}
              <Badge variant="secondary">{roleLabel}</Badge> permissions.
            </p>
            <p className="text-sm text-muted-foreground">
              Sign in or create an account to continue.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                state={{ from: { pathname: `/join/${token}` } }}
              >
                <Button className="w-full">Sign in</Button>
              </Link>
              <Link
                to="/register"
                state={{ from: { pathname: `/join/${token}` } }}
              >
                <Button variant="outline" className="w-full">
                  Create account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in — show join button
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Join {data.apiaryName}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You&apos;ve been invited to join this apiary with{' '}
            <Badge variant="secondary">{roleLabel}</Badge> permissions.
          </p>
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Requesting...
              </>
            ) : (
              'Request to Join'
            )}
          </Button>
          {joinMutation.isError && (
            <p className="text-sm text-destructive">
              Failed to join. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
