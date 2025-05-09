
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Utility function to clean up auth state
const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

// Store predefined users for admin and xerox
const PREDEFINED_USERS = {
  admin: {
    email: 'admin@gmail.com',
    password: 'password123',
    name: 'Admin User',
    role: 'admin'
  },
  xerox: {
    email: 'xerox@gmail.com',
    password: 'password123',
    name: 'Xerox Operator',
    role: 'xerox'
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper function to handle predefined users
  const handlePredefinedLogin = (email, password) => {
    // Check if login is for admin
    if (email === PREDEFINED_USERS.admin.email && password === PREDEFINED_USERS.admin.password) {
      const adminUser = {
        id: 'admin-user-id',
        email: PREDEFINED_USERS.admin.email,
        name: PREDEFINED_USERS.admin.name,
        role: PREDEFINED_USERS.admin.role
      };
      
      // Store in localStorage for persistent login
      localStorage.setItem('predefinedUser', JSON.stringify(adminUser));
      
      setCurrentUser(adminUser);
      return adminUser;
    }
    
    // Check if login is for xerox
    if (email === PREDEFINED_USERS.xerox.email && password === PREDEFINED_USERS.xerox.password) {
      const xeroxUser = {
        id: 'xerox-user-id',
        email: PREDEFINED_USERS.xerox.email,
        name: PREDEFINED_USERS.xerox.name,
        role: PREDEFINED_USERS.xerox.role
      };
      
      // Store in localStorage for persistent login
      localStorage.setItem('predefinedUser', JSON.stringify(xeroxUser));
      
      setCurrentUser(xeroxUser);
      return xeroxUser;
    }
    
    return null;
  };

  // Check for stored predefined user on startup
  useEffect(() => {
    const storedPredefinedUser = localStorage.getItem('predefinedUser');
    
    if (storedPredefinedUser) {
      const user = JSON.parse(storedPredefinedUser);
      setCurrentUser(user);
      setLoading(false);
    } else {
      // Continue with regular Supabase auth checks
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        
        if (session) {
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
              if (!error && profile) {
                const user = {
                  ...session.user,
                  ...profile
                };
                
                setCurrentUser(user);
              } else {
                setCurrentUser(session.user);
              }
            } catch (error) {
              console.error("Session error:", error);
              setCurrentUser(null);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setLoading(false);
        }
      });
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        
        if (session) {
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
              if (error) throw error;
              
              const user = {
                ...session.user,
                ...profile
              };
              
              setCurrentUser(user);
            } catch (error) {
              console.error("Error fetching user profile:", error);
              setCurrentUser(session.user);
            }
          }, 0);
        } else {
          setCurrentUser(null);
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email, password) => {
    try {
      // First try predefined users
      const predefinedUser = handlePredefinedLogin(email, password);
      if (predefinedUser) {
        console.log("Logged in as predefined user:", predefinedUser);
        return predefinedUser;
      }
      
      // If not predefined, try regular Supabase auth
      console.log("Attempting regular login with:", email);
      
      // Clean up existing auth state
      cleanupAuthState();
      
      // Try global sign out first to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Pre-signout failed, continuing with login");
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error);
        throw error;
      }

      console.log("Login successful, user data:", data);

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          // Continue anyway, profile might be created by trigger
        }

        const user = {
          ...data.user,
          ...(profile || {})
        };

        console.log("Logged in user with profile:", user);
        setCurrentUser(user);
        setSession(data.session);
        return user;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error.message || "Failed to log in");
    }
  };

  const signup = async (name, rollNumber, email, password) => {
    try {
      // Don't allow signing up with predefined emails
      if (email === PREDEFINED_USERS.admin.email || email === PREDEFINED_USERS.xerox.email) {
        throw new Error("This email is reserved for system use. Please use a different email.");
      }
      
      // Clean up existing auth state
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            rollNumber,
            role: 'student' // Always set role as student for signup
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Account created successfully! Please check your email for verification.");
        return data.user;
      }
    } catch (error) {
      throw new Error(error.message || "Failed to create account");
    }
  };

  const logout = async () => {
    try {
      // First clear predefined users if they exist
      localStorage.removeItem('predefinedUser');
      
      // Clean up auth state
      cleanupAuthState();
      
      // Attempt global sign out for Supabase auth
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      setCurrentUser(null);
      setSession(null);
      
      // Force full page refresh for clean state
      window.location.href = '/login';
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    }
  };

  const value = {
    currentUser,
    session,
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

export default AuthProvider;
