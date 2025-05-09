
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Minus, 
  Save, 
  Package, 
  AlertTriangle, 
  Loader2,
  Check 
} from 'lucide-react';
import { toast } from 'sonner';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 0,
    category: '',
  });

  useEffect(() => {
    fetchInventory();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('inventory-changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        }, 
        (payload) => {
          console.log('Inventory update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setInventory(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setInventory(prev => 
              prev.map(item => 
                item.id === payload.new.id ? payload.new : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setInventory(prev => 
              prev.filter(item => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) throw error;
      
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateQuantity = async (id, quantity) => {
    let newQuantity = quantity;
    if (newQuantity < 0) newQuantity = 0;
    
    try {
      const status = getStockStatus(newQuantity);
      
      const { data, error } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity, 
          status,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setInventory(prev => 
        prev.map(item => 
          item.id === id ? data : item
        )
      );
      
      toast.success(`Quantity updated`);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };
  
  const getStockStatus = (quantity) => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= 5) return 'Low Stock';
    if (quantity <= 20) return 'Limited Stock';
    return 'In Stock';
  };
  
  const startEdit = (item) => {
    setEditingId(item.id);
    setNewItem({
      name: item.name,
      category: item.category,
      quantity: item.quantity
    });
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setNewItem({
      name: '',
      quantity: 0,
      category: '',
    });
  };
  
  const handleSaveEdit = async (id) => {
    try {
      if (!newItem.name || !newItem.category) {
        toast.error('Name and category are required');
        return;
      }
      
      const status = getStockStatus(newItem.quantity);
      
      const { data, error } = await supabase
        .from('inventory')
        .update({ 
          name: newItem.name,
          category: newItem.category,
          quantity: newItem.quantity,
          status,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setInventory(prev => 
        prev.map(item => 
          item.id === id ? data : item
        )
      );
      
      setEditingId(null);
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };
  
  const handleAddItem = async () => {
    try {
      if (!newItem.name || !newItem.category) {
        toast.error('Name and category are required');
        return;
      }
      
      const status = getStockStatus(newItem.quantity);
      
      const { data, error } = await supabase
        .from('inventory')
        .insert({ 
          name: newItem.name,
          category: newItem.category,
          quantity: newItem.quantity,
          status
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setIsAdding(false);
      setNewItem({
        name: '',
        quantity: 0,
        category: '',
      });
      
      toast.success('New item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
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
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="px-3 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add New Item
        </button>
      </div>
      
      {isAdding && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Add New Inventory Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                placeholder="Item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="">Select Category</option>
                <option value="Paper">Paper</option>
                <option value="Ink">Ink</option>
                <option value="Toner">Toner</option>
                <option value="Supplies">Supplies</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <div className="flex items-center">
                <button 
                  type="button"
                  onClick={() => setNewItem({...newItem, quantity: Math.max(0, newItem.quantity - 1)})}
                  className="p-2 border rounded-l-md bg-gray-100 hover:bg-gray-200"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: Math.max(0, parseInt(e.target.value) || 0)})}
                  min="0"
                  className="w-full p-2 border-y focus:ring-primary focus:border-primary text-center"
                />
                <button 
                  type="button"
                  onClick={() => setNewItem({...newItem, quantity: newItem.quantity + 1})}
                  className="p-2 border rounded-r-md bg-gray-100 hover:bg-gray-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Loading inventory...</p>
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <Package className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium mt-4">No inventory items</h3>
          <p className="text-gray-500 mt-2">Start by adding your first inventory item.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                          className="w-full p-1 border rounded-md focus:ring-primary focus:border-primary"
                        />
                      ) : (
                        <div className="font-medium text-gray-900">{item.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === item.id ? (
                        <select
                          value={newItem.category}
                          onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                          className="w-full p-1 border rounded-md focus:ring-primary focus:border-primary"
                        >
                          <option value="Paper">Paper</option>
                          <option value="Ink">Ink</option>
                          <option value="Toner">Toner</option>
                          <option value="Supplies">Supplies</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <div className="text-gray-700">{item.category}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === item.id ? (
                        <div className="flex items-center">
                          <button 
                            type="button"
                            onClick={() => setNewItem({...newItem, quantity: Math.max(0, newItem.quantity - 1)})}
                            className="p-1 border rounded-l-md bg-gray-100 hover:bg-gray-200"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({...newItem, quantity: Math.max(0, parseInt(e.target.value) || 0)})}
                            min="0"
                            className="w-20 p-1 border-y focus:ring-primary focus:border-primary text-center"
                          />
                          <button 
                            type="button"
                            onClick={() => setNewItem({...newItem, quantity: newItem.quantity + 1})}
                            className="p-1 border rounded-r-md bg-gray-100 hover:bg-gray-200"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 border rounded-l-md bg-gray-100 hover:bg-gray-200"
                            disabled={item.quantity <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <div className="w-12 p-1 border-y text-center">
                            {item.quantity}
                          </div>
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 border rounded-r-md bg-gray-100 hover:bg-gray-200"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status === 'Low Stock' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {item.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {editingId === item.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
