
import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';

const RevenueAnalytics = () => {
  const { revenue = [] } = usePrint();
  
  // Sample revenue data if none exists
  const revenueData = revenue && revenue.length > 0 ? revenue : [
    { date: '2025-05-01', orders: 15, revenue: 3000, expenses: 1200, profit: 1800 },
    { date: '2025-05-02', orders: 18, revenue: 3600, expenses: 1400, profit: 2200 },
    { date: '2025-05-03', orders: 12, revenue: 2400, expenses: 1000, profit: 1400 },
    { date: '2025-05-04', orders: 22, revenue: 4400, expenses: 1800, profit: 2600 },
    { date: '2025-05-05', orders: 20, revenue: 4000, expenses: 1600, profit: 2400 },
  ];
  
  // Calculate totals safely with the fallback data
  const totals = revenueData.reduce(
    (acc, item) => {
      return {
        orders: acc.orders + item.orders,
        revenue: acc.revenue + item.revenue,
        expenses: acc.expenses + item.expenses,
        profit: acc.profit + item.profit
      };
    },
    { orders: 0, revenue: 0, expenses: 0, profit: 0 }
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Revenue Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totals.orders}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{totals.revenue}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{totals.expenses}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{totals.profit}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="h-80 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [`₹${value}`, name]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#6366f1" name="Revenue" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            <Bar dataKey="profit" fill="#10b981" name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {revenueData.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {item.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {item.orders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  ₹{item.revenue}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  ₹{item.expenses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  ₹{item.profit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
