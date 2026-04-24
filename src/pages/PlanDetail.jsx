import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Server, Cpu, Database, HardDrive, Calendar, MapPin, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { formatNumber, formatMB } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(1);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    api.get(`/plans/${id}`)
      .then((data) => setPlan(data.plan || data))
      .catch((err) => { showToast(err.message, 'error'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-10 animate-pulse space-y-4">
      <div className="bg-bg-card h-20 rounded-2xl" />
      <div className="bg-bg-card h-64 rounded-2xl" />
    </div>
  );
  if (!plan) return null;

  const DURATIONS = [
    { m: 1, disc: 0 },
    { m: 3, disc: 5 },
    { m: 6, disc: 10 },
    { m: 12, disc: 15 },
  ];
  const selectedDuration = DURATIONS.find((d) => d.m === months);
  const totalPrice = Math.floor(plan.price_monthly * months * (1 - (selectedDuration?.disc || 0) / 100));

  return (
    <div className="p-6 lg:p-8 animate-in max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
        <ArrowLeft size={15} /> Kembali
      </button>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plan Info */}
        <div className="card p-7 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-gradient flex items-center justify-center text-white shadow-glow">
              <Server size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-text-primary">{plan.name}</h1>
              <p className="text-text-muted text-sm">{plan.category || 'Game Hosting'}</p>
            </div>
          </div>

          {plan.description && (
            <p className="text-text-secondary text-sm leading-relaxed">{plan.description}</p>
          )}

          <div className="border-t border-white/5 pt-5 grid grid-cols-2 gap-4">
            <Spec icon={Cpu} label="CPU" value={`${plan.cpu}%`} color="text-blue-400" bg="bg-blue-500/5" />
            <Spec icon={Database} label="RAM" value={formatMB(plan.ram_mb)} color="text-success" bg="bg-success/5" />
            <Spec icon={HardDrive} label="Disk" value={formatMB(plan.disk_mb)} color="text-warning" bg="bg-warning/5" />
            <Spec icon={Database} label="Database" value={plan.databases_count || 1} color="text-accent-primary" bg="bg-accent-primary/5" />
            <Spec icon={Calendar} label="Backup" value={`${plan.backups || 1} Slots`} color="text-accent-secondary" bg="bg-accent-secondary/5" />
            <Spec icon={MapPin} label="Lokasi" value={plan.location || 'SG'} color="text-text-muted" bg="bg-white/5" />
          </div>
        </div>

        {/* Order Panel */}
        <div className="card p-7 space-y-6">
          <h2 className="text-xl font-black text-text-primary">Pilih Durasi</h2>
          <div className="grid grid-cols-2 gap-3">
            {DURATIONS.map(({ m, disc }) => {
              const price = Math.floor(plan.price_monthly * m * (1 - disc / 100));
              return (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`relative p-4 rounded-2xl border text-left transition-all ${
                    months === m
                      ? 'border-accent-primary bg-accent-primary/10 shadow-glow-sm'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                  }`}
                >
                  {disc > 0 && (
                    <span className="absolute top-0 right-0 bg-accent-gradient text-white text-[10px] font-black px-2 py-0.5 rounded-tr-2xl rounded-bl-lg">
                      SAVE {disc}%
                    </span>
                  )}
                  <div className="text-xs font-black text-text-muted uppercase mb-1">{m} Bulan</div>
                  <div className="text-lg font-black text-text-primary">Rp {formatNumber(price)}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Harga per bulan</span>
              <span className="font-bold text-text-primary">Rp {formatNumber(plan.price_monthly)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Durasi</span>
              <span className="font-bold text-text-primary">{months} Bulan</span>
            </div>
            {selectedDuration?.disc > 0 && (
              <div className="flex justify-between text-success">
                <span className="text-sm">Diskon</span>
                <span className="font-bold">-{selectedDuration.disc}%</span>
              </div>
            )}
            <div className="border-t border-white/5 pt-3 flex justify-between">
              <span className="font-black text-text-primary">Total</span>
              <span className="text-xl font-black text-text-primary">Rp {formatNumber(totalPrice)}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-1">
            <input
              type="checkbox"
              id="tos-agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-accent-primary focus:ring-accent-primary cursor-pointer"
            />
            <label htmlFor="tos-agree" className="text-sm text-text-secondary cursor-pointer select-none">
              Dengan membeli hosting ini, kamu setuju dengan{' '}
              <Link to="/tos" className="text-accent-primary hover:underline">Terms of Service</Link>.
            </label>
          </div>

          <Link
            to={agreed ? `/order?plan=${plan.id}&months=${months}` : '#'}
            onClick={(e) => !agreed && e.preventDefault()}
            className={`btn btn-block py-3.5 rounded-xl font-black text-base transition-all ${
              agreed 
                ? 'btn-primary shadow-glow-sm' 
                : 'bg-white/5 text-text-muted cursor-not-allowed border-white/5'
            }`}
          >
            <ArrowRight size={18} /> Pesan Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-3 border border-white/5`}>
      <div className={`flex items-center gap-1.5 text-xs text-text-muted font-bold mb-1.5`}>
        <Icon size={11} className={color} /> {label}
      </div>
      <div className="font-black text-text-primary">{value}</div>
    </div>
  );
}
