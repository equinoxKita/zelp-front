import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Server, ArrowLeft, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatNumber } from '../utils/helpers';

export default function Order() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useToast();
  
  const planId = searchParams.get('plan');
  const months = parseInt(searchParams.get('months')) || 1;
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverName, setServerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!planId) {
      navigate('/');
      return;
    }

    api.get(`/plans/${planId}`)
      .then(data => setPlan(data.plan || data))
      .catch(err => {
        showToast(err.message, 'error');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [planId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serverName.trim()) return showToast('Nama server wajib diisi', 'error');
    
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        plan_id: plan.id,
        server_name: serverName,
        period_months: months
      });
      
      showToast(res.message || 'Order berhasil dibuat!', 'success');
      navigate(`/invoice/${res.invoice_id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
      <div className="w-16 h-16 bg-white/5 rounded-full mb-4" />
      <div className="h-4 w-48 bg-white/5 rounded" />
    </div>
  );

  if (!plan) return null;

  const DURATIONS = [
    { m: 1, disc: 0 },
    { m: 3, disc: 5 },
    { m: 6, disc: 10 },
    { m: 12, disc: 15 },
  ];
  const selectedDuration = DURATIONS.find(d => d.m === months);
  const totalPrice = Math.floor(plan.price_monthly * months * (1 - (selectedDuration?.disc || 0) / 100));

  return (
    <div className="p-6 lg:p-8 animate-in max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-text-muted">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Konfirmasi Pesanan</h1>
          <p className="text-text-muted text-sm">Lengkapi detail untuk server baru kamu</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="card p-7 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-black text-text-primary uppercase tracking-wider">
                Nama Server
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent-primary transition-colors">
                  <Zap size={18} />
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Server Survival 1"
                  className="input pl-11 py-4 text-lg font-bold w-full bg-white/[0.02] border-white/5 focus:bg-white/[0.04] focus:border-accent-primary/50 transition-all rounded-2xl"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <p className="text-[11px] text-text-muted font-bold flex items-center gap-1.5 px-1">
                <ShieldCheck size={12} className="text-success" /> Gunakan nama yang mudah diingat untuk server kamu.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center text-white">
                  <Server size={20} />
                </div>
                <div>
                  <div className="text-sm font-black text-text-primary">{plan.name}</div>
                  <div className="text-[10px] text-text-muted uppercase font-black">{plan.category || 'Game Hosting'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                <div className="text-center">
                  <div className="text-[10px] text-text-muted font-black uppercase">CPU</div>
                  <div className="text-xs font-black text-text-primary">{plan.cpu}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-text-muted font-black uppercase">RAM</div>
                  <div className="text-xs font-black text-text-primary">{plan.ram_mb}MB</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-text-muted font-black uppercase">Disk</div>
                  <div className="text-xs font-black text-text-primary">{plan.disk_mb}MB</div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`btn btn-primary btn-block py-4 rounded-2xl font-black text-lg shadow-glow transition-all active:scale-95 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Memproses...' : (
                <>
                  Bayar Sekarang <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-5 bg-accent-primary/5 border-accent-primary/10">
            <h3 className="font-black text-text-primary uppercase text-xs tracking-widest">Ringkasan Pembayaran</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted font-bold">Harga Paket</span>
                <span className="text-text-primary font-black">Rp {formatNumber(plan.price_monthly)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted font-bold">Durasi</span>
                <span className="text-text-primary font-black">{months} Bulan</span>
              </div>
              {selectedDuration?.disc > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span className="font-bold">Diskon Durasi</span>
                  <span className="font-black">-{selectedDuration.disc}%</span>
                </div>
              )}
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-text-muted font-black uppercase">Total Bayar</div>
                  <div className="text-2xl font-black text-text-primary tracking-tight">Rp {formatNumber(totalPrice)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-text-muted">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xs font-black text-text-primary">Aman & Terpercaya</div>
              <div className="text-[10px] text-text-muted leading-tight">Server kamu akan aktif secara otomatis setelah pembayaran berhasil dikonfirmasi.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
