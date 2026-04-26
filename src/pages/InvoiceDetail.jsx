import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Receipt, CreditCard, Download, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { formatNumber, formatDate } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { updateUser } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then((d) => setInvoice(d.invoice || d))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const payWithBalance = async () => {
    setPaying(true);
    try {
      const data = await api.post(`/invoices/${id}/pay`);
      showToast(data.message, 'success');
      setInvoice((prev) => ({ ...prev, status: 'paid' }));
      if (data.user) updateUser(data.user);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      const data = await api.post('/payment/create', { invoice_id: Number(id) });
      
      if (data.payment_method === 'midtrans') {
        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: (result) => {
              showToast('Pembayaran berhasil!', 'success');
              setInvoice((prev) => ({ ...prev, status: 'paid' }));
            },
            onPending: (result) => {
              showToast('Pembayaran tertunda, silakan selesaikan pembayaran.', 'info');
              navigate('/transactions');
            },
            onError: (result) => {
              showToast('Pembayaran gagal.', 'error');
            },
            onClose: () => {
              showToast('Pembayaran dibatalkan.', 'warning');
            }
          });
        } else {
          showToast('Midtrans Snap tidak termuat. Silakan refresh halaman.', 'error');
        }
      } else if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const downloadPdf = async () => {
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

  if (loading) return <div className="p-10 text-center text-text-muted animate-pulse">Memuat invoice...</div>;
  if (!invoice) return <div className="p-10 text-center text-danger">Invoice tidak ditemukan.</div>;

  const isPaid = invoice.status === 'paid';

  return (
    <div className="p-6 lg:p-8 animate-in max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/transactions')} className="btn btn-secondary btn-sm">
        <ArrowLeft size={15} /> Kembali
      </button>

      <div className="card p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-gradient flex items-center justify-center text-white shadow-glow">
              <Receipt size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-text-primary">#INV-{invoice.id}</h1>
              <p className="text-text-muted text-sm">{formatDate(invoice.created_at)}</p>
            </div>
          </div>
          <span className={`badge text-xs uppercase font-black ${isPaid ? 'badge-success' : 'badge-warning'}`}>
            {invoice.status}
          </span>
        </div>

        <div className="border-t border-white/5 pt-5 space-y-3">
          <Row label="Invoice ID" value={`#INV-${invoice.id}`} />
          <Row label="Tanggal" value={formatDate(invoice.created_at)} />
          <Row label="Metode Pembayaran" value={invoice.payment_type || '-'} />
          {invoice.description && <Row label="Deskripsi" value={invoice.description} />}
          <div className="border-t border-white/5 pt-3">
            <Row label="Total Tagihan" value={`Rp ${formatNumber(invoice.amount)}`} bold />
          </div>
        </div>

        {isPaid && (
          <div className="bg-success/10 border border-success/20 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-success" />
            <span className="text-success font-bold text-sm">Invoice ini sudah terbayar.</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {!isPaid && (
            <>
              <button onClick={payWithBalance} disabled={paying} className="btn btn-primary flex-1 py-3 rounded-xl font-black">
                {paying ? <><span className="spinner" /> Memproses...</> : <><CreditCard size={16} /> Bayar dengan Saldo</>}
              </button>
              <button onClick={handlePayment} disabled={paying} className="btn btn-secondary flex-1 py-3 rounded-xl font-bold">
                {paying ? (
                  <><span className="spinner" /> Menyiapkan...</>
                ) : (
                  <><CreditCard size={16} /> Bayar Sekarang</>
                )}
              </button>
            </>
          )}
          <button onClick={downloadPdf} className="btn btn-secondary py-3 px-4 rounded-xl">
            <Download size={16} /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-text-muted text-sm">{label}</span>
      <span className={`text-sm ${bold ? 'text-xl font-black text-text-primary' : 'font-semibold text-text-primary'}`}>{value}</span>
    </div>
  );
}
