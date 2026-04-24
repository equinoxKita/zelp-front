import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export default function AdminStats() {
  const showToast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/admin/stats')
      .then(d => {
        // API returns { stats: { totalUsers, activeServers, totalRevenue, ... } }
        // Normalize into the flat shape AdminStats expects
        const s = d.stats || d;
        setStats({
          total_revenue: s.totalRevenue ?? s.total_revenue ?? 0,
          active_subscriptions: s.activeServers ?? s.active_subscriptions ?? 0,
          active_subscriptions_today: s.active_subscriptions_today ?? 0,
          total_users: s.totalUsers ?? s.total_users ?? 0,
          new_users_today: s.new_users_today ?? 0,
          pending_orders: s.pendingOrders ?? s.pending_orders ?? 0,
          pending_orders_today: s.pending_orders_today ?? 0,
          recent_orders: s.recent_orders ?? [],
          plans: s.plans ?? {},
          // Monthly revenue — fallback to 0 if not returned by this endpoint
          ...['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
            .reduce((acc, m) => ({ ...acc, [`revenue_${m}`]: s[`revenue_${m}`] ?? 0 }), {}),
        });
      })
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  const revenueData = [
    { name: 'Jan', value: stats.revenue_jan || 0 },
    { name: 'Feb', value: stats.revenue_feb || 0 },
    { name: 'Mar', value: stats.revenue_mar || 0 },
    { name: 'Apr', value: stats.revenue_apr || 0 },
    { name: 'May', value: stats.revenue_may || 0 },
    { name: 'Jun', value: stats.revenue_jun || 0 },
    { name: 'Jul', value: stats.revenue_jul || 0 },
    { name: 'Aug', value: stats.revenue_aug || 0 },
    { name: 'Sep', value: stats.revenue_sep || 0 },
    { name: 'Oct', value: stats.revenue_oct || 0 },
    { name: 'Nov', value: stats.revenue_nov || 0 },
    { name: 'Dec', value: stats.revenue_dec || 0 },
  ];

  const planData = Object.entries(stats.plans || {}).map(([name, count]) => ({ name, value: count }));

  const statusColors = {
    active: '#10b981',
    expired: '#ef4444',
    suspended: '#f59e0b',
    pending: '#3b82f6',
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-text-muted uppercase font-bold">Total Revenue</div>
              <div className="text-3xl font-black text-text-primary">Rp{stats.total_revenue?.toLocaleString('id-ID')}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">$</div>
          </div>
          <div className="text-xs text-text-muted">All time</div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-text-muted uppercase font-bold">Active Subscriptions</div>
              <div className="text-3xl font-black text-text-primary">{stats.active_subscriptions}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">✓</div>
          </div>
          <div className="text-xs text-text-muted">{stats.active_subscriptions_today} today</div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-text-muted uppercase font-bold">Total Users</div>
              <div className="text-3xl font-black text-text-primary">{stats.total_users}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center">👤</div>
          </div>
          <div className="text-xs text-text-muted">{stats.new_users_today} new today</div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-text-muted uppercase font-bold">Pending Orders</div>
              <div className="text-3xl font-black text-text-primary">{stats.pending_orders}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center">⏳</div>
          </div>
          <div className="text-xs text-text-muted">{stats.pending_orders_today} today</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <div className="px-6 py-5 border-b border-white/5">
            <h3 className="font-black text-text-primary">Revenue Trend</h3>
            <p className="text-xs text-text-muted">Monthly revenue over the last 12 months</p>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" />
                <YAxis stroke="rgba(255,255,255,0.2)" tickFormatter={(value) => `Rp${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value) => `Rp${value}`}
                />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="card">
          <div className="px-6 py-5 border-b border-white/5">
            <h3 className="font-black text-text-primary">Plan Distribution</h3>
            <p className="text-xs text-text-muted">Current active subscriptions by plan</p>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" />
                <YAxis stroke="rgba(255,255,255,0.2)" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="px-6 py-5 border-b border-white/5">
          <h3 className="font-black text-text-primary">Recent Orders</h3>
          <p className="text-xs text-text-muted">Latest orders with status</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-xs font-black text-text-muted uppercase">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-black text-text-muted uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-black text-text-muted uppercase">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-black text-text-muted uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-black text-text-muted uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders?.map(order => (
                <tr key={order.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-mono text-sm">#{order.id}</td>
                  <td className="px-6 py-4 font-bold text-text-primary">{order.user_name}</td>
                  <td className="px-6 py-4 text-sm">{order.plan_name}</td>
                  <td className="px-6 py-4">
                    <span className={`badge text-xs font-black uppercase ${order.status === 'active' ? 'badge-success' :
                        order.status === 'expired' ? 'badge-danger' :
                          order.status === 'suspended' ? 'badge-warning' :
                            'badge-info'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-text-primary">Rp{order.amount?.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}