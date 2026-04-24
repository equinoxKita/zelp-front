import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Wallet, ShoppingBag, Settings, Server, FileText, CreditCard, ArrowRight, Megaphone, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatNumber, formatDate, getInitials, escapeHtml } from '../utils/helpers';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders'),
      api.get('/invoices'),
      api.get('/announcements')
    ])
      .then(([ordersData, invoicesData, announcementsData]) => {
        setOrders(ordersData.orders || []);
        setInvoices(invoicesData.invoices || []);
        setAnnouncements(announcementsData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeServers = orders.filter((o) => o.status === 'active').length;
  const recentPayments = [...invoices]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-in">
      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Pemberitahuan</h3>
            {announcements.length > 1 && (
              <span className="text-[10px] text-accent-primary font-bold">{announcements.length} Berita</span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {announcements.map((ann) => {
              const Icon = ann.type === 'danger' ? AlertTriangle : 
                          ann.type === 'warning' ? Info :
                          ann.type === 'success' ? CheckCircle2 : Megaphone;
              const colorClass = ann.type === 'danger' ? 'text-danger border-danger/20 bg-danger/5' :
                                ann.type === 'warning' ? 'text-warning border-warning/20 bg-warning/5' :
                                ann.type === 'success' ? 'text-success border-success/20 bg-success/5' :
                                'text-accent-primary border-accent-primary/20 bg-accent-primary/5';
              
              return (
                <div key={ann.id} className={`p-4 rounded-2xl border flex gap-4 items-start relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${colorClass} ${ann.is_pinned ? 'ring-1 ring-accent-primary/20' : ''}`}>
                  {ann.is_pinned && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-accent-primary text-white text-[9px] font-black uppercase rounded-bl-xl shadow-lg">
                      Pinned
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-current/20 bg-white/10`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-text-primary mb-1">{ann.title}</h4>
                    <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    <div className="mt-2 text-[9px] font-bold text-text-muted/60 flex items-center gap-2">
                       <span>{new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                       <span>•</span>
                       <span>ZelpStore Staff</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="glass-card p-6 lg:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-accent-primary/20 transition-all duration-700" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 justify-between relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 min-w-[64px] rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-2xl font-black shadow-glow group-hover:scale-105 transition-all duration-500">
              {getInitials(user?.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-primary/80">Active Session</span>
              </div>
              <h2 className="text-xl lg:text-3xl font-black text-text-primary leading-tight">
                Halo, <span className="gradient-text">{user?.name?.split(' ')[0] || 'User'}</span>
                <span className="inline-block ml-2 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter align-middle" 
                      style={{ backgroundColor: `${user?.tier?.color || '#cd7f32'}20`, color: user?.tier?.color || '#cd7f32', border: `1px solid ${user?.tier?.color || '#cd7f32'}30` }}>
                  {user?.tier?.name || 'Bronze'}
                </span>
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-text-muted font-black uppercase tracking-widest">Saldo</span>
                  <span className="text-base font-black text-text-primary">Rp {formatNumber(user?.balance)}</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-text-muted font-black uppercase tracking-widest">Nodes</span>
                  <span className="text-base font-black text-success">{activeServers} Unit</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={() => navigate('/deposit')}
              className="flex-1 lg:flex-none btn btn-primary px-6 py-3.5 rounded-2xl shadow-glow"
            >
              <Wallet size={18} /> <span>Top Up</span>
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="btn btn-secondary w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Discord Community */}
      <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
        <div>
          <h3 className="text-base font-black text-text-primary flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03z"/></svg>
            ZelpStore Community
          </h3>
          <p className="text-text-muted text-sm">Dapatkan support eksklusif, info promo terbaru, dan bergabunglah dengan ribuan member lainnya.</p>
        </div>
        <a
          href="https://discord.com/invite/eaYYwJQgBb"
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-[#5865F2] text-white hover:bg-[#4752C4] border-0 px-6 py-2.5 rounded-xl font-bold flex-shrink-0"
        >
          Join Discord
        </a>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] px-1">Layanan Utama</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[
            { to: '/deposit', icon: Wallet, label: 'Isi Saldo', desc: 'Top up wallet', color: 'text-success', bg: 'bg-success/5' },
            { href: 'https://zelpstore.com/pricing', icon: ShoppingBag, label: 'Sewa Server', desc: 'Beli instance baru', color: 'text-accent-tertiary', bg: 'bg-accent-tertiary/5' },
            { to: '/subscriptions', icon: Server, label: 'Layanan Saya', desc: 'Kelola server aktif', color: 'text-accent-secondary', bg: 'bg-accent-secondary/5' },
            { to: '/transactions', icon: FileText, label: 'Pembayaran', desc: 'Riwayat invoice', color: 'text-danger', bg: 'bg-danger/5' },
          ].map((action, i) => {
            const Icon = action.icon;
            const content = (
              <div className="flex flex-col gap-3">
                <div className={`w-12 h-12 rounded-2xl ${action.bg} ${action.color} border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-primary mb-0.5">{action.label}</h3>
                  <p className="text-[10px] text-text-muted font-medium">{action.desc}</p>
                </div>
              </div>
            );
            const classes = "card p-5 lg:p-6 group hover-glow cursor-pointer animate-slide-up bg-gradient-to-br from-bg-card to-white/[0.02]";
            const style = { animationDelay: `${i * 100}ms` };

            if (action.href) {
              return (
                <a key={action.label} href={action.href} target="_blank" rel="noopener noreferrer"
                  className={classes} style={style}>
                  {content}
                </a>
              );
            }
            return (
              <button key={action.label} onClick={() => navigate(action.to)}
                className={classes} style={style}>
                {content}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Latest Activity */}
        <div className="card p-4 sm:p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-black text-text-primary">Latest Activity</h3>
              <p className="text-[10px] text-text-muted mt-0.5">Pantau pengeluaran & deposit</p>
            </div>
            <button 
              onClick={() => navigate('/transactions')} 
              className="text-[10px] text-accent-tertiary font-black flex items-center gap-1 hover:underline w-fit"
            >
              Global Log <ArrowRight size={12} />
            </button>
          </div>
          {/* Mobile List View (< sm) */}
          <div className="sm:hidden space-y-3">
            {recentPayments.length === 0 ? (
              <div className="text-center py-6 text-text-muted italic text-xs">No activity yet</div>
            ) : recentPayments.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <div className="font-black text-xs text-text-primary">#INV-{inv.id}</div>
                  <div className="text-[10px] text-text-muted">{formatDate(inv.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xs text-text-primary">Rp {formatNumber(inv.amount)}</div>
                  <span className={`font-black text-[9px] uppercase ${inv.status === 'paid' ? 'text-success' : 'text-danger'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto scrollbar-hide">
            <table className="data-table w-full">
              <thead>
                <tr><th>Reference</th><th>Amount</th><th>Date</th><th className="text-right">Status</th></tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-text-muted italic">No activity yet</td></tr>
                ) : recentPayments.map((inv) => (
                  <tr key={inv.id}>
                    <td><div className="font-bold text-xs text-text-primary">#INV-{inv.id}</div></td>
                    <td><div className="font-black text-xs text-text-primary">Rp {formatNumber(inv.amount)}</div></td>
                    <td className="text-[10px] text-text-muted">{formatDate(inv.created_at)}</td>
                    <td className="text-right">
                      <span className={`font-black text-[10px] uppercase ${inv.status === 'paid' ? 'text-success' : 'text-danger'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Life */}
        <div className="card p-4 sm:p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-black text-text-primary">Service Life</h3>
              <p className="text-[10px] text-text-muted mt-0.5">Masa aktif node Anda</p>
            </div>
            <button 
              onClick={() => navigate('/subscriptions')} 
              className="text-[10px] text-accent-tertiary font-black flex items-center gap-1 hover:underline w-fit"
            >
              Fleet View <ArrowRight size={12} />
            </button>
          </div>

          {/* Mobile List View (< sm) */}
          <div className="sm:hidden space-y-3">
            {orders.filter((o) => o.status === 'active').length === 0 ? (
              <div className="text-center py-6 text-text-muted italic text-xs">No active nodes</div>
            ) : orders.filter((o) => o.status === 'active').slice(0, 5).map((o) => {
              const days = Math.ceil((new Date(o.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={o.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <div className="font-black text-xs text-text-primary">{o.server_name}</div>
                    <div className="text-[10px] text-text-muted">{o.plan_name || 'Generic'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-primary font-black">{days} Days Left</div>
                    <div className="text-[9px] text-text-muted">{formatDate(o.expires_at).split(',')[0]}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto scrollbar-hide">
            <table className="data-table w-full">
              <thead>
                <tr><th>Instance</th><th>Expiration</th><th className="text-right">Status</th></tr>
              </thead>
              <tbody>
                {orders.filter((o) => o.status === 'active').length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-10 text-text-muted italic text-xs">No active nodes</td></tr>
                ) : orders.filter((o) => o.status === 'active').slice(0, 5).map((o) => {
                  const days = Math.ceil((new Date(o.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="font-bold text-xs text-text-primary">{o.server_name}</div>
                        <div className="text-[10px] text-text-muted">{o.plan_name || 'Generic'}</div>
                      </td>
                      <td className="text-[10px] text-text-muted">{formatDate(o.expires_at)}</td>
                      <td className="text-right">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${days <= 7 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                          {days} Days Left
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-pulse">
      <div className="bg-bg-card rounded-3xl h-40" />
      <div className="bg-bg-card rounded-2xl h-20" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-bg-card rounded-2xl h-28" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-bg-card rounded-2xl h-64" />
        <div className="bg-bg-card rounded-2xl h-64" />
      </div>
    </div>
  );
}
