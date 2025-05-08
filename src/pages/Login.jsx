
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from "sonner";
import { Printer, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      redirectBasedOnRole(currentUser);
    }
  }, [currentUser]);

  const redirectBasedOnRole = (user) => {
    if (user.role === 'student') {
      navigate('/student/upload');
    } else if (user.role === 'xerox') {
      navigate('/xerox/orders');
    } else if (user.role === 'admin') {
      navigate('/admin/staff');
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    
    try {
      const user = await login(email, password);
      
      if (user) {
        toast.success(`Welcome back, ${user.name || 'User'}!`);
        redirectBasedOnRole(user);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Printer className="text-primary h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold mt-4">Sign in to PrintHub</h1>
          <p className="text-gray-600 mt-2">Student Print Management System</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                placeholder="Email address"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                placeholder="Password"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-indigo-700"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="text-primary text-sm flex items-center hover:underline"
              >
                <Info size={16} className="mr-1" />
                {showInfo ? 'Hide login info' : 'View login info'}
              </button>
            </div>

            {showInfo && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <h3 className="font-medium text-blue-800 mb-2">Login Information:</h3>
                <p className="mb-1"><strong>Admin:</strong> admin@gmail.com / password123</p>
                <p className="mb-1"><strong>Xerox:</strong> xerox@gmail.com / password123</p>
                <p><strong>Student:</strong> Create a new account or use an existing one</p>
              </div>
            )}
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
          <div className="text-xs text-gray-500 mt-3">
            <p>Note: Only students can create new accounts.</p>
            <p>Admin and Staff accounts are pre-configured.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
