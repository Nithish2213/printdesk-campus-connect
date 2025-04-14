
import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { Printer, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

const Orders = () => {
  const { orders, updateOrderStatus } = usePrint();
  
  // Get paid orders sorted by date (newest first)
  const paidOrders = orders
    .filter(order => order.paid && order.status !== 'Completed' && order.status !== 'Delivered')
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

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
          <title>Print Order #${order.orderNumber}</title>
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
            <h1>PrintHub - Order #${order.orderNumber}</h1>
            <p>Date: ${new Date(order.dateCreated).toLocaleString()}</p>
          </div>
          
          <div class="file-info">
            <p><strong>File:</strong> ${order.fileName}</p>
          </div>
          
          <div class="details">
            <h2>Print Details</h2>
            <table>
              <tr>
                <th>Print Type</th>
                <td>${order.printType}</td>
              </tr>
              <tr>
                <th>Copies</th>
                <td>${order.copies}</td>
              </tr>
              <tr>
                <th>Color</th>
                <td>${order.isColorPrint ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <th>Double-sided</th>
                <td>${order.isDoubleSided ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <th>Student</th>
                <td>${order.studentName} (${order.studentEmail})</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>${order.status}</td>
              </tr>
            </table>
          </div>
          
          ${order.message ? `
            <div class="message">
              <h2>Customer Message</h2>
              <p>${order.message}</p>
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
    toast.success(`Order status updated to ${newStatus}`);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paidOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-3 rounded-full mr-4">
                      <Printer className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium">{order.fileName}</h3>
                      <p className="text-sm text-gray-500">
                        {order.fileSize < 1024 
                          ? `${order.fileSize} bytes` 
                          : order.fileSize < 1048576 
                            ? `${(order.fileSize / 1024).toFixed(1)} KB` 
                            : `${(order.fileSize / 1048576).toFixed(1)} MB`
                        } • {new Date(order.dateCreated).toLocaleString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {order.orderNumber && (
                    <div className="bg-gray-100 px-3 py-2 rounded-md">
                      <span className="text-xs font-medium">ORDER #{order.orderNumber}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Print Details</h4>
                    <ul className="text-sm space-y-1">
                      <li><span className="text-gray-600">Type:</span> {order.printType}</li>
                      <li><span className="text-gray-600">Copies:</span> {order.copies}</li>
                      <li><span className="text-gray-600">Color:</span> {order.isColorPrint ? 'Yes' : 'No'}</li>
                      <li><span className="text-gray-600">Double-sided:</span> {order.isDoubleSided ? 'Yes' : 'No'}</li>
                      <li><span className="text-gray-600">Student:</span> {order.studentName}</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                    <div className="flex items-center gap-1 text-blue-600">
                      <span className="font-medium">{order.status}</span>
                    </div>
                    
                    {order.progress < 100 && order.progress > 0 && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${order.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.progress}% complete
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {order.message && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
                    <h4 className="font-medium mb-1">Message:</h4>
                    <p className="text-gray-600">{order.message}</p>
                  </div>
                )}
                
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <button 
                    onClick={() => handlePrint(order)}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Document
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                      Update Status <ChevronDown className="h-4 w-4 ml-2" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "Processing")}>
                        Processing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "Ready for Pickup")}>
                        Ready for Pickup
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "Completed")}>
                        Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "Delivered")}>
                        Delivered
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
