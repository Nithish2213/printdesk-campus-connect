
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Only admins should access this
        if (currentUser?.role !== 'admin') {
          toast.error("You don't have permission to view this page");
          return;
        }

        setLoading(true);
        
        // First get users from auth.users through profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('role', { ascending: false });

        if (profilesError) {
          throw profilesError;
        }

        console.log("Fetched user profiles:", profiles);
        setUsers(profiles || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading user data...</div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Showing {users.length} registered users
                </p>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium 
                            ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                              user.role === 'xerox' ? 'bg-purple-100 text-purple-800' : 
                              'bg-green-100 text-green-800'}`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{user.id}</TableCell>
                        <TableCell>{user.roll_number || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="font-medium text-yellow-800">Default Login Credentials</h3>
                <p className="mt-2 text-sm">For security reasons, we don't display user passwords in plain text. Default credentials are:</p>
                <ul className="mt-2 ml-4 list-disc text-sm">
                  <li><strong>Admin:</strong> admin@gmail.com / password123</li>
                  <li><strong>Xerox Staff:</strong> xerox@gmail.com / password123</li>
                  <li><strong>Students:</strong> Create accounts with signup form</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
