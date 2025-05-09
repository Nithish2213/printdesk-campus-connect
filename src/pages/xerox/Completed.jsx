
import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { CheckCircle, FilePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const Completed = () => {
  const { orders = [] } = usePrint();
  
  // Get only completed and delivered orders
  const completedOrders = orders
    ? orders
        .filter(order => order.status === 'Completed' || order.status === 'Delivered')
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
    : [];

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
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <CardTitle className="text-sm font-medium text-gray-600">Completed Today</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCompletedToday}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-indigo-500 mr-2" />
              <CardTitle className="text-sm font-medium text-gray-600">Delivered Today</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalDeliveredToday}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <FilePlus className="h-5 w-5 text-primary mr-2" />
              <CardTitle className="text-sm font-medium text-gray-600">Pages Printed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPagesToday}</p>
          </CardContent>
        </Card>
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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date Completed</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{new Date(order.dateCreated).toLocaleString('en-US', { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}</TableCell>
                  <TableCell className="max-w-xs truncate">{order.fileName}</TableCell>
                  <TableCell>{order.studentName}</TableCell>
                  <TableCell>{order.copies}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'Delivered' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default Completed;
