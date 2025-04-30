
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) throw error;
          
          setCurrentUser({
            ...session.user,
            ...profile
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setCurrentUser(session.user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (!error) {
              setCurrentUser({
                ...session.user,
                ...profile
              });
            } else {
              console.error("Error fetching user profile:", error);
              setCurrentUser(session.user);
            }
          });
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    // Check for predefined accounts first
    if (email === 'admin@gmail.com' && password === 'admin123') {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (error) throw error;

          const user = {
            ...data.user,
            ...profile
          };

          setCurrentUser(user);
          return user;
        }
      } catch (error) {
        console.error("Error logging in as admin:", error);
        toast.error("Failed to log in as admin. Please try again later.");
        throw new Error("Failed to log in as admin");
      }
    } else if (email === 'xerox@gmail.com' && password === 'admin123') {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (error) throw error;

          const user = {
            ...data.user,
            ...profile
          };

          setCurrentUser(user);
          return user;
        }
      } catch (error) {
        console.error("Error logging in as xerox:", error);
        toast.error("Failed to log in as xerox. Please try again later.");
        throw new Error("Failed to log in as xerox");
      }
    }

    // Regular user login
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        let user;
        
        if (!error && profile) {
          user = {
            ...data.user,
            ...profile
          };
        } else {
          console.warn("No profile found for user, using basic user data");
          user = {
            ...data.user,
            role: 'student' // Default role
          };
        }

        setCurrentUser(user);
        return user;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error.message);
    }
  };

  const signup = async (name, rollNumber, email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            rollNumber
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Account created successfully! Please check your email for verification.");
        return data.user;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCurrentUser(null);
      navigate('/');
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error("Error logging out");
    }
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
