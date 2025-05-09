
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Loader2, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const InventoryStatus = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchInventory();
    
    // Set up realtime subscription for inventory changes
    const inventorySubscription = supabase
      .channel('inventory-status-updates')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        }, 
        (payload) => {
          console.log('Inventory update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setInventory(prev => [payload.new, ...prev]);
            
            // Check if new item has low stock
            if (payload.new.quantity <= 5) {
              const newAlert = {
                id: Date.now(),
                type: 'low-stock',
                item: payload.new.name,
                quantity: payload.new.quantity,
                timestamp: new Date().toISOString()
              };
              setAlerts(prev => [newAlert, ...prev]);
              toast.warning(`Low inventory alert: ${payload.new.name} is running low (${payload.new.quantity} remaining)`);
            }
          } else if (payload.eventType === 'UPDATE') {
            setInventory(prev => 
              prev.map(item => 
                item.id === payload.new.id ? payload.new : item
              )
            );
            
            // Check if updated item now has low stock
            if (payload.new.quantity <= 5 && (payload.old.quantity > 5 || payload.old.quantity !== payload.new.quantity)) {
              const newAlert = {
                id: Date.now(),
                type: 'low-stock',
                item: payload.new.name,
                quantity: payload.new.quantity,
                timestamp: new Date().toISOString()
              };
              setAlerts(prev => [newAlert, ...prev]);
              toast.warning(`Low inventory alert: ${payload.new.name} is running low (${payload.new.quantity} remaining)`);
            }
            
            // Check if item was out of stock but now has stock
            if (payload.old.quantity === 0 && payload.new.quantity > 0) {
              const newAlert = {
                id: Date.now(),
                type: 'restocked',
                item: payload.new.name,
                quantity: payload.new.quantity,
                timestamp: new Date().toISOString()
              };
              setAlerts(prev => [newAlert, ...prev]);
              toast.success(`${payload.new.name} has been restocked (${payload.new.quantity} units)`);
            }
          } else if (payload.eventType === 'DELETE') {
            setInventory(prev => 
              prev.filter(item => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(inventorySubscription);
    };
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) throw error;
      
      setInventory(data || []);
      
      // Generate initial alerts for low stock items
      const lowStockItems = data?.filter(item => item.quantity <= 5) || [];
      if (lowStockItems.length > 0) {
        const newAlerts = lowStockItems.map(item => ({
          id: Date.now() + item.id,
          type: 'low-stock',
          item: item.name,
          quantity: item.quantity,
          timestamp: new Date().toISOString()
        }));
        setAlerts(newAlerts);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Out of Stock':
        return 'text-red-600 bg-red-100';
      case 'Low Stock':
        return 'text-amber-600 bg-amber-100';
      case 'Limited Stock':
        return 'text-blue-600 bg-blue-100';
      case 'In Stock':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  // Get counts for dashboard
  const lowStockCount = inventory.filter(item => item.quantity <= 5).length;
  const outOfStockCount = inventory.filter(item => item.quantity === 0).length;
  const totalItems = inventory.length;
  const healthyStockCount = totalItems - lowStockCount - outOfStockCount;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Inventory Status</h2>
      
      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Loading inventory status...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Items</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Healthy Stock</p>
                  <p className="text-2xl font-bold text-green-600">{healthyStockCount}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <div className="h-6 w-6 text-green-600 flex items-center justify-center">✓</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Low Stock</p>
                  <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h3 className="font-medium">Current Inventory</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 text-left">Item</th>
                        <th className="px-6 py-3 text-left">Category</th>
                        <th className="px-6 py-3 text-center">Quantity</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {inventory.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No inventory items found
                          </td>
                        </tr>
                      ) : (
                        inventory.map(item => (
                          <tr key={item.id}>
                            <td className="px-6 py-3 font-medium">{item.name}</td>
                            <td className="px-6 py-3 text-gray-600">{item.category}</td>
                            <td className="px-6 py-3 text-center">{item.quantity}</td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {item.status === 'Low Stock' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-gray-600">{formatDate(item.last_updated)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-lg shadow-sm border h-full">
                <div className="px-6 py-4 border-b">
                  <h3 className="font-medium">Inventory Alerts</h3>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <div className="bg-gray-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <p>No alerts at this time</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {alerts.map(alert => (
                        <div key={alert.id} className="p-4">
                          <div className="flex items-start">
                            {alert.type === 'low-stock' ? (
                              <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                            ) : (
                              <Package className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                            )}
                            
                            <div>
                              <p className="font-medium">
                                {alert.type === 'low-stock' ? 'Low Stock Alert' : 'Item Restocked'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {alert.type === 'low-stock' 
                                  ? `${alert.item} is running low (${alert.quantity} remaining)` 
                                  : `${alert.item} has been restocked (${alert.quantity} units)`}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatDate(alert.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryStatus;
