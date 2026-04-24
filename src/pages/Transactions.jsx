import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ChevronLeft, ChevronRight, Download, FileX } from 'lucide-react';
import api from '../services/api';
import { formatNumber, formatDate } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

const STATUS_CONFIG = {
  paid: { color: '#10b981', label: 'paid' },
  unpaid: { color: '#f59e0b', label: 'unpaid' },
  failed: { color: '#ef4444', label: 'failed' },
  cancelled: { color: '#64748b', label: 'cancelled' },
};

export default function Transactions() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const showToast = useToast();
  const LIMIT = 10;

  const loadInvoices = async (pg = 1) => {
    setLoading(true);
    setPage(pg);
    try {
      const data = await api.get(`/invoices?page=${pg}&limit=${LIMIT}`);
      setInvoices(data.invoices || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(1); }, []);

  const downloadPdf = async (id) => {
    try {
      // Security: validate id is a safe integer before using in URL and filename
      const safeId = parseInt(id, 10);
      if (!Number.isFinite(safeId) || safeId <= 0) throw new Error('Invoice ID tidak valid.');
      showToast('Mengunduh PDF...', 'info');
      const res = await fetch(`/api/invoices/${safeId}/pdf`, {
        headers: { Authorization: `Bearer ${api.getToken()}` },
      });
      if (!res.ok) throw new Error('Gagal mengunduh PDF');
      // Security: verify response is PDF before creating blob URL
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) throw new Error('Respons server tidak valid.');
      const blob = await res.blob();
      // Security: create a typed blob to prevent content sniffing
      const safePdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(safePdfBlob);
      const a = document.createElement('a');
      // Security: use a static string for download attribute, only safeId (integer) in filename
      a.rel = 'noopener noreferrer';
      a.href = blobUrl;
      a.download = `INV-${safeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-accent-gradient flex items-center justify-center shadow-glow text-white">
            <Receipt size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight">Billing History</h1>
            <p className="text-text-muted text-sm mt-1 font-semibold">Manage your invoices, payments, and digital receipts.</p>
          </div>
        </div>
        <div className="card glass p-5 rounded-2xl text-right">
          <div className="text-xs text-text-muted uppercase tracking-widest font-black mb-1">Total Records</div>
          <div className="text-3xl font-black text-text-primary">{total}</div>
        </div>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-bg-card rounded-2xl h-24" />)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-20 rounded-3xl text-center border-2 border-dashed border-white/5">
          <div className="w-28 h-28 rounded-3xl bg-accent-gradient flex items-center justify-center mx-auto mb-8 text-white shadow-glow -rotate-6">
            <FileX size={56} />
          </div>
          <h3 className="text-2xl font-black text-text-primary mb-3">No Invoices Yet</h3>
          <p className="text-text-muted max-w-sm mx-auto">Your financial transaction history is currently empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const sc = STATUS_CONFIG[inv.status] || { color: '#6366f1', label: inv.status };
            return (
              <div
                key={inv.id}
                className="glass border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-white/10 hover:translate-x-1 transition-all duration-300 cursor-pointer"
                style={{ borderLeft: `6px solid ${sc.color}` }}
                onClick={() => navigate(`/invoice/${inv.id}`)}
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center flex-shrink-0" style={{ color: sc.color }}>
                    <Receipt size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-black text-text-primary">#INV-{inv.id}</h4>
                      <span className="badge text-xs uppercase tracking-wide" style={{
                        background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}33`
                      }}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-text-muted text-sm font-bold">
                      <span>{formatDate(inv.created_at)}</span>
                      <span>{inv.payment_type || 'Manual Payment'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right md:min-w-40">
                  <div className="text-xs text-text-muted uppercase tracking-widest font-black mb-1">Amount Due</div>
                  <div className="text-2xl font-black text-text-primary">Rp {formatNumber(inv.amount)}</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => { e.stopPropagation(); downloadPdf(inv.id); }}
                  title="Download PDF"
                >
                  <Download size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center">
          <div className="glass border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-6">
            <button onClick={() => loadInvoices(page - 1)} disabled={page <= 1} className="btn btn-secondary btn-sm disabled:opacity-40">
              <ChevronLeft size={18} /> Previous
            </button>
            <div className="flex items-center gap-3 text-sm font-black">
              <span className="text-text-muted">Page</span>
              <span className="w-9 h-9 rounded-xl bg-accent-gradient text-white flex items-center justify-center font-black shadow-glow-sm">{page}</span>
              <span className="text-text-muted">of</span>
              <span className="text-text-primary text-lg">{totalPages}</span>
            </div>
            <button onClick={() => loadInvoices(page + 1)} disabled={page >= totalPages} className="btn btn-secondary btn-sm disabled:opacity-40">
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
