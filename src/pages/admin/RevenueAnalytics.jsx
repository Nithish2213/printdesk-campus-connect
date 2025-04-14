
import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';

const RevenueAnalytics = () => {
  const { revenue } = usePrint();
  
  // Calculate totals
  const totals = revenue.reduce(
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
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500 text-sm mb-1">Total Orders</p>
          <p className="text-3xl font-bold">{totals.orders}</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">₹{totals.revenue}</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500 text-sm mb-1">Total Expenses</p>
          <p className="text-3xl font-bold">₹{totals.expenses}</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500 text-sm mb-1">Net Profit</p>
          <p className="text-3xl font-bold">₹{totals.profit}</p>
        </div>
      </div>
      
      <div className="h-80 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenue}>
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
            {revenue.map((item, index) => (
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
