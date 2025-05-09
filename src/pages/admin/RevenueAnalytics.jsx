
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, ArrowUpCircle, ArrowDownCircle, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { usePrint } from '../../contexts/PrintContext';

const RevenueAnalytics = () => {
  const { orders, revenue } = usePrint();
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('week');
  const [filteredRevenue, setFilteredRevenue] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProfit: 0,
    avgOrderValue: 0
  });

  useEffect(() => {
    if (revenue && revenue.length > 0) {
      filterRevenueData();
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [revenue, timeFrame]);

  const filterRevenueData = () => {
    if (!revenue || revenue.length === 0) {
      setFilteredRevenue([]);
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        totalProfit: 0,
        avgOrderValue: 0
      });
      return;
    }

    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeFrame) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 7);
    }
    
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const filtered = revenue.filter(item => {
      const itemDate = new Date(item.date);
      const itemDateStr = item.date;
      return itemDateStr >= cutoffDateStr;
    });
    
    setFilteredRevenue(filtered);
    
    // Calculate stats from filtered data
    const totalRevenue = filtered.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = filtered.reduce((sum, item) => sum + item.orders, 0);
    const totalProfit = filtered.reduce((sum, item) => sum + item.profit, 0);
    
    setStats({
      totalRevenue,
      totalOrders,
      totalProfit,
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Revenue Analytics</h2>
      
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
          <h3 className="font-medium">Time Frame</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeFrame('week')}
              className={`px-3 py-1 rounded ${timeFrame === 'week' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeFrame('month')}
              className={`px-3 py-1 rounded ${timeFrame === 'month' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeFrame('quarter')}
              className={`px-3 py-1 rounded ${timeFrame === 'quarter' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            >
              Quarter
            </button>
            <button
              onClick={() => setTimeFrame('year')}
              className={`px-3 py-1 rounded ${timeFrame === 'year' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            >
              Year
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Loading revenue data...</p>
        </div>
      ) : filteredRevenue.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No Revenue Data</h3>
          <p className="text-gray-500 mt-2">There is no revenue data available for the selected time frame.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow-sm rounded-lg border p-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg border p-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Profit</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalProfit)}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg border p-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg border p-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Avg Order Value</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.avgOrderValue)}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <ArrowUpCircle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-5">
              <h3 className="font-medium mb-4">Revenue Over Time</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']} 
                      labelFormatter={formatDate}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-5">
              <h3 className="font-medium mb-4">Orders by Day</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'Orders']} 
                      labelFormatter={formatDate}
                    />
                    <Legend />
                    <Bar dataKey="orders" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-medium">Detailed Revenue Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-right">Orders</th>
                    <th className="px-6 py-3 text-right">Revenue</th>
                    <th className="px-6 py-3 text-right">Expenses</th>
                    <th className="px-6 py-3 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRevenue.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.orders}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(item.expenses)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        {formatCurrency(item.profit)}
                      </td>
                    </tr>
                  ))}
                  {filteredRevenue.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No revenue data available for selected timeframe
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueAnalytics;
