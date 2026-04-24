import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Plus, CheckCircle, PauseCircle, Clock, XCircle, AlertCircle, ArrowRightCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { formatNumber, formatDate } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

const STATUS_CONFIG = {
  active: { color: '#10b981', label: 'Aktif', Icon: CheckCircle },
  suspended: { color: '#ef4444', label: 'Ditangguhkan', Icon: PauseCircle },
  pending: { color: '#f59e0b', label: 'Menunggu', Icon: Clock },
  paid: { color: '#f59e0b', label: 'Dibayar', Icon: CheckCircle },
  cancelled: { color: '#6b7280', label: 'Dibatalkan', Icon: XCircle },
};

const STATUS_PRIORITY = { active: 1, pending: 2, suspended: 3, cancelled: 4 };

const FILTERS = ['all', 'active', 'pending', 'suspended', 'cancelled'];

export default function Subscriptions() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders')
      .then((d) => setOrders(d.orders || []))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = (filter === 'all' ? orders : orders.filter((o) => o.status === filter))
    .sort((a, b) => {
      const pA = STATUS_PRIORITY[a.status] || 99;
      const pB = STATUS_PRIORITY[b.status] || 99;
      if (pA !== pB) return pA - pB;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const activeCount = orders.filter((o) => o.status === 'active').length;

  return (
    <div className="p-6 lg:p-8 animate-in space-y-6">
      {/* Hero Section */}
      <div className="glass-card relative overflow-hidden group border-none shadow-glow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-accent-primary/10" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 p-8 lg:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Server size={32} />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-text-primary tracking-tight">Active Fleet</h1>
                <p className="text-text-muted font-semibold text-sm mt-1">Status real-time infrastruktur cloud Anda</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 lg:gap-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Online Nodes</span>
                <span className="text-3xl font-black text-text-primary flex items-center gap-2">
                  {activeCount}
                  <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse mt-1" />
                </span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Involved Ptero</span>
                <span className="text-3xl font-black text-text-primary">{orders.length}</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            <a href="https://zelpstore.com/pricing" target="_blank" rel="noopener noreferrer"
              className="flex-1 lg:flex-none btn btn-primary px-8 py-4 rounded-2xl shadow-glow font-black group/btn">
              <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
              <span>Deploy Instance</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl border font-bold text-sm transition-all ${
              filter === f
                ? 'bg-white/10 border-white/20 text-text-primary'
                : 'bg-white/[0.02] border-white/5 text-text-muted hover:bg-white/5 hover:text-text-primary'
            }`}
          >
            {f === 'all' ? 'Semua Server' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Server List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-bg-card rounded-3xl h-52" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center rounded-3xl border-dashed border-2 border-white/5">
          <div className="text-white/10 mb-6"><Server size={64} className="mx-auto" /></div>
          <h3 className="text-xl font-black mb-3">Instance Kosong</h3>
          <p className="text-text-muted mb-8">Tidak ada server dengan status <strong>{filter}</strong>.</p>
          {filter === 'all' && (
            <a href="https://zelpstore.com/pricing" target="_blank" rel="noopener noreferrer" className="btn btn-primary px-8 py-3 rounded-xl font-black">
              Deploy Server Pertama
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => <ServerCard key={o.id} order={o} onNavigate={navigate} />)}
        </div>
      )}

      {/* Tutorial */}
      <div className="card p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute right-8 top-8 opacity-[0.03]"><Server size={200} /></div>
        <h2 className="text-xl font-black text-text-primary flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 text-accent-primary/70 flex items-center justify-center">
            📖
          </div>
          Cara Login ke Web Panel ZelpStore
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { n: 1, title: 'Masuk ke Akun', desc: 'Buka website ZelpStore dan login ke dashboard billing Anda.' },
            { n: 2, title: 'Menu My Server', desc: 'Di sidebar kiri, klik My Servers untuk melihat semua instance aktif Anda.' },
            { n: 3, title: 'Pilih Detail Server', desc: 'Temukan server Anda dan klik tombol Dashboard atau Buka Dashboard.' },
            { n: 4, title: 'Generate Password', desc: 'Cari tombol Pass di halaman informasi, klik dan pilih Confirm Generate.' },
            { n: 5, title: 'Salin Password', desc: 'Salin password baru yang muncul. Anda butuh password ini untuk login ke panel utama.' },
            { n: 6, title: 'Buka Web Panel', desc: (<>Buka <a href="https://panel.zelpstore.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-black">panel.zelpstore.com</a> dan login dengan email serta password tadi.</>), },
          ].map((step) => (
            <div key={step.n} className="flex gap-4">
              <div className="w-9 h-9 min-w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {step.n}
              </div>
              <div>
                <h4 className="text-text-primary font-black mb-1">{step.title}</h4>
                <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServerCard({ order: o, onNavigate }) {
  const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.active;
  const Icon = sc.Icon;
  const daysLeft = o.expires_at ? Math.ceil((new Date(o.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const expiring = daysLeft !== null && daysLeft <= 7;
  const expired = daysLeft !== null && daysLeft <= 0;

  return(
    <div className="glass-card overflow-hidden hover-glow bg-white/[0.01] animate-slide-up">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header Content */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" 
                 style={{ background: `${sc.color}10`, border: `1px solid ${sc.color}20`, color: sc.color }}>
              <Server size={30} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: sc.color }}>{sc.label}</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">ID #{o.id}</span>
              </div>
              <h3 className="text-xl font-black text-text-primary tracking-tight">{o.server_name || 'Virtual Instance'}</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="badge badge-info bg-white/5 border border-white/5 text-[10px] py-0.5">
                  {o.plan_name || 'Cloud Compute'}
                </div>
                <div className="text-[11px] text-text-muted font-bold">
                  {o.period_months || 1} bln Subscription
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:text-right flex lg:flex-col justify-between items-end lg:justify-center">
            <div className="text-2xl font-black text-text-primary">
              Rp {formatNumber(o.total_price)}
            </div>
            <div className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-0.5">Renew Monthly</div>
          </div>
        </div>

        {/* Resource Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'Core CPU', color: '#10b981', val: '100%', w: '100%' },
            { label: 'Compute RAM', color: '#3b82f6', val: '1 GB', w: '100%' },
            { label: 'SSD NVMe', color: '#f59e0b', val: '5 GB', w: '100%' },
          ].map((r) => (
            <div key={r.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group/res">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-tight">{r.label}</span>
                <span className="text-[10px] font-black" style={{ color: r.color }}>{r.val}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 group-hover:opacity-80" 
                     style={{ background: r.color, width: r.w }} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate(`/service/${o.id}`)}
              className="flex-1 sm:flex-none btn btn-primary px-6 py-3 rounded-2xl text-xs font-black shadow-glow group/btn"
            >
              <ArrowRightCircle size={16} className="group-hover:translate-x-1 transition-transform" />
              <span>Manage Unit</span>
            </button>
            <button className="flex-1 sm:flex-none btn btn-secondary px-6 py-3 rounded-2xl text-xs font-black">
              <RefreshCw size={14} />
              <span>Extend</span>
            </button>
          </div>

          <div className="text-right w-full sm:w-auto">
            <div className={`text-[10px] font-black uppercase tracking-widest ${expired || expiring ? 'text-danger' : 'text-text-muted'}`}>
              {expired ? (
                'Instance Expired'
              ) : expiring ? (
                <span className="flex items-center justify-end gap-1.5 animate-pulse">
                  <AlertCircle size={12} /> Ends in {daysLeft} Days
                </span>
              ) : (
                <>Expiry: <span className="text-text-primary ml-1">{formatDate(o.expires_at)}</span></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
