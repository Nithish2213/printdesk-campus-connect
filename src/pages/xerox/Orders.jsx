
import React, { useState, useEffect } from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { Printer, ChevronDown, Calendar, Clock, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

const Orders = () => {
  const { orders, serverActive } = usePrint();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paidOrders, setPaidOrders] = useState([]);
  
  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching orders:', error);
          return;
        }
        
        // For now, use both local orders and database orders
        // Later we can fully migrate to using only database orders
        setPaidOrders([
          ...data,
          ...orders.filter(order => order.paid && order.status !== 'Completed' && order.status !== 'Delivered')
        ]);
      } catch (error) {
        console.error('Error in orders fetch:', error);
      }
    };
    
    fetchOrders();
  }, [orders]);
  
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Try to update in Supabase first
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error updating order status in database:', error);
        // If order is not in database, update it in local state
        const updatedOrders = orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        );
        // We would update local state here if needed
      }
      
      toast.success(`Order status updated to ${newStatus}`);
      setSelectedOrder(null); // Close the order details view after updating
      
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
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Order #${order.orderNumber || order.id.substring(0,8)}</title>
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
            <h1>PrintHub - Order #${order.orderNumber || order.id.substring(0,8)}</h1>
            <p>Date: ${new Date(order.created_at || order.dateCreated).toLocaleString()}</p>
          </div>
          
          <div class="file-info">
            <p><strong>File:</strong> ${order.fileName || order.file_url}</p>
          </div>
          
          <div class="details">
            <h2>Print Details</h2>
            <table>
              <tr>
                <th>Print Type</th>
                <td>${order.printType || order.paper_size}</td>
              </tr>
              <tr>
                <th>Copies</th>
                <td>${order.copies}</td>
              </tr>
              <tr>
                <th>Color</th>
                <td>${order.isColorPrint || order.color ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <th>Double-sided</th>
                <td>${order.isDoubleSided ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <th>Student</th>
                <td>${order.studentName || order.user_id}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>${order.status}</td>
              </tr>
            </table>
          </div>
          
          ${order.message || order.notes ? `
            <div class="message">
              <h2>Customer Message</h2>
              <p>${order.message || order.notes}</p>
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
    if (order.fileName) return order.fileName;
    if (order.file_url) {
      const urlParts = order.file_url.split('/');
      return urlParts[urlParts.length - 1];
    }
    return 'Unknown file';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Print Orders</h2>
      </div>
      
      {paidOrders.length === 0 ? (
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
                    <p className="text-gray-500">Order #{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  {formatDate(selectedOrder.dateCreated || selectedOrder.created_at)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-medium mb-3 text-gray-700">Print Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-y-3">
                      <div className="text-gray-600">Type:</div>
                      <div>{selectedOrder.printType || selectedOrder.paper_size}</div>
                      
                      <div className="text-gray-600">Copies:</div>
                      <div>{selectedOrder.copies}</div>
                      
                      <div className="text-gray-600">Color:</div>
                      <div>{selectedOrder.isColorPrint || selectedOrder.color ? 'Yes' : 'No'}</div>
                      
                      <div className="text-gray-600">Double-sided:</div>
                      <div>{selectedOrder.isDoubleSided ? 'Yes' : 'No'}</div>
                      
                      <div className="text-gray-600">File size:</div>
                      <div>{selectedOrder.fileSize ? formatFileSize(selectedOrder.fileSize) : 'N/A'}</div>
                      
                      <div className="text-gray-600">Student:</div>
                      <div>{selectedOrder.studentName || selectedOrder.user_id}</div>
                    </div>
                  </div>
                  
                  {(selectedOrder.message || selectedOrder.notes) && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-gray-700">Message</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-600">{selectedOrder.message || selectedOrder.notes}</p>
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
                    
                    {selectedOrder.progress && selectedOrder.progress < 100 && selectedOrder.progress > 0 && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${selectedOrder.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedOrder.progress}% complete
                        </div>
                      </div>
                    )}
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
              {paidOrders.map((order) => (
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
                        #{order.orderNumber || order.id.substring(0, 8)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="truncate">{order.studentName || order.user_id} • {order.printType || order.paper_size} • {order.copies} {order.copies > 1 ? 'copies' : 'copy'}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end">
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(order.dateCreated || order.created_at)}
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
