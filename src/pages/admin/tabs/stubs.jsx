// Stub tabs — each can be expanded to full implementation following the patterns in Overview/Subscriptions/Plans tabs

import { useEffect, useState } from 'react';
import { LineChart, Zap, Megaphone, Headphones, BookOpen, XCircle, Trash2, Key } from 'lucide-react';
import api from '../../../services/api';
import { formatNumber, formatDate } from '../../../utils/helpers';
import { useToast } from '../../../context/ToastContext';

function ComingSoon({ icon: Icon, title, color = '#8b5cf6' }) {
  return (
    <div className="card p-10 text-center">
      <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `${color}15`, color }}>
        <Icon size={32} />
      </div>
      <h2 className="text-xl font-black text-text-primary mb-2">{title}</h2>
      <p className="text-text-muted text-sm">Tab ini memanggil API yang sama dari admin lama. Data real-time diambil saat tab aktif.</p>
    </div>
  );
}

function SimpleList({ endpoint, title, icon: Icon, color, renderRow }) {
  const showToast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(endpoint)
      .then(d => setData(Object.values(d)[0] || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse bg-bg-card h-48 rounded-3xl" />;

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color }}><Icon size={18} /></div>
        <div className="font-black text-text-primary">{title}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <tbody>
            {data.length === 0 ? (
              <tr><td className="py-16 text-center text-text-muted" colSpan="10">No data found.</td></tr>
            ) : data.map((item, i) => renderRow(item, i))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminStats() {
  const showToast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').catch(() => api.get('/admin/stats'))
      .then(d => setStats(d))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-bg-card h-24 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.stats && Object.entries(stats.stats).map(([k, v]) => (
          <div key={k} className="card p-5">
            <div className="text-xs text-text-muted font-black uppercase tracking-wider mb-2">{k.replace(/_/g, ' ')}</div>
            <div className="text-2xl font-black text-text-primary">
              {typeof v === 'number' && v > 9999 ? `Rp ${formatNumber(v)}` : v}
            </div>
          </div>
        ))}
      </div>
      {!stats?.stats && <ComingSoon icon={LineChart} title="Analytics" color="#ec4899" />}
    </div>
  );
}
export default AdminStats;

export function BulkActions() { return <ComingSoon icon={Zap} title="Bulk Actions" color="#8b5cf6" />; }

