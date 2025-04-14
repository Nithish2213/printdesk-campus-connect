
import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { CheckCircle, FilePlus } from 'lucide-react';

const Completed = () => {
  const { orders } = usePrint();
  
  // Get only completed and delivered orders
  const completedOrders = orders
    .filter(order => order.status === 'Completed' || order.status === 'Delivered')
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  // Get today's completed orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = completedOrders.filter(order => 
    new Date(order.dateCreated) >= today
  );

  // Calculate statistics
  const totalCompletedToday = todayOrders.length;
  const totalDeliveredToday = todayOrders.filter(order => order.status === 'Delivered').length;
  
  // Calculate total pages printed (assuming each copy of a document counts as 1 page)
  const totalPagesToday = todayOrders.reduce((total, order) => total + order.copies, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Completed Orders</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-medium text-gray-600">Completed Today</h3>
          </div>
          <p className="text-3xl font-bold">{totalCompletedToday}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-indigo-500 mr-2" />
            <h3 className="font-medium text-gray-600">Delivered Today</h3>
          </div>
          <p className="text-3xl font-bold">{totalDeliveredToday}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <FilePlus className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-medium text-gray-600">Pages Printed</h3>
          </div>
          <p className="text-3xl font-bold">{totalPagesToday}</p>
        </div>
      </div>
      
      {completedOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium mt-4">No completed orders</h3>
          <p className="text-gray-500 mt-2">There are no completed orders to display.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left font-medium">Order #</th>
                <th className="py-3 px-4 text-left font-medium">Date Completed</th>
                <th className="py-3 px-4 text-left font-medium">File</th>
                <th className="py-3 px-4 text-left font-medium">Student</th>
                <th className="py-3 px-4 text-left font-medium">Copies</th>
                <th className="py-3 px-4 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{order.orderNumber}</td>
                  <td className="py-3 px-4">{new Date(order.dateCreated).toLocaleString('en-US', { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}</td>
                  <td className="py-3 px-4 max-w-xs truncate">{order.fileName}</td>
                  <td className="py-3 px-4">{order.studentName}</td>
                  <td className="py-3 px-4">{order.copies}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'Delivered' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Completed;
