
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
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
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
      setSession(session);
      
      if (session) {
        setTimeout(async () => {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (!error && profile) {
            setCurrentUser({
              ...session.user,
              ...profile
            });
          } else {
            console.error("Error fetching user profile:", error);
            setCurrentUser(session.user);
          }
          setLoading(false);
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
        setSession(data.session);
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
      setSession(null);
      navigate('/login');
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error("Error logging out");
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
