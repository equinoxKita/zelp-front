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
