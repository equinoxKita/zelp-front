import { useEffect, useState } from 'react';
import { FileText, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import api from '../../../services/api';
import { formatNumber, formatDate } from '../../../utils/helpers';
import { useToast } from '../../../context/ToastContext';

const STATUS_COLORS = {
  paid: { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
  unpaid: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  cancelled: { bg: 'rgba(255,255,255,0.05)', text: '#6b7280' },
};

function extractDescription(invoice) {
  if (!invoice.description) return 'Service Subscription Payment';
  if (invoice.description.startsWith('{')) {
    try {
      const d = JSON.parse(invoice.description);
      if (d.plan_name) return `Plan Upgrade: ${d.plan_name}`;
      if (d.disk_gb) return `Disk Expansion: ${d.disk_gb}GB`;
      if (d.type === 'deposit') return `Wallet Deposit: Rp ${formatNumber(invoice.amount)}`;
    } catch (e) {}
  }
  return invoice.description;
}

export default function Invoices() {
  const showToast = useToast();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  useEffect(() => {
    api.get('/admin/invoices')
      .then(d => setAll(d.invoices || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = all.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || String(i.id).includes(q) || (i.user_name || '').toLowerCase().includes(q) || (i.user_email || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || i.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    const priority = { unpaid: 1, pending: 2, paid: 3 };
    const pA = priority[a.status] || 99, pB = priority[b.status] || 99;
    if (pA !== pB) return pA - pB;
    return b.id - a.id;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageData = filtered.slice(start, start + PER_PAGE);

  const updateStatus = async (id, status) => {
    if (!['unpaid', 'paid', 'cancelled'].includes(status)) return;
    if (!confirm(`Ubah status Invoice #${id} ke ${status.toUpperCase()}?`)) {
      setAll(prev => [...prev]); // trigger re-render reset
      return;
    }
    try {
      await api.patch(`/admin/invoices/${id}/status`, { status });
      showToast('Status berhasil diperbarui!', 'success');
      setAll(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (err) {
      showToast(err.message, 'error');
      setAll(prev => [...prev]);
    }
  };

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-bg-card h-16 rounded-2xl" />)}</div>;

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center"><FileText size={18} /></div>
        <div>
          <div className="font-black text-text-primary">Billing Ledgers</div>
          <div className="text-xs text-text-muted uppercase font-bold">Showing {filtered.length} of {all.length}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-6 py-4 border-b border-white/5 flex flex-wrap gap-3 bg-white/[0.01]">
        <div className="relative flex-1 min-w-52">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" className="form-input pl-10 h-11 bg-black/20" placeholder="Search by ID, user..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-input h-11 w-auto bg-black/20 font-bold"
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['unpaid', 'paid', 'cancelled'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-text-muted">No invoices found.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-6 py-4 border-b-2 border-white/5 text-xs text-text-muted font-black uppercase">ID / Date</th>
                  <th className="px-4 py-4 border-b-2 border-white/5 text-xs text-text-muted font-black uppercase">Subscriber</th>
                  <th className="px-4 py-4 border-b-2 border-white/5 text-xs text-text-muted font-black uppercase">Description</th>
                  <th className="px-4 py-4 border-b-2 border-white/5 text-xs text-text-muted font-black uppercase">Amount</th>
                  <th className="px-4 py-4 border-b-2 border-white/5 text-xs text-text-muted font-black uppercase">Status</th>
                  <th className="px-6 py-4 border-b-2 border-white/5 text-xs text-text-muted font-black uppercase text-right">Control</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map(i => {
                  const sc = STATUS_COLORS[i.status] || STATUS_COLORS.unpaid;
                  return (
                    <tr key={i.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 border-b border-white/5">
                        <div className="font-black text-text-primary font-mono">#{i.id}</div>
                        <div className="text-xs text-text-muted">{formatDate(i.created_at)}</div>
                      </td>
                      <td className="px-4 py-4 border-b border-white/5">
                        <div className="font-bold text-text-primary">{i.user_name || 'System'}</div>
                        <div className="text-xs text-text-muted">{i.user_email}</div>
                      </td>
                      <td className="px-4 py-4 border-b border-white/5 text-sm text-text-muted">{extractDescription(i)}</td>
                      <td className="px-4 py-4 border-b border-white/5 font-black text-text-primary">Rp {formatNumber(i.amount)}</td>
                      <td className="px-4 py-4 border-b border-white/5">
                        <span className="badge text-xs font-black uppercase" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.text}20` }}>{i.status}</span>
                      </td>
                      <td className="px-6 py-4 border-b border-white/5 text-right">
                        <select className="form-input h-9 py-0 text-xs font-bold w-32 bg-white/5"
                          value={i.status}
                          onChange={e => updateStatus(i.id, e.target.value)}>
                          <option value="unpaid">UNPAID</option>
                          <option value="paid">PAID</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01] flex-wrap gap-4">
            <span className="text-sm text-text-muted">Showing <strong className="text-text-primary">{start + 1}–{Math.min(start + PER_PAGE, filtered.length)}</strong> of <strong className="text-text-primary">{filtered.length}</strong></span>
            <div className="flex gap-2">
              {[
                [<ChevronsLeft size={16}/>, () => setPage(1), safePage <= 1],
                [<><ChevronLeft size={14}/> PREV</>, () => setPage(p => p - 1), safePage <= 1],
                [`${safePage} / ${totalPages}`, null, false, true],
                [<>NEXT <ChevronRight size={14}/></>, () => setPage(p => p + 1), safePage >= totalPages],
                [<ChevronsRight size={16}/>, () => setPage(totalPages), safePage >= totalPages],
              ].map(([label, fn, disabled, passive], idx) => passive ? (
                <div key={idx} className="px-4 h-9 flex items-center bg-white/5 border border-white/10 rounded-xl font-black text-sm">{label}</div>
              ) : (
                <button key={idx} onClick={fn} disabled={disabled}
                  className="btn btn-secondary h-9 px-3 text-sm font-bold rounded-xl flex items-center gap-1 disabled:opacity-40">{label}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
