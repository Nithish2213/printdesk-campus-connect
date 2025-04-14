
import React, { useState } from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { Calendar, CheckCircle, Clock, TruckDelivery, Search } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../../components/ui/tabs";

const History = () => {
  const { orders } = usePrint();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter orders based on status and search term
  const filterOrders = (status, searchTerm) => {
    return orders
      .filter(order => {
        const matchesStatus = status === 'all' || 
                             (status === 'processing' && order.status === 'Processing') ||
                             (status === 'ready' && order.status === 'Ready for Pickup') ||
                             (status === 'completed' && order.status === 'Completed') ||
                             (status === 'delivered' && order.status === 'Delivered');
        
        const matchesSearch = !searchTerm || 
                             order.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             order.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             order.orderNumber.toString().includes(searchTerm);
        
        return order.paid && matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  };

  const getStatusIcon = (status) => {
    if (status === 'Ready for Pickup') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'Processing') return <Clock className="h-5 w-5 text-blue-500" />;
    if (status === 'Completed') return <CheckCircle className="h-5 w-5 text-purple-500" />;
    if (status === 'Delivered') return <TruckDelivery className="h-5 w-5 text-indigo-500" />;
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
              <th className="py-3 px-4 text-left">Order #</th>
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
                <td className="py-3 px-4">{order.orderNumber}</td>
                <td className="py-3 px-4">{formatDate(order.dateCreated)}</td>
                <td className="py-3 px-4">{order.fileName}</td>
                <td className="py-3 px-4">{order.studentName}</td>
                <td className="py-3 px-4">{order.printType}</td>
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