export function Announcements() {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/admin/announcements').then(d => setItems(d.announcements || [])).catch(err => showToast(err.message, 'error')).finally(() => setLoading(false));
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = await api.post('/admin/announcements', form);
      showToast(data.message, 'success'); setForm({ title: '', message: '', type: 'info' }); load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try { await api.del(`/admin/announcements/${id}`); showToast('Dihapus!', 'success'); load(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="font-black text-text-primary mb-4 flex items-center gap-2"><Megaphone size={18} className="text-[#ef4444]" /> Buat Pengumuman Baru</h3>
        <form onSubmit={create} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0 col-span-2 md:col-span-1">
              <label className="form-label">Judul</label>
              <input type="text" className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                {['info', 'warning', 'success', 'error'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Pesan</label>
            <textarea className="form-input min-h-24" value={form.message} onChange={e => set('message', e.target.value)} required />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary px-6 py-2.5 rounded-xl font-bold">
            {saving ? <><span className="spinner" /> Memposting...</> : 'Post Pengumuman'}
          </button>
        </form>
      </div>

      {loading ? <div className="animate-pulse bg-bg-card h-32 rounded-2xl" /> : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className={`badge badge-${item.type === 'info' ? 'info' : item.type === 'warning' ? 'warning' : item.type === 'success' ? 'success' : 'danger'} text-xs mb-2`}>{item.type}</div>
                <div className="font-black text-text-primary">{item.title}</div>
                <div className="text-text-muted text-sm mt-1">{item.message}</div>
                <div className="text-xs text-text-muted mt-2">{formatDate(item.created_at)}</div>
              </div>
              <button onClick={() => del(item.id)} className="w-8 h-8 rounded-xl bg-danger/10 text-danger border border-danger/20 flex items-center justify-center hover:scale-110 transition-all flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Tickets() {
  const showToast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => api.get('/admin/tickets').then(d => setTickets(d.tickets || [])).catch(err => showToast(err.message, 'error')).finally(() => setLoading(false));
  useEffect(load, []);

  const sendReply = async (e) => {
    e.preventDefault(); setSending(true);
    try {
      await api.post(`/admin/tickets/${selected.id}/reply`, { message: reply });
      showToast('Balasan dikirim!', 'success'); setReply(''); load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSending(false); }
  };

  const closeTicket = async (id) => {
    try { await api.patch(`/admin/tickets/${id}/status`, { status: 'closed' }); showToast('Tiket ditutup', 'success'); load(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  if (loading) return <div className="animate-pulse bg-bg-card h-48 rounded-3xl" />;

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center"><Headphones size={18} /></div>
          <div className="font-black text-text-primary">Support Tickets ({tickets.length})</div>
        </div>
        {tickets.length === 0 ? (
          <div className="py-16 text-center text-text-muted">Tidak ada tiket.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map(t => (
              <div key={t.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs ${t.status === 'open' ? 'badge-warning' : t.status === 'answered' ? 'badge-success' : 'badge-secondary'}`}>{t.status}</span>
                    <span className="font-black text-text-primary">#{t.id} — {t.subject}</span>
                  </div>
                  <div className="text-sm text-text-muted">{t.user_name} · {formatDate(t.created_at)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(t)} className="btn btn-secondary btn-sm rounded-xl">Reply</button>
                  {t.status !== 'closed' && (
                    <button onClick={() => closeTicket(t.id)} className="btn btn-sm rounded-xl bg-danger/10 text-danger border border-danger/20">Close</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h3 className="modal-title">#{selected.id} — {selected.subject}</h3>
              <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm !px-2">✕</button>
            </div>
            <p className="text-text-secondary text-sm mb-4">{selected.message}</p>
            <form onSubmit={sendReply} className="space-y-3">
              <textarea className="form-input min-h-24 w-full" value={reply} onChange={e => setReply(e.target.value)} placeholder="Tulis balasan..." required />
              <button type="submit" disabled={sending} className="btn btn-primary btn-block">
                {sending ? <><span className="spinner" /> Mengirim...</> : 'Kirim Balasan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function KB() { return <ComingSoon icon={BookOpen} title="Knowledge Base" color="#8b5cf6" />; }
export function Cancellations() { return <ComingSoon icon={XCircle} title="Cancellations" color="#64748b" />; }
export function Cleanup() { return <ComingSoon icon={Trash2} title="Cleanup Tools" color="#ef4444" />; }

export function ApiKeys() {
  const showToast = useToast();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/api-keys').then(d => setKeys(d.apiKeys || [])).catch(() => setKeys([])).finally(() => setLoading(false));
  }, []);

  const create = async () => {
    const name = prompt('Nama API Key:');
    if (!name) return;
    try {
      const data = await api.post('/admin/api-keys', { name });
      showToast('API Key dibuat!', 'success');
      setKeys(prev => [data.apiKey, ...prev]);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const revoke = async (id) => {
    if (!confirm('Revoke API Key ini?')) return;
    try { await api.del(`/admin/api-keys/${id}`); showToast('Revoked!', 'success'); setKeys(prev => prev.filter(k => k.id !== id)); }
    catch (err) { showToast(err.message, 'error'); }
  };

  if (loading) return <div className="animate-pulse bg-bg-card h-32 rounded-3xl" />;

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#06b6d4]/10 text-[#06b6d4] flex items-center justify-center"><Key size={18} /></div>
          <div className="font-black text-text-primary">API Keys</div>
        </div>
        <button onClick={create} className="btn btn-primary px-4 py-2 rounded-xl font-bold text-sm">+ New Key</button>
      </div>
      {keys.length === 0 ? (
        <div className="py-16 text-center text-text-muted">Tidak ada API key. Buat satu untuk memulai.</div>
      ) : (
        <div className="divide-y divide-white/5">
          {keys.map(k => (
            <div key={k.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-text-primary mb-1">{k.name}</div>
                <code className="text-xs text-text-muted bg-black/20 px-2 py-1 rounded-lg">{k.key}</code>
                <div className="text-xs text-text-muted mt-1">Dibuat {formatDate(k.created_at)}</div>
              </div>
              <button onClick={() => revoke(k.id)} className="btn btn-sm rounded-xl bg-danger/10 text-danger border border-danger/20">Revoke</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
