
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import OrderCard from '../../components/OrderCard';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Track = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('payment_status', 'paid')
          .not('status', 'in', ['Completed', 'Delivered'])
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load your orders. Please try again.');
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${currentUser.id}`
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.payment_status === 'paid' && 
              !['Completed', 'Delivered'].includes(payload.new.status)) {
            setOrders(prev => [payload.new, ...prev]);
            toast.success('New order received!');
          } else if (payload.eventType === 'UPDATE') {
            if (['Completed', 'Delivered'].includes(payload.new.status)) {
              // Remove from active orders when completed
              setOrders(prev => prev.filter(order => order.id !== payload.new.id));
              toast.info(`Order #${payload.new.id.substring(0,8)} has been ${payload.new.status.toLowerCase()}`);
            } else if (payload.new.status !== payload.old.status) {
              // Update the order in the list and show notification
              setOrders(prev => 
                prev.map(order => 
                  order.id === payload.new.id ? payload.new : order
                )
              );
              toast.info(`Order #${payload.new.id.substring(0,8)} is now ${payload.new.status}`);
            } else {
              // Just update the order
              setOrders(prev => 
                prev.map(order => 
                  order.id === payload.new.id ? payload.new : order
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => 
              prev.filter(order => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Track Orders</h2>
      
      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mt-4">No active orders</h3>
          <p className="text-gray-500 mt-2">You don't have any orders being processed at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} showProgress={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Track;
