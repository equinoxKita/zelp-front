// ServiceDetail page — complex XTerm.js integration
// This is a placeholder. The full implementation requires xterm npm package.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Server, ArrowLeft, Terminal, RefreshCw, Cpu, Database, HardDrive } from 'lucide-react';
import api from '../services/api';
import { formatNumber, formatDate, formatMB } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Quick Login, Recreate, Egg states
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);
  const [isRecreating, setIsRecreating] = useState(false);
  const [isChangingEgg, setIsChangingEgg] = useState(false);
  const [showEggModal, setShowEggModal] = useState(false);
  const [nests, setNests] = useState([]);
  const [eggs, setEggs] = useState([]);
  const [selectedNest, setSelectedNest] = useState('');
  const [selectedEgg, setSelectedEgg] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then((data) => setService(data))
      .catch((err) => { showToast(err.message, 'error'); navigate('/subscriptions'); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!service?.ptero_identifier) return;
    const interval = setInterval(() => {
      api.get(`/orders/${id}/stats`).then((d) => setStats(d.resources)).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [service, id]);

  if (loading) return (
    <div className="p-8 space-y-4 animate-pulse">
      <div className="bg-bg-card rounded-3xl h-32" />
      <div className="bg-bg-card rounded-3xl h-64" />
    </div>
  );
  if (!service) return null;

  const cpu = stats?.cpu_absolute?.toFixed(1) ?? '—';
  const ramMB = stats ? (stats.memory_bytes / 1024 / 1024).toFixed(0) : '—';
  const diskMB = stats ? (stats.disk_bytes / 1024 / 1024).toFixed(0) : '—';
  const totalDisk = (service.disk_mb || 0) + (service.extra_disk_mb || 0);

  const handleQuickLogin = async () => {
    if (!window.confirm('Fitur Quick Login akan me-reset password akun Pterodactyl Anda demi keamanan. Lanjutkan?')) return;
    setIsQuickLoggingIn(true);
    try {
      const res = await api.post('/pterodactyl/quick-login');
      showToast(res.message, 'success');
      if (res.redirect) window.open(res.redirect, '_blank');
      else if (res.panel_url) window.open(res.panel_url, '_blank');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  const handleRecreateIfMissing = async () => {
    setIsRecreating(true);
    try {
      const res = await api.post(`/orders/${id}/recreate-if-missing`);
      if (res.already_exists) {
        showToast('Server ditemukan di panel. Data telah disinkronkan.', 'info');
      } else {
        showToast('Server berhasil dibuat ulang di panel!', 'success');
      }
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsRecreating(false);
    }
  };

  const openEggModal = async () => {
    setShowEggModal(true);
    try {
      const data = await api.get('/pterodactyl/nests');
      setNests(data.nests);
    } catch (err) {
      showToast('Gagal mengambil data nest', 'error');
    }
  };

  const handleNestChange = async (nestId) => {
    setSelectedNest(nestId);
    setEggs([]);
    setSelectedEgg('');
    try {
      const data = await api.get(`/pterodactyl/nests/${nestId}/eggs`);
      setEggs(data.eggs);
    } catch (err) {
      showToast('Gagal mengambil data egg', 'error');
    }
  };

  const handleChangeEgg = async () => {
    if (!selectedNest || !selectedEgg) return showToast('Pilih Nest dan Egg dahulu', 'warning');
    setIsChangingEgg(true);
    try {
      const res = await api.post(`/orders/${id}/change-egg`, { nest_id: selectedNest, egg_id: selectedEgg });
      showToast(res.message, 'success');
      setShowEggModal(false);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsChangingEgg(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-in space-y-6">
      <button onClick={() => navigate('/subscriptions')} className="btn btn-secondary btn-sm">
        <ArrowLeft size={15} /> Kembali
      </button>

      {/* Server Header */}
      <div className="card p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Server size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-text-primary">{service.server_name || 'Unnamed Server'}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-text-muted font-semibold">
                <span>{service.plan_name || 'Generic Plan'}</span>
                <span className={`badge ${service.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {service.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleQuickLogin}
              disabled={isQuickLoggingIn}
              className="btn btn-secondary px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"
            >
              {isQuickLoggingIn ? <RefreshCw className="animate-spin" size={16} /> : <Terminal size={16} />} 
              Quick Login
            </button>
            <a
              href={`https://panel.zelpstore.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary px-5 py-2.5 rounded-xl font-bold"
            >
              <Terminal size={16} /> Buka Panel
            </a>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="CPU"
          value={`${cpu}%`}
          percent={parseFloat(cpu) || 0}
          color="#3b82f6"
          icon={Cpu}
          limit={`${service.cpu || 100}%`}
        />
        <StatCard
          label="RAM"
          value={`${ramMB} MB`}
          percent={service.ram_mb ? Math.round((parseFloat(ramMB) / service.ram_mb) * 100) : 0}
          color="#10b981"
          icon={Database}
          limit={formatMB(service.ram_mb)}
        />
        <StatCard
          label="Disk"
          value={`${diskMB} MB`}
          percent={totalDisk ? Math.round((parseFloat(diskMB) / totalDisk) * 100) : 0}
          color="#f59e0b"
          icon={HardDrive}
          limit={formatMB(totalDisk)}
        />
      </div>

      {/* Service Info */}
      <div className="card p-6 grid sm:grid-cols-2 gap-4">
        <InfoRow label="Harga Bulanan" value={`Rp ${formatNumber(service.plan_price || service.price)}`} />
        <InfoRow label="Durasi" value={`${service.period_months || 1} Bulan`} />
        <InfoRow label="Mulai" value={formatDate(service.created_at)} />
        <InfoRow label="Berakhir" value={formatDate(service.expires_at)} />
        <InfoRow label="Lokasi" value={service.location || 'Singapore'} />
        {service.ptero_identifier && <InfoRow label="Server ID" value={service.ptero_identifier} mono />}
      </div>

      {/* Troubleshooting Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-black text-text-primary">Server Management</h3>
          <p className="text-sm text-text-muted font-medium">Bermasalah dengan server Anda? Gunakan fitur berikut untuk memperbaiki server.</p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleRecreateIfMissing}
              disabled={isRecreating}
              className="btn btn-outline btn-sm flex items-center gap-2 border-dashed"
            >
              {isRecreating ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
              Restore Missing Server
            </button>
            <button 
              onClick={openEggModal}
              className="btn btn-outline btn-sm flex items-center gap-2 border-dashed"
            >
              <Server size={14} />
              Change Server Egg
            </button>
          </div>
        </div>
      </div>

      {/* Egg Change Modal */}
      {showEggModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="card max-w-md w-full p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowEggModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-black text-text-primary mb-2">Change Server Egg</h2>
            <p className="text-sm text-text-muted mb-6 font-medium">Ubah sistem operasi server Anda. Data lama mungkin tidak dapat terbaca jika struktur file berbeda.</p>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="text-xs font-black uppercase text-text-muted mb-1 block">Select Nest</label>
                <select 
                  className="input w-full"
                  value={selectedNest}
                  onChange={(e) => handleNestChange(e.target.value)}
                >
                  <option value="">Pilih Nest...</option>
                  {nests.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="text-xs font-black uppercase text-text-muted mb-1 block">Select Egg</label>
                <select 
                  className="input w-full"
                  value={selectedEgg}
                  onChange={(e) => setSelectedEgg(e.target.value)}
                  disabled={!selectedNest}
                >
                  <option value="">Pilih Egg...</option>
                  {eggs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              {selectedEgg && (
                 <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 mb-2">
                    <p className="text-[11px] text-blue-400 font-bold leading-relaxed">
                      💡 Mengubah egg Minecraft Java memerlukan minimal 2GB RAM. Server akan di-reinstall secara otomatis.
                    </p>
                 </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowEggModal(false)}
                  className="btn btn-secondary flex-1 font-bold"
                >
                  Batal
                </button>
                <button 
                  onClick={handleChangeEgg}
                  disabled={isChangingEgg || !selectedEgg}
                  className="btn btn-primary flex-1 font-bold"
                >
                  {isChangingEgg ? 'Processing...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, percent, color, icon: Icon, limit }) {
  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1.5 text-xs font-black text-text-muted uppercase">
          <Icon size={12} style={{ color }} /> {label}
        </div>
        <span className="text-sm font-black" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ background: color, width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <div className="text-xs text-text-muted font-semibold">{percent}% of {limit}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-muted font-black uppercase tracking-wider">{label}</span>
      <span className={`text-text-primary font-bold text-sm ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
