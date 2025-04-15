
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from "sonner";
import Logo from '../components/Logo';
import { Printer } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Predefined admin and xerox accounts
  const predefinedAccounts = {
    admin: {
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin'
    },
    xerox: {
      email: 'xerox@gmail.com',
      password: 'xerox123',
      role: 'xerox'
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
      // Check for predefined accounts first
      if (email === predefinedAccounts.admin.email && password === predefinedAccounts.admin.password) {
        // Mock login for admin
        const adminUser = {
          email: predefinedAccounts.admin.email,
          name: 'Admin User',
          role: predefinedAccounts.admin.role
        };
        
        // Redirect to admin page
        navigate('/admin/staff');
        toast.success(`Welcome back, Admin!`);
        return;
      } 
      else if (email === predefinedAccounts.xerox.email && password === predefinedAccounts.xerox.password) {
        // Mock login for xerox
        const xeroxUser = {
          email: predefinedAccounts.xerox.email,
          name: 'Xerox Operator',
          role: predefinedAccounts.xerox.role
        };
        
        // Redirect to xerox page
        navigate('/xerox/orders');
        toast.success(`Welcome back, Xerox Operator!`);
        return;
      }
      
      // If not a predefined account, try regular login via Supabase
      const user = await login(email, password);
      
      // Redirect based on user role
      if (user.role === 'student') {
        navigate('/student/upload');
      } else if (user.role === 'xerox') {
        navigate('/xerox/orders');
      } else if (user.role === 'admin') {
        navigate('/admin/staff');
      }
      
      toast.success(`Welcome back, ${user.name}!`);
    } catch (error) {
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
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
                placeholder="Email address"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
                placeholder="Password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-150 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          {/* Display predefined account info for testing */}
          <div className="mt-4 text-sm text-gray-500">
            <p>Admin login: admin@gmail.com / admin123</p>
            <p>Xerox login: xerox@gmail.com / xerox123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
