
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, CheckCircle, Clock, Truck, Search } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../../components/ui/tabs";

const History = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, profiles:user_id(*)')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching orders:', error);
          return;
        }
        
        console.log("Fetched orders:", data);
        setOrders(data || []);
      } catch (error) {
        console.error('Error in orders fetch:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    
    // Set up realtime subscription for order updates
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        }, 
        (payload) => {
          console.log("Realtime order update received:", payload);
          
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
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Filter orders based on status and search term
  const filterOrders = (status, searchTerm) => {
    // Make sure orders exists and is an array
    if (!orders || !Array.isArray(orders)) {
      return [];
    }
    
    return orders
      .filter(order => {
        const matchesStatus = status === 'all' || 
                             (status === 'processing' && order.status === 'Processing') ||
                             (status === 'ready' && order.status === 'Ready for Pickup') ||
                             (status === 'completed' && order.status === 'Completed') ||
                             (status === 'delivered' && order.status === 'Delivered');
        
        const matchesSearch = !searchTerm || 
                             (order.file_name && order.file_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (order.profiles?.name && order.profiles.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (order.id && order.id.toString().includes(searchTerm));
        
        return order.payment_status === 'paid' && matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getStatusIcon = (status) => {
    if (status === 'Ready for Pickup') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'Processing') return <Clock className="h-5 w-5 text-blue-500" />;
    if (status === 'Completed') return <CheckCircle className="h-5 w-5 text-purple-500" />;
    if (status === 'Delivered') return <Truck className="h-5 w-5 text-indigo-500" />;
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  const OrderList = ({ orders }) => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-10">
          <Calendar className="h-12 w-12 mx-auto text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No orders found</h3>
          <p className="text-gray-500">No orders match your current filter criteria.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">File</th>
              <th className="py-3 px-4 text-left">Student</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{order.id.substring(0, 8)}</td>
                <td className="py-3 px-4">{formatDate(order.created_at)}</td>
                <td className="py-3 px-4">{order.file_name || 'Unnamed file'}</td>
                <td className="py-3 px-4">{order.profiles ? order.profiles.name : 'Unknown'}</td>
                <td className="py-3 px-4">{order.paper_size || 'Standard'}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className="ml-2">{order.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading orders history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Order History</h2>
      </div>
      
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by order number, filename or student..."
          className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Tabs defaultValue="all">
          <div className="px-4 pt-4">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="ready">Ready</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="pt-4">
            <OrderList orders={filterOrders('all', searchTerm)} />
          </TabsContent>
          
          <TabsContent value="processing" className="pt-4">
            <OrderList orders={filterOrders('processing', searchTerm)} />
          </TabsContent>
          
          <TabsContent value="ready" className="pt-4">
            <OrderList orders={filterOrders('ready', searchTerm)} />
          </TabsContent>
          
          <TabsContent value="completed" className="pt-4">
            <OrderList orders={filterOrders('completed', searchTerm)} />
          </TabsContent>
          
          <TabsContent value="delivered" className="pt-4">
            <OrderList orders={filterOrders('delivered', searchTerm)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default History;
