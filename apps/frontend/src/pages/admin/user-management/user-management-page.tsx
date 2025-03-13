import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context.tsx';
import { useIsAdmin } from '@/hooks/use-is-admin.ts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Alert } from '@/components/ui/alert.tsx';
import { AxiosError } from 'axios';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  passwordChangeRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserManagementPage: React.FC = () => {
  const { token } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check if user is admin, otherwise redirect
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<User[]>('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUsers(response.data);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || 'Failed to fetch users');
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const handleResetPassword = async () => {
    if (!selectedUser || !tempPassword.trim()) return;

    try {
      setError(null);

      await axios.post(
        `/api/users/${selectedUser.id}/reset-password`,
        { tempPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setResetSuccess(true);

      // Update user in the list to show passwordChangeRequired
      setUsers(
        users.map(u =>
          u.id === selectedUser.id ? { ...u, passwordChangeRequired: true } : u,
        ),
      );

      // Clear temporary password
      setTempPassword('');
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Failed to reset password');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage users and reset passwords</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Password Change Required</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name || '-'}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {user.passwordChangeRequired ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setTempPassword('');
                              setResetSuccess(false);
                            }}
                          >
                            Reset Password
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Reset User Password</SheetTitle>
                            <SheetDescription>
                              Set a temporary password for {selectedUser?.email}
                              . The user will be required to change their
                              password on next login.
                            </SheetDescription>
                          </SheetHeader>

                          <div className="mt-8 space-y-4">
                            {resetSuccess ? (
                              <div className="bg-green-50 text-green-800 p-4 rounded-md">
                                Password reset successful! The user will be
                                required to change their password on next login.
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="temp-password">
                                    Temporary Password
                                  </Label>
                                  <Input
                                    id="temp-password"
                                    type="text"
                                    value={tempPassword}
                                    onChange={e =>
                                      setTempPassword(e.target.value)
                                    }
                                    placeholder="Enter temporary password"
                                  />
                                  <p className="text-sm text-gray-500">
                                    Minimum 6 characters
                                  </p>
                                </div>

                                <Button
                                  onClick={handleResetPassword}
                                  disabled={
                                    !tempPassword.trim() ||
                                    tempPassword.length < 6
                                  }
                                  className="w-full"
                                >
                                  Reset Password
                                </Button>
                              </>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;
