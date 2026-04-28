// ServiceDetail page — complex XTerm.js integration
// This is a placeholder. The full implementation requires xterm npm package.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Server, ArrowLeft, Terminal, RefreshCw, Cpu, Database, HardDrive } from 'lucide-react';
import api from '../services/api';
import { formatNumber, formatDate, formatMB } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import DOMPurify from 'dompurify';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [selectedEggName, setSelectedEggName] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then((data) => {
        // IDOR Protection: Ensure user owns this service
        if (data.user_id !== user.id && user.role !== 'admin') {
          showToast('Akses ditolak.', 'error');
          return navigate('/subscriptions');
        }
        setService(data);
      })
      .catch((err) => {
        showToast(err.message, 'error');
        navigate('/subscriptions');
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate, showToast]);

  useEffect(() => {
    let isMounted = true;
    if (!service?.ptero_identifier) return;
    const interval = setInterval(() => {
      api.get(`/orders/${id}/stats`).then((d) => {
        if (isMounted) setStats(d.resources);
      }).catch(() => { });
    }, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
    const result = await Swal.fire({
      title: 'Quick Login?',
      text: 'Fitur ini akan me-reset password akun Pterodactyl Anda demi keamanan. Password baru akan disimpan di sistem.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Lanjutkan',
      cancelButtonText: 'Batal',
      background: '#1a1a1a',
      color: '#fff',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#262626',
      customClass: {
        popup: 'rounded-3xl border border-white/5 shadow-2xl',
        confirmButton: 'rounded-xl font-bold px-6 py-3',
        cancelButton: 'rounded-xl font-bold px-6 py-3'
      }
    });

    if (!result.isConfirmed) return;

    setIsQuickLoggingIn(true);
    try {
      const res = await api.post('/pterodactyl/quick-login');

      const sanitizedEmail = DOMPurify.sanitize(user?.email || '-');
      const sanitizedPassword = DOMPurify.sanitize(res.password || '-');

      Swal.fire({
        title: 'Login Berhasil!',
        html: DOMPurify.sanitize(`
          <div class="text-left space-y-4">
            <p class="text-sm text-text-muted">Password Pterodactyl Anda telah di-reset. Simpan detail berikut:</p>
            <div class="space-y-3">
              <div class="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                <span class="text-[10px] uppercase font-black text-text-muted tracking-widest">Email / Username</span>
                <span class="text-sm font-bold text-text-primary select-all">${sanitizedEmail}</span>
              </div>
              <div class="bg-black/20 p-4 rounded-2xl border border-blue-500/10 flex flex-col gap-1 relative group">
                <span class="text-[10px] uppercase font-black text-text-muted tracking-widest">Password Baru</span>
                <div class="flex items-center justify-between">
                  <span id="ptero-password" class="text-sm font-mono text-blue-400 filter blur-sm hover:blur-none transition-all duration-300 cursor-pointer select-all" title="Klik atau arahkan kursor untuk melihat">
                    ${sanitizedPassword}
                  </span>
                  <span class="text-[9px] text-text-muted font-bold opacity-50">ARAHKAN KURSOR UNTUK MELIHAT</span>
                </div>
              </div>
            </div>
            <div class="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <p class="text-[11px] text-yellow-500 font-bold leading-relaxed">
                ⚠️ Segera ganti password ini di dalam panel jika diperlukan. Password ini hanya ditampilkan sekali.
              </p>
            </div>
          </div>
        `),
        icon: 'success',
        confirmButtonText: res.redirect || res.panel_url ? 'Buka Panel' : 'Selesai',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#3b82f6',
        customClass: {
          popup: 'rounded-3xl border border-white/5 shadow-2xl p-8',
          confirmButton: 'rounded-xl font-bold px-8 py-4 w-full mt-4'
        }
      }).then((swalRes) => {
        if (swalRes.isConfirmed) {
          const allowedDomain = 'panel.zelpstore.com';
          const redirectUrl = res.redirect || res.panel_url;
          
          if (redirectUrl) {
            try {
              const urlObj = new URL(redirectUrl);
              if (urlObj.hostname === allowedDomain) {
                window.open(redirectUrl, '_blank', 'noopener,noreferrer');
              } else {
                showToast('Domain redirect tidak diizinkan.', 'error');
              }
            } catch (e) {
              showToast('URL tidak valid.', 'error');
            }
          }
        }
      });

    } catch (err) {
      Swal.fire({
        title: 'Gagal',
        text: err.message,
        icon: 'error',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'rounded-3xl border border-white/5 shadow-2xl',
          confirmButton: 'rounded-xl font-bold px-6 py-3'
        }
      });
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
    setSelectedEggName('');
    try {
      const data = await api.get(`/pterodactyl/nests/${nestId}/eggs`);
      setEggs(data.eggs);
    } catch (err) {
      showToast('Gagal mengambil data egg', 'error');
    }
  };

  const handleEggSelect = (eggId) => {
    setSelectedEgg(eggId);
    const egg = eggs.find(e => String(e.id) === String(eggId));
    setSelectedEggName(egg ? egg.name : '');
  };

  // Detect if selected egg is Minecraft Java variant
  const isMinecraftJavaEgg = () => {
    const n = selectedEggName.toLowerCase();
    return n.includes('minecraft') && (
      n.includes('java') || n.includes('forge') || n.includes('fabric') ||
      n.includes('purpur') || n.includes('paper') || n.includes('spigot') ||
      n.includes('bukkit') || n.includes('vanilla')
    ) && !n.includes('bedrock');
  };

  const ramMB_plan = service ? (service.ram_mb || 0) : 0;
  const ramBlocked = isMinecraftJavaEgg() && ramMB_plan < 2048;

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
          percent={(service.ram_mb && parseFloat(ramMB)) ? Math.round((parseFloat(ramMB) / service.ram_mb) * 100) : 0}
          color="#10b981"
          icon={Database}
          limit={formatMB(service.ram_mb)}
        />
        <StatCard
          label="Disk"
          value={`${diskMB} MB`}
          percent={(totalDisk && parseFloat(diskMB)) ? Math.round((parseFloat(diskMB) / totalDisk) * 100) : 0}
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

      {/* Suspended Alert Banner */}
      {service.status === 'suspended' && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-4 animate-in slide-in-from-top-2">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-red-400 font-black text-sm">Server Disuspend — Tagihan Belum Dibayar</p>
            <p className="text-red-300/80 text-xs font-medium mt-1">
              Server Anda saat ini disuspend karena ada invoice yang belum dibayar. Bayar tagihan Anda untuk mengaktifkan kembali server.
            </p>
          </div>
        </div>
      )}

      {/* Pending Alert Banner */}
      {service.status === 'pending' && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 flex items-start gap-4 animate-in slide-in-from-top-2">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="text-yellow-500 font-black text-sm">Menunggu Pembayaran</p>
            <p className="text-yellow-400/80 text-xs font-medium mt-1">
              Server Anda sedang menunggu pembayaran invoice. Server akan otomatis aktif setelah pembayaran berhasil diverifikasi.
            </p>
            <button onClick={() => navigate('/invoices')} className="mt-3 text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-black px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors">
              Lihat Invoice
            </button>
          </div>
        </div>
      )}

      {/* Troubleshooting Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-black text-text-primary">Server Management</h3>
          <p className="text-sm text-text-muted font-medium">Bermasalah dengan server Anda? Gunakan fitur berikut untuk memperbaiki server.</p>

          {/* Recreate button — disabled if server exists on panel OR not active */}
          {(() => {
            const serverOnPanel = !!service.ptero_identifier;
            const isActive = service.status === 'active';
            const recreateDisabled = isRecreating || serverOnPanel || !isActive;
            
            let recreateTitle = 'Buat ulang server jika hilang dari panel';
            if (serverOnPanel) recreateTitle = 'Server masih ada di panel — tidak perlu di-recreate';
            if (!isActive) recreateTitle = `Server ${service.status} — bayar tagihan terlebih dahulu`;
            
            return (
              <div className="flex flex-wrap gap-3">
                <div className="relative group">
                  <button
                    onClick={handleRecreateIfMissing}
                    disabled={recreateDisabled}
                    title={recreateTitle}
                    className={`btn btn-sm flex items-center gap-2 border-dashed transition-all ${
                      recreateDisabled
                        ? 'btn-outline opacity-40 cursor-not-allowed'
                        : 'btn-outline hover:border-blue-500/60'
                    }`}
                  >
                    {isRecreating ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                    Restore Missing Server
                  </button>
                  {/* Tooltip reason */}
                  {recreateDisabled && (
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex">
                      <span className="bg-black/90 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap border border-white/10">
                        {serverOnPanel ? '✅ Server ada di panel' : `🔒 Server ${service.status}`}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={openEggModal}
                  disabled={service.status !== 'active'}
                  title={service.status !== 'active' ? `Server ${service.status} — aktifkan server terlebih dahulu` : 'Ganti egg server'}
                  className={`btn btn-sm flex items-center gap-2 border-dashed ${
                    service.status !== 'active' ? 'btn-outline opacity-40 cursor-not-allowed' : 'btn-outline'
                  }`}
                >
                  <Server size={14} />
                  Change Server Egg
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Egg Change Modal */}
      {showEggModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="card max-w-2xl w-full p-0 shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-text-primary tracking-tight">Change Server Egg</h2>
                <p className="text-xs text-text-muted mt-1 font-medium">Pilih software atau sistem operasi baru untuk server Anda.</p>
              </div>
              <button
                onClick={() => setShowEggModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
              {/* Step 1: Select Nest */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black">1</div>
                  <label className="text-xs font-black uppercase text-text-muted tracking-widest">Select Category (Nest)</label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {nests.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNestChange(n.id)}
                      className={`p-4 rounded-2xl border text-left transition-all group ${
                        String(selectedNest) === String(n.id)
                          ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className={`text-sm font-bold block ${String(selectedNest) === String(n.id) ? 'text-blue-400' : 'text-text-primary group-hover:text-blue-400'}`}>
                        {n.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Egg */}
              {selectedNest && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black">2</div>
                    <label className="text-xs font-black uppercase text-text-muted tracking-widest">Select Software (Egg)</label>
                  </div>
                  
                  <div className="grid gap-3">
                    {eggs.length > 0 ? (
                      eggs.map(e => {
                        const isSelected = String(selectedEgg) === String(e.id);
                        return (
                          <button
                            key={e.id}
                            onClick={() => handleEggSelect(e.id)}
                            className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
                              isSelected
                                ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-blue-500 animate-pulse' : 'bg-white/10'}`} />
                            <div className="space-y-1">
                              <span className={`text-sm font-bold block ${isSelected ? 'text-blue-400' : 'text-text-primary'}`}>
                                {e.name}
                              </span>
                              {e.description && (
                                <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2">
                                  {e.description}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <p className="text-sm text-text-muted">Loading eggs...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Logic Warnings */}
              <div className="space-y-3">
                {/* RAM warning for Minecraft Java */}
                {selectedEgg && isMinecraftJavaEgg() && (
                  <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    ramBlocked
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-green-500/10 border-green-500/30 text-green-400'
                  }`}>
                    <span className="text-xl">{ramBlocked ? '⚠️' : '✅'}</span>
                    <p className="text-xs font-bold leading-relaxed">
                      {ramBlocked
                        ? `Minecraft Java memerlukan minimal 2GB RAM. Paket Anda hanya ${(ramMB_plan / 1024).toFixed(1)}GB.`
                        : `RAM ${(ramMB_plan / 1024).toFixed(1)}GB mencukupi untuk Minecraft Java.`
                      }
                    </p>
                  </div>
                )}

                {selectedEgg && !isMinecraftJavaEgg() && (
                  <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/30 text-blue-400 flex items-center gap-4">
                    <span className="text-xl">ℹ️</span>
                    <p className="text-xs font-bold leading-relaxed">
                      Server akan di-reinstall otomatis. Data lama tidak akan terhapus namun disarankan backup terlebih dahulu.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex gap-3">
              <button
                onClick={() => setShowEggModal(false)}
                className="btn btn-outline flex-1 font-bold py-3"
              >
                Batal
              </button>
              <button
                onClick={handleChangeEgg}
                disabled={isChangingEgg || !selectedEgg || ramBlocked}
                className={`btn flex-[2] font-black tracking-wide py-3 ${
                  ramBlocked ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                }`}
              >
                {isChangingEgg ? 'Processing...' : ramBlocked ? 'RAM Tidak Cukup' : 'Simpan Perubahan'}
              </button>
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
