
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

// Utility function to create default accounts if they don't exist
const createDefaultAccounts = async () => {
  console.log("Checking for default accounts...");
  
  try {
    // Check if admin and xerox users exist
    const adminCheck = await supabase.auth.signInWithPassword({
      email: 'admin@gmail.com',
      password: 'password123'
    });
    
    if (adminCheck.error) {
      console.log("Admin account doesn't exist, creating...");
      // Create admin account
      const { data: adminSignup, error: adminSignupError } = await supabase.auth.signUp({
        email: 'admin@gmail.com',
        password: 'password123',
        options: {
          data: {
            name: 'Admin User',
            role: 'admin'
          }
        }
      });
      
      if (adminSignupError) {
        console.error("Error creating admin account:", adminSignupError);
      } else {
        console.log("Admin account created successfully");
      }
    } else {
      console.log("Admin account already exists");
    }

    // Sign out after checking/creating admin account
    await supabase.auth.signOut();
    
    // Check xerox account
    const xeroxCheck = await supabase.auth.signInWithPassword({
      email: 'xerox@gmail.com',
      password: 'password123'
    });
    
    if (xeroxCheck.error) {
      console.log("Xerox account doesn't exist, creating...");
      // Create xerox account
      const { data: xeroxSignup, error: xeroxSignupError } = await supabase.auth.signUp({
        email: 'xerox@gmail.com',
        password: 'password123',
        options: {
          data: {
            name: 'Xerox Operator',
            role: 'xerox'
          }
        }
      });
      
      if (xeroxSignupError) {
        console.error("Error creating xerox account:", xeroxSignupError);
      } else {
        console.log("Xerox account created successfully");
      }
    } else {
      console.log("Xerox account already exists");
    }

    // Final sign out
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error("Error checking/creating default accounts:", error);
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Create default accounts if needed
    createDefaultAccounts();
    
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      setSession(session);
      
      if (session) {
        // Use setTimeout to avoid potential deadlocks
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
            
            console.log("Fetched user profile:", user);
            setCurrentUser(user);
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setCurrentUser(session.user);
          } finally {
            setLoading(false);
          }
        }, 0);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session);
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
              
              console.log("Initial profile fetch:", user);
              setCurrentUser(user);
            } else {
              console.error("Error fetching user profile:", error);
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      // Clean up existing auth state
      cleanupAuthState();
      
      // Try global sign out first
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

      if (error) throw error;

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

        console.log("Logged in user:", user);
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
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
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
