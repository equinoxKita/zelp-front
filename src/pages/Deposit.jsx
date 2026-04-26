import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, CreditCard, RefreshCw, Landmark } from 'lucide-react';
import api from '../services/api';
import { formatNumber } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export default function Deposit() {
  const { user, updateUser } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/invoices?type=deposit&limit=5')
      .then((d) => setHistory(d.invoices || []))
      .catch(() => {});
      
    // Refresh user profile to get latest balance
    api.get('/auth/me')
      .then(d => { if (d.user) updateUser(d.user); })
      .catch(() => {});
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amt = parseInt(amount);
    if (!amt || amt < 10000) return showToast('Minimum deposit Rp 10.000', 'error');
    setLoading(true);
    try {
      const data = await api.post('/deposit/create', { amount: amt });
      
      if (data.payment_method === 'midtrans') {
        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: async (result) => {
              showToast('Deposit berhasil!', 'success');
              try {
                const data = await api.get('/auth/me');
                if (data.user) updateUser(data.user);
              } catch (e) {
                console.error('Failed to refresh user data:', e);
              }
              navigate('/transactions');
            },
            onPending: (result) => {
              showToast('Pembayaran tertunda, silakan selesaikan pembayaran.', 'info');
              navigate('/transactions');
            },
            onError: (result) => {
              showToast('Deposit gagal.', 'error');
            },
            onClose: () => {
              showToast('Deposit dibatalkan.', 'warning');
            }
          });
        } else {
          showToast('Midtrans Snap tidak termuat.', 'error');
        }
      } else if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else if (data.deposit_id) {
        navigate(`/transactions`); // Success but no redirect
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-in space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
          <Wallet size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Top Up Saldo</h1>
          <p className="text-text-muted text-sm">Isi ulang saldo akun kamu</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-success/10 to-accent-secondary/5 border border-success/20 rounded-2xl p-6">
        <div className="text-xs text-text-muted uppercase tracking-widest font-black mb-2">Saldo Saat Ini</div>
        <div className="text-4xl font-black text-text-primary">Rp {formatNumber(user?.balance)}</div>
      </div>

      {/* Deposit Form */}
      <div className="card p-6 space-y-5">
        <h2 className="text-lg font-black text-text-primary flex items-center gap-2"><Plus size={18} /> Tambah Saldo</h2>

        {/* Quick amounts */}
        <div className="grid grid-cols-3 gap-3">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(String(a))}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all ${
                amount === String(a)
                  ? 'border-success bg-success/10 text-success'
                  : 'border-white/10 bg-white/[0.02] text-text-secondary hover:border-white/20 hover:text-text-primary'
              }`}
            >
              Rp {formatNumber(a)}
            </button>
          ))}
        </div>

        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Jumlah Custom (min. Rp 10.000)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Contoh: 75000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={10000}
            />
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3 text-sm">
            <Landmark size={18} className="text-accent-secondary flex-shrink-0" />
            <span className="text-text-secondary">Pilih metode pembayaran aman di halaman berikutnya.</span>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block py-3.5 rounded-xl font-black">
            {loading ? <><span className="spinner" /> Memproses...</> : <><CreditCard size={16} /> Top Up Sekarang</>}
          </button>
        </form>
      </div>
    </div>
  );
}
