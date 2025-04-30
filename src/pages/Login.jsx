
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    
    try {
      const user = await login(email, password);
      
      // Redirect based on user role
      if (user.role === 'student') {
        navigate('/student/upload');
      } else if (user.role === 'xerox') {
        navigate('/xerox/orders');
      } else if (user.role === 'admin') {
        navigate('/admin/staff');
      } else {
        // Default redirect if role is undefined
        navigate('/');
      }
      
      toast.success(`Welcome back, ${user.name || 'User'}!`);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  // Predefined accounts for quick access
  const predefinedAccounts = [
    { type: 'Admin', email: 'admin@gmail.com', password: 'admin123' },
    { type: 'Xerox Operator', email: 'xerox@gmail.com', password: 'admin123' }
  ];

  const fillCredentials = (email, password) => {
    setEmail(email);
    setPassword(password);
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
        </div>
        
        {/* Predefined accounts section */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border">
          <h2 className="text-center text-lg font-medium mb-3">Predefined Accounts</h2>
          <div className="space-y-3">
            {predefinedAccounts.map((account, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{account.type}</p>
                    <p className="text-sm text-gray-600">Email: {account.email}</p>
                    <p className="text-sm text-gray-600">Password: {account.password}</p>
                  </div>
                  <button
                    onClick={() => fillCredentials(account.email, account.password)}
                    className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
