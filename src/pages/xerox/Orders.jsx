
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Printer, ChevronDown, Calendar, Clock, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverActive, setServerActive] = useState(true);
  
  // Fetch orders and server status from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, profiles:user_id(*)')
          .eq('payment_status', 'paid')
          .not('status', 'in', ['Completed', 'Delivered'])
          .order('created_at', { ascending: false });
        
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
    
    fetchOrders();
    fetchServerStatus();
    
    // Set up realtime subscription for orders
    const ordersSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        }, 
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // For new orders, fetch the related profile data
            if (payload.new.payment_status === 'paid' && !['Completed', 'Delivered'].includes(payload.new.status)) {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', payload.new.user_id)
                .single();
                
              if (!error && profile) {
                setOrders(prev => [{...payload.new, profiles: profile}, ...prev]);
              } else {
                setOrders(prev => [payload.new, ...prev]);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update order in state
            if (['Completed', 'Delivered'].includes(payload.new.status)) {
              // Remove from active orders list when completed
              setOrders(prev => prev.filter(order => order.id !== payload.new.id));
              
              // If this is the selected order, clear selection
              if (selectedOrder && selectedOrder.id === payload.new.id) {
                setSelectedOrder(null);
              }
            } else {
              // Just update the order
              setOrders(prev => 
                prev.map(order => {
                  if (order.id === payload.new.id) {
                    return { ...payload.new, profiles: order.profiles };
                  }
                  return order;
                })
              );
              
              // Update selected order if it's the one being updated
              if (selectedOrder && selectedOrder.id === payload.new.id) {
                setSelectedOrder(prev => ({ ...payload.new, profiles: prev.profiles }));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => 
              prev.filter(order => order.id !== payload.old.id)
            );
            
            // Clear selection if the deleted order was selected
            if (selectedOrder && selectedOrder.id === payload.old.id) {
              setSelectedOrder(null);
            }
          }
        }
      )
      .subscribe();
      
    // Set up realtime subscription for server status
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
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(serverStatusSubscription);
    };
  }, []);
  
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Failed to update order status');
        return;
      }
      
      toast.success(`Order status updated to ${newStatus}`);
      
      // Update local state if needed
      if (['Completed', 'Delivered'].includes(newStatus)) {
        setSelectedOrder(null);
      }
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handlePrint = (order) => {
    // Open browser print dialog
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error("Pop-up blocked. Please allow pop-ups for this site.");
      return;
    }
    
    const studentName = order.profiles ? order.profiles.name : 'Unknown';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Order #${order.id.substring(0,8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            .file-info { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            table, th, td { border: 1px solid #ddd; }
            th, td { padding: 8px; text-align: left; }
            .footer { margin-top: 50px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PrintHub - Order #${order.id.substring(0,8)}</h1>
            <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
          </div>
          
          <div class="file-info">
            <p><strong>File:</strong> ${order.file_name || order.file_url}</p>
          </div>
          
          <div class="details">
            <h2>Print Details</h2>
            <table>
              <tr>
                <th>Print Type</th>
                <td>${order.paper_size}</td>
              </tr>
              <tr>
                <th>Copies</th>
                <td>${order.copies}</td>
              </tr>
              <tr>
                <th>Color</th>
                <td>${order.is_color_print ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <th>Double-sided</th>
                <td>${order.is_double_sided ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <th>Student</th>
                <td>${studentName}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>${order.status}</td>
              </tr>
              <tr>
                <th>OTP</th>
                <td><strong>${order.otp}</strong></td>
              </tr>
            </table>
          </div>
          
          ${order.notes ? `
            <div class="message">
              <h2>Customer Message</h2>
              <p>${order.notes}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>PrintHub - Campus Connect Printing Service</p>
          </div>
        </body>
      </html>
    `);
    
    // Print and close the window
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    toast.success("Print job sent to printer");
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  // Format file size to readable format
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  // Get file name from URL or use provided fileName
  const getFileName = (order) => {
    if (order.file_name) return order.file_name;
    if (order.file_url) {
      const urlParts = order.file_url.split('/');
      return urlParts[urlParts.length - 1];
    }
    return 'Unknown file';
  };

  const getStudentName = (order) => {
    return order.profiles ? order.profiles.name : 'Unknown student';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Print Orders</h2>
        <div className={`px-3 py-1 rounded-full text-sm ${serverActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Server Status: {serverActive ? 'Online' : 'Offline'}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mt-4">No print orders yet</h3>
          <p className="text-gray-500 mt-2">There are no orders to process at the moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {selectedOrder ? (
            <div className="p-6">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="flex items-center text-gray-600 mb-4 hover:text-gray-800"
              >
                <X className="h-4 w-4 mr-1" /> Close details
              </button>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-primary/10 p-4 rounded-full mr-4">
                    <Printer className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{getFileName(selectedOrder)}</h3>
                    <p className="text-gray-500">Order #{selectedOrder.id.substring(0, 8)}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  {formatDate(selectedOrder.created_at)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-medium mb-3 text-gray-700">Print Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-y-3">
                      <div className="text-gray-600">Type:</div>
                      <div>{selectedOrder.paper_size}</div>
                      
                      <div className="text-gray-600">Copies:</div>
                      <div>{selectedOrder.copies}</div>
                      
                      <div className="text-gray-600">Color:</div>
                      <div>{selectedOrder.is_color_print ? 'Yes' : 'No'}</div>
                      
                      <div className="text-gray-600">Double-sided:</div>
                      <div>{selectedOrder.is_double_sided ? 'Yes' : 'No'}</div>
                      
                      <div className="text-gray-600">Student:</div>
                      <div>{getStudentName(selectedOrder)}</div>
                      
                      <div className="text-gray-600">OTP:</div>
                      <div className="font-bold">{selectedOrder.otp || 'Not generated'}</div>
                    </div>
                  </div>
                  
                  {selectedOrder.notes && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-gray-700">Message</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-600">{selectedOrder.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-gray-700">Status</h4>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {selectedOrder.status.includes('Processing') ? (
                        <Clock className="h-5 w-5 text-blue-500" />
                      ) : selectedOrder.status.includes('Ready') ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-medium">{selectedOrder.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => handlePrint(selectedOrder)}
                      className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Document
                    </button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors w-full">
                        Update Status <ChevronDown className="h-4 w-4 ml-2" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(selectedOrder.id, "Processing")}>
                          Processing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(selectedOrder.id, "Ready for Pickup")}>
                          Ready for Pickup
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(selectedOrder.id, "Completed")}>
                          Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(selectedOrder.id, "Delivered")}>
                          Delivered
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="bg-gray-100 p-3 rounded-full mr-4">
                    <Printer className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{getFileName(order)}</h3>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded ml-2 whitespace-nowrap">
                        #{order.id.substring(0, 8)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="truncate">{getStudentName(order)} • {order.paper_size} • {order.copies} {order.copies > 1 ? 'copies' : 'copy'}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end">
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </div>
                    
                    <div className="flex items-center mt-1">
                      {order.status.includes('Processing') ? (
                        <Clock className="h-4 w-4 text-blue-500" />
                      ) : order.status.includes('Ready') ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-xs ml-1 whitespace-nowrap">{order.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
