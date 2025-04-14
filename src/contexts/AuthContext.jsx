
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const user = localStorage.getItem('printHubUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      // Validate login credentials for our three user types
      if (email.includes('@kgkite.ac.in') && password.length >= 6) {
        // Student login
        const user = {
          email,
          role: 'student',
          name: email.split('@')[0],
        };
        localStorage.setItem('printHubUser', JSON.stringify(user));
        setCurrentUser(user);
        resolve(user);
      } else if (email === 'xerox@gmail.com' && password === 'xerox@123') {
        // Xerox shop login
        const user = {
          email,
          role: 'xerox',
          name: 'Xerox Shop',
        };
        localStorage.setItem('printHubUser', JSON.stringify(user));
        setCurrentUser(user);
        resolve(user);
      } else if (email === 'admin@gmail.com' && password === 'admin@123') {
        // Admin login
        const user = {
          email,
          role: 'admin',
          name: 'Administrator',
        };
        localStorage.setItem('printHubUser', JSON.stringify(user));
        setCurrentUser(user);
        resolve(user);
      } else {
        // Invalid credentials
        reject(new Error('Invalid email or password'));
      }
    });
  };

  const signup = (name, rollNumber, email, password) => {
    return new Promise((resolve, reject) => {
      // Validate student email
      if (!email.includes('@kgkite.ac.in')) {
        reject(new Error('Please use your college email address (ending with @kgkite.ac.in)'));
        return;
      }

      if (password.length < 6) {
        reject(new Error('Password must be at least 6 characters'));
        return;
      }

      // Create the user
      const user = {
        name,
        rollNumber,
        email,
        role: 'student',
      };

      localStorage.setItem('printHubUser', JSON.stringify(user));
      setCurrentUser(user);
      resolve(user);
    });
  };

  const logout = () => {
    localStorage.removeItem('printHubUser');
    setCurrentUser(null);
    navigate('/');
    toast.success("Successfully logged out");
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
