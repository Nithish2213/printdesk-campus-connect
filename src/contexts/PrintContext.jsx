
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

const PrintContext = createContext();

export function usePrint() {
  return useContext(PrintContext);
}

export function PrintProvider({ children }) {
  const [serverActive, setServerActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();
  const currentUser = auth?.currentUser;

  useEffect(() => {
    // Fetch initial server status
    const fetchServerStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('server_status')
          .select('is_active')
          .eq('id', 1)
          .single();

        if (error) throw error;
        
        console.log("Server status:", data);
        setServerActive(data?.is_active ?? true);
      } catch (error) {
        console.error("Error fetching server status:", error);
        // Default to active if there's an error
        setServerActive(true);
      } finally {
        setLoading(false);
      }
    };

    fetchServerStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel('server-status-changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'server_status',
        }, 
        (payload) => {
          console.log("Server status changed:", payload);
          setServerActive(payload.new.is_active);
          
          if (payload.new.is_active) {
            toast.success("Print server is now online");
          } else {
            toast.warning("Print server is now offline");
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleServer = async () => {
    try {
      const { data, error } = await supabase
        .from('server_status')
        .update({ 
          is_active: !serverActive,
          last_updated: new Date().toISOString()
        })
        .eq('id', 1)
        .select();

      if (error) throw error;
      
      // State will be updated by the real-time subscription
      return data;
    } catch (error) {
      console.error("Error toggling server status:", error);
      toast.error("Failed to update server status");
      throw error;
    }
  };

  const value = {
    serverActive,
    toggleServer,
    loading,
  };

  return (
    <PrintContext.Provider value={value}>
      {children}
    </PrintContext.Provider>
  );
}
