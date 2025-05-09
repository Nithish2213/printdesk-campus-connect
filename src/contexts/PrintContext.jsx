
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
  const [orders, setOrders] = useState([]);
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

    // Fetch orders for admin/xerox users
    const fetchOrders = async () => {
      if (currentUser && (currentUser.role === 'xerox' || currentUser.role === 'admin')) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          
          console.log("Fetched orders for admin/xerox:", data);
          setOrders(data || []);
        } catch (error) {
          console.error("Error fetching orders:", error);
          setOrders([]);
        }
      }
    };

    fetchServerStatus();
    fetchOrders();

    // Set up real-time subscription for server status
    const serverStatusChannel = supabase
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
      
    // Set up real-time subscription for orders (only for admin/xerox)
    let ordersChannel = null;
    
    if (currentUser && (currentUser.role === 'xerox' || currentUser.role === 'admin')) {
      ordersChannel = supabase
        .channel('orders-changes')
        .on('postgres_changes', 
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          }, 
          (payload) => {
            console.log("Order update received:", payload);
            
            if (payload.eventType === 'INSERT') {
              setOrders(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => 
                prev.map(order => 
                  order.id === payload.new.id ? payload.new : order
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setOrders(prev => 
                prev.filter(order => order.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();
    }
      
    return () => {
      supabase.removeChannel(serverStatusChannel);
      if (ordersChannel) supabase.removeChannel(ordersChannel);
    };
  }, [currentUser]);

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
    orders,
  };

  return (
    <PrintContext.Provider value={value}>
      {children}
    </PrintContext.Provider>
  );
}
