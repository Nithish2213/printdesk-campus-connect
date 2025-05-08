
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PrintContext = createContext();

export const usePrint = () => {
  return useContext(PrintContext);
};

export const PrintProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [serverActive, setServerActive] = useState(true);
  const [staff, setStaff] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch server status from Supabase
  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('server_status')
          .select('is_active')
          .eq('id', 1)
          .single();
          
        if (error) {
          console.error("Error fetching server status:", error);
          return;
        }
        
        setServerActive(data.is_active);
      } catch (error) {
        console.error("Error in server status fetch:", error);
      }
    };
    
    fetchServerStatus();
    
    // Set up realtime subscription for server status changes
    const serverStatusSubscription = supabase
      .channel('public:server_status')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'server_status'
        }, 
        (payload) => {
          setServerActive(payload.new.is_active);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(serverStatusSubscription);
    };
  }, []);
  
  // Fetch orders from Supabase
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchOrders = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('orders')
          .select('*');
          
        // If student, only fetch their orders
        if (currentUser.role === 'student') {
          query = query.eq('user_id', currentUser.id);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching orders:', error);
          return;
        }
        
        setOrders(data || []);
      } catch (error) {
        console.error('Error in orders fetch:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    
    // Set up realtime subscription for orders
    const ordersSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        }, 
        (payload) => {
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
      
    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [currentUser]);
  
  // Fetch staff members
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching staff:', error);
          return;
        }
        
        setStaff(data || []);
      } catch (error) {
        console.error('Error in staff fetch:', error);
      }
    };
    
    fetchStaff();
  }, [currentUser]);
  
  // Fetch inventory
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'xerox')) return;
    
    const fetchInventory = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('last_updated', { ascending: false });
          
        if (error) {
          console.error('Error fetching inventory:', error);
          return;
        }
        
        setInventory(data || []);
      } catch (error) {
        console.error('Error in inventory fetch:', error);
      }
    };
    
    fetchInventory();
  }, [currentUser]);

  const toggleServer = async () => {
    try {
      const newStatus = !serverActive;
      
      const { error } = await supabase
        .from('server_status')
        .update({ 
          is_active: newStatus,
          last_updated: new Date().toISOString()
        })
        .eq('id', 1);
      
      if (error) {
        console.error('Error updating server status:', error);
        toast.error("Failed to update server status");
        return serverActive;
      }
      
      setServerActive(newStatus);
      toast.success(`Server ${newStatus ? 'activated' : 'deactivated'} successfully`);
      return newStatus;
    } catch (error) {
      console.error('Error toggling server:', error);
      toast.error("Error updating server status");
      return serverActive;
    }
  };

  const submitOrder = async (fileData, printType, copies, isColorPrint, isDoubleSided, message) => {
    if (!currentUser) {
      toast.error("You must be logged in to submit an order");
      return null;
    }
    
    if (!serverActive && currentUser.role === 'student') {
      toast.error("Xerox server is currently offline. Please try again later.");
      return null;
    }
    
    try {
      // Upload file to Supabase Storage
      const fileExt = fileData.name.split('.').pop();
      const fileName = `${currentUser.id}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const { data: fileData2, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, fileData);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error("Failed to upload file");
        return null;
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      // Create a new order record
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: currentUser.id,
          file_url: publicUrl,
          file_name: fileData.name,
          copies: parseInt(copies),
          is_color_print: isColorPrint,
          is_double_sided: isDoubleSided,
          paper_size: printType,
          notes: message,
          status: 'Pending Payment',
          payment_status: 'pending'
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        toast.error("Failed to create order");
        return null;
      }
      
      return newOrder;
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error("Error submitting order");
      return null;
    }
  };

  const completePayment = async (orderId) => {
    try {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'Paid - Waiting for Processing', 
          payment_status: 'paid',
          otp 
        })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error updating order payment:', error);
        toast.error("Failed to process payment");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error("Error processing payment");
      return false;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error updating order status:', error);
        toast.error("Failed to update order status");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Error updating order status");
      return false;
    }
  };

  const addStaffMember = async (name, email, role) => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert({
          name,
          email,
          role,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding staff member:', error);
        toast.error("Failed to add staff member");
        return null;
      }
      
      setStaff(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding staff member:', error);
      toast.error("Error adding staff member");
      return null;
    }
  };

  const updateStaffMember = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating staff member:', error);
        toast.error("Failed to update staff member");
        return false;
      }
      
      setStaff(prev => 
        prev.map(staff => 
          staff.id === id ? { ...staff, ...updates } : staff
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating staff member:', error);
      toast.error("Error updating staff member");
      return false;
    }
  };

  const deleteStaffMember = async (id) => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting staff member:', error);
        toast.error("Failed to delete staff member");
        return false;
      }
      
      setStaff(prev => prev.filter(staff => staff.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast.error("Error deleting staff member");
      return false;
    }
  };

  const addInventoryItem = async (name, category, quantity) => {
    try {
      const status = parseInt(quantity) > 0 ? 'In Stock' : 'Out of Stock';
      
      const { data, error } = await supabase
        .from('inventory')
        .insert({
          name,
          category,
          quantity: parseInt(quantity),
          status
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding inventory item:', error);
        toast.error("Failed to add inventory item");
        return null;
      }
      
      setInventory(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast.error("Error adding inventory item");
      return null;
    }
  };

  const updateInventoryItem = async (id, updates) => {
    try {
      // Update status based on quantity if quantity is being updated
      if (updates.quantity !== undefined) {
        updates.status = parseInt(updates.quantity) > 0 ? 'In Stock' : 'Out of Stock';
      }
      
      updates.last_updated = new Date().toISOString();
      
      const { error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating inventory item:', error);
        toast.error("Failed to update inventory item");
        return false;
      }
      
      setInventory(prev => 
        prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast.error("Error updating inventory item");
      return false;
    }
  };

  const deleteInventoryItem = async (id) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting inventory item:', error);
        toast.error("Failed to delete inventory item");
        return false;
      }
      
      setInventory(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast.error("Error deleting inventory item");
      return false;
    }
  };

  const value = {
    orders,
    serverActive,
    staff,
    inventory,
    loading,
    toggleServer,
    submitOrder,
    completePayment,
    updateOrderStatus,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
  };

  return (
    <PrintContext.Provider value={value}>
      {children}
    </PrintContext.Provider>
  );
};
