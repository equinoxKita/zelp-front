import { useEffect, useState, useRef } from 'react';
import { PackageCheck, Activity, PauseCircle, Zap, Search, RefreshCw, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import api from '../../../services/api';
import { formatNumber, formatDate } from '../../../utils/helpers';
import { useToast } from '../../../context/ToastContext';

const STATUS_PRIORITY = { active: 1, pending: 2, suspended: 3, cancelled: 4 };
const NOW = new Date();

function filterSubs(all, search, status) {
  const q = search.toLowerCase().trim();
  return all.filter(o => {
    const matchSearch = !q ||
      String(o.id).includes(q) ||
      (o.server_name || '').toLowerCase().includes(q) ||
      (o.user_name || '').toLowerCase().includes(q) ||
      (o.user_email || '').toLowerCase().includes(q) ||
      (o.plan_name || '').toLowerCase().includes(q);

    let matchStatus = true;
    if (status === 'expired') matchStatus = o.expires_at && new Date(o.expires_at) < NOW;
    else if (status === 'expiring_today') {
      const today = NOW.toISOString().split('T')[0];
      matchStatus = o.expires_at && o.expires_at.startsWith(today);
    } else if (status === 'expiring_3d') {
      const t = new Date(); t.setDate(t.getDate() + 3);
      matchStatus = o.expires_at && new Date(o.expires_at) <= t && new Date(o.expires_at) >= NOW;
    } else if (status === 'expiring_7d') {
      const t = new Date(); t.setDate(t.getDate() + 7);
      matchStatus = o.expires_at && new Date(o.expires_at) <= t && new Date(o.expires_at) >= NOW;
    } else if (status) {
      matchStatus = (o.status || '') === status;
    }
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    if (status?.startsWith('expiring')) return new Date(a.expires_at || 0) - new Date(b.expires_at || 0);
    const pA = STATUS_PRIORITY[a.status] || 99;
    const pB = STATUS_PRIORITY[b.status] || 99;
    if (pA !== pB) return pA - pB;
    return (b.id || 0) - (a.id || 0);
  });
}

const STATUS_COLORS = {
  active: { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
  pending: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
  paid: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
  suspended: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  cancelled: { bg: 'rgba(255,255,255,0.05)', text: '#6b7280' },
};

export default function Subscriptions() {
  const showToast = useToast();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;
  const searchRef = useRef(null);

  useEffect(() => {
    api.get('/admin/orders')
      .then(d => setAll(d.orders || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterSubs(all, search, statusFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageData = filtered.slice(start, start + PER_PAGE);

  const activeCount = all.filter(o => o.status === 'active').length;
  const suspendedCount = all.filter(o => o.status === 'suspended').length;
  const expiringCount = all.filter(o => {
    if (!o.expires_at) return false;
    const t = new Date(); t.setDate(t.getDate() + 7);
    return new Date(o.expires_at) <= t && new Date(o.expires_at) >= NOW && o.status === 'active';
  }).length;

  const updateStatus = async (id, el) => {
    const status = el.value;
    try {
      const data = await api.patch(`/admin/orders/${id}/status`, { status });
      showToast(data.message, 'success');
      setAll(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      showToast(err.message, 'error');
      el.value = all.find(o => o.id === id)?.status || '';
    }
  };

  if (loading) return <div className="space-y-3 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="bg-bg-card rounded-2xl h-16" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <MetricCard icon={Activity} label="Active Services" value={activeCount} sub="LIVE" color="#10b981" />
        <MetricCard icon={PauseCircle} label="Suspended" value={suspendedCount} sub="HALTED" color="#ef4444" />
        <MetricCard icon={Zap} label="Expiring Soon" value={expiringCount} sub="7 DAYS" color="#f59e0b" />
      </div>

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-gradient flex items-center justify-center text-white"><PackageCheck size={18} /></div>
            <div>
              <div className="font-black text-text-primary">Subscription Management</div>
              <div className="text-xs text-text-muted font-bold uppercase">Showing {filtered.length} of {all.length} services</div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="px-6 py-4 border-b border-white/5 flex flex-wrap gap-3 items-center bg-white/[0.01]">
          <div className="relative flex-1 min-w-52">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              ref={searchRef}
              type="text"
              className="form-input pl-10 h-11 bg-black/20"
              placeholder="Search by ID, user, server..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="form-input h-11 w-auto min-w-52 bg-black/20 font-bold"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Services</option>
            <optgroup label="Core State">
              {['pending', 'paid', 'active', 'suspended', 'cancelled'].map(s =>
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              )}
            </optgroup>
            <optgroup label="Temporal">
              <option value="expired">Expired</option>
              <option value="expiring_today">Expiring Today</option>
              <option value="expiring_3d">Expiring 72h</option>
              <option value="expiring_7d">Expiring This Week</option>
            </optgroup>
          </select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-text-muted">No subscriptions found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <Th>ID</Th><Th>Subscriber</Th><Th>Architecture</Th><Th>Financials</Th><Th>Status & Expiry</Th><Th right>Control</Th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map(o => {
                    const sc = STATUS_COLORS[o.status] || STATUS_COLORS.active;
                    const isExpired = o.expires_at && new Date(o.expires_at) < NOW;
                    return (
                      <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 border-b border-white/5 font-black text-text-primary font-mono">#{o.id}</td>
                        <td className="px-4 py-4 border-b border-white/5">
                          <div className="font-bold text-text-primary">{o.user_name || 'System'}</div>
                          <div className="text-xs text-text-muted">{o.user_email}</div>
                        </td>
                        <td className="px-4 py-4 border-b border-white/5">
                          <div className="font-black text-accent-primary">{o.server_name || `NODE-${o.id}`}</div>
                          <div className="text-xs text-text-muted">{o.plan_name}</div>
                        </td>
                        <td className="px-4 py-4 border-b border-white/5">
                          <div className="font-black text-text-primary">Rp {formatNumber(o.total_price)}</div>
                          <div className="text-xs text-text-muted uppercase font-bold">Monthly</div>
                        </td>
                        <td className="px-4 py-4 border-b border-white/5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase"
                            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.text}20` }}>
                            {o.status}
                          </div>
                          <div className={`text-xs mt-1 font-bold ${isExpired ? 'text-danger' : 'text-text-muted'}`}>
                            {formatDate(o.expires_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 border-b border-white/5 text-right">
                          <div className="flex gap-2 justify-end">
                            <select
                              className="form-input h-9 py-0 text-xs font-bold w-32 bg-white/5"
                              defaultValue={o.status}
                              onChange={e => updateStatus(o.id, e.target)}
                            >
                              {['pending', 'paid', 'active', 'suspended', 'cancelled'].map(s =>
                                <option key={s} value={s}>{s.toUpperCase()}</option>
                              )}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} totalPages={totalPages} total={filtered.length} start={start} perPage={PER_PAGE} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-6 flex items-center gap-4 relative overflow-hidden" style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
      <div className="absolute -top-5 -right-5 opacity-[0.04]" style={{ color }}><Icon size={100} /></div>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-black text-text-primary">{value} <span className="text-sm font-bold" style={{ color }}>{sub}</span></div>
      </div>
    </div>
  );
}

function Th({ children, right }) {
  return <th className={`px-${right ? '6' : '4'} py-4 border-b-2 border-white/5 text-xs font-black text-text-muted uppercase tracking-wider ${right ? 'text-right' : ''}`}>{children}</th>;
}

export function Pagination({ page, totalPages, total, start, perPage, onPage }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01] flex-wrap gap-4">
      <span className="text-sm text-text-muted font-semibold">
        Showing <span className="text-text-primary font-black">{start + 1}–{Math.min(start + perPage, total)}</span> of <span className="text-text-primary font-black">{total}</span>
      </span>
      <div className="flex gap-2 items-center">
        <PagBtn onClick={() => onPage(1)} disabled={page <= 1}><ChevronsLeft size={16} /></PagBtn>
        <PagBtn onClick={() => onPage(page - 1)} disabled={page <= 1}><ChevronLeft size={16} /> PREV</PagBtn>
        <div className="px-4 h-9 flex items-center bg-white/5 border border-white/10 rounded-xl font-black text-text-primary text-sm min-w-20 justify-center">
          {page} / {totalPages}
        </div>
        <PagBtn onClick={() => onPage(page + 1)} disabled={page >= totalPages}>NEXT <ChevronRight size={16} /></PagBtn>
        <PagBtn onClick={() => onPage(totalPages)} disabled={page >= totalPages}><ChevronsRight size={16} /></PagBtn>
      </div>
    </div>
  );
}

function PagBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="btn btn-secondary h-9 px-3 text-sm font-bold rounded-xl flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
      {children}
    </button>
  );
}
