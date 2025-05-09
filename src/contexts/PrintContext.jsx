
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
  const [inventoryItems, setInventoryItems] = useState([]);
  const [revenue, setRevenue] = useState([]);
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

    // Fetch inventory items
    const fetchInventory = async () => {
      if (currentUser && (currentUser.role === 'xerox' || currentUser.role === 'admin')) {
        try {
          const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('last_updated', { ascending: false });
            
          if (error) throw error;
          
          console.log("Fetched inventory items:", data);
          setInventoryItems(data || []);
        } catch (error) {
          console.error("Error fetching inventory:", error);
          setInventoryItems([]);
        }
      }
    };

    // Generate revenue data based on orders
    const generateRevenueData = () => {
      if (!orders || orders.length === 0) return;

      // Group orders by date
      const ordersByDate = orders.reduce((acc, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = [];
        }
        
        acc[date].push(order);
        return acc;
      }, {});
      
      // Calculate revenue stats
      const revenueData = Object.keys(ordersByDate).map(date => {
        const ordersForDate = ordersByDate[date];
        const orderCount = ordersForDate.length;
        
        // Calculate revenue (assuming each order has a price of 5 for simplicity)
        const totalRevenue = ordersForDate.reduce((sum, order) => {
          let price = 1; // Base price
          if (order.is_color_print) price += 4;
          if (order.paper_size === 'Glossy Print') price += 3;
          if (order.paper_size === 'Matte Print') price += 2;
          
          return sum + (price * order.copies);
        }, 0);
        
        // Assume expenses are 40% of revenue
        const expenses = Math.round(totalRevenue * 0.4);
        const profit = totalRevenue - expenses;
        
        return {
          date,
          orders: orderCount,
          revenue: totalRevenue,
          expenses,
          profit
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      console.log("Generated revenue data:", revenueData);
      setRevenue(revenueData);
    };

    fetchServerStatus();
    fetchOrders();
    fetchInventory();

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
    let inventoryChannel = null;
    
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

      // Set up real-time subscription for inventory
      inventoryChannel = supabase
        .channel('inventory-changes')
        .on('postgres_changes', 
          {
            event: '*',
            schema: 'public',
            table: 'inventory'
          }, 
          (payload) => {
            console.log("Inventory update received:", payload);
            
            if (payload.eventType === 'INSERT') {
              setInventoryItems(prev => [payload.new, ...prev]);
              
              // Show alert if inventory is low
              if (payload.new.quantity <= 5 && currentUser.role === 'admin') {
                toast.warning(`Low inventory alert: ${payload.new.name} is running low (${payload.new.quantity} remaining)`);
              }
            } else if (payload.eventType === 'UPDATE') {
              setInventoryItems(prev => 
                prev.map(item => 
                  item.id === payload.new.id ? payload.new : item
                )
              );
              
              // Show alert if inventory is low
              if (payload.new.quantity <= 5 && currentUser.role === 'admin') {
                toast.warning(`Low inventory alert: ${payload.new.name} is running low (${payload.new.quantity} remaining)`);
              }
            } else if (payload.eventType === 'DELETE') {
              setInventoryItems(prev => 
                prev.filter(item => item.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();
    }

    // Generate revenue data whenever orders change
    if (orders.length > 0) {
      generateRevenueData();
    }
      
    return () => {
      supabase.removeChannel(serverStatusChannel);
      if (ordersChannel) supabase.removeChannel(ordersChannel);
      if (inventoryChannel) supabase.removeChannel(inventoryChannel);
    };
  }, [currentUser, orders]);

  // Function to toggle server status
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
      
      console.log("Server status toggled:", data);
      // State will be updated by the real-time subscription
      return data;
    } catch (error) {
      console.error("Error toggling server status:", error);
      toast.error("Failed to update server status");
      throw error;
    }
  };

  // Function to submit a new print order
  const submitOrder = async (file, printType, copies, colorPrint, doubleSided, message) => {
    try {
      if (!currentUser) {
        toast.error("You must be logged in to submit an order");
        return null;
      }

      setLoading(true);
      const fileName = file.name;
      const fileExt = fileName.split('.').pop();
      
      // Upload file to Supabase Storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('print-files')
        .upload(`${currentUser.id}/${Date.now()}.${fileExt}`, file);
        
      if (fileError) throw fileError;
      
      const fileUrl = fileData.path;
      
      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create the order in the database
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: currentUser.id,
          file_url: fileUrl,
          file_name: fileName,
          paper_size: printType,
          copies: copies,
          is_color_print: colorPrint,
          is_double_sided: doubleSided,
          notes: message,
          status: 'Pending Payment',
          otp: otp
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log("Order submitted successfully:", data);
      toast.success("Order submitted");
      return data;
      
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Failed to submit order: " + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to complete payment for an order
  const completePayment = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'Processing'
        })
        .eq('id', orderId)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log("Payment completed:", data);
      return true;
    } catch (error) {
      console.error("Error completing payment:", error);
      toast.error("Payment failed");
      return false;
    }
  };

  const value = {
    serverActive,
    toggleServer,
    loading,
    orders,
    inventoryItems,
    revenue,
    submitOrder,
    completePayment
  };

  return (
    <PrintContext.Provider value={value}>
      {children}
    </PrintContext.Provider>
  );
}
