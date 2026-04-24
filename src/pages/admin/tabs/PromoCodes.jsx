import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { formatNumber, formatDate } from '../../../utils/helpers';
import { useToast } from '../../../context/ToastContext';
import { Ticket, Plus, Trash2 } from 'lucide-react';

export default function PromoCodes() {
  const showToast = useToast();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', expires_at: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/admin/promo-codes').then(d => setPromos(d.promoCodes || [])).catch(err => showToast(err.message, 'error')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const deleteCode = async (id) => {
    if (!confirm('Hapus promo code ini?')) return;
    try { await api.del(`/admin/promo-codes/${id}`); showToast('Promo dihapus!', 'success'); load(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  const create = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = await api.post('/admin/promo-codes', { ...form, discount_value: parseFloat(form.discount_value), max_uses: form.max_uses ? parseInt(form.max_uses) : null });
      showToast(data.message, 'success'); setShowCreate(false); setForm({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', expires_at: '' }); load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="animate-pulse bg-bg-card h-48 rounded-3xl" />;

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center"><Ticket size={18} /></div>
          <div>
            <div className="font-black text-text-primary">Marketing Assets</div>
            <div className="text-xs text-text-muted uppercase font-bold">{promos.length} active promo codes</div>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary px-4 py-2 font-bold flex items-center gap-2 rounded-xl">
          <Plus size={16} /> New Promo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr className="bg-white/[0.02]">
              {['ID', 'Code', 'Value', 'Usage', 'Expires', 'Action'].map((h, i) => (
                <th key={h} className={`px-${i === 0 || i === 5 ? '6' : '4'} py-4 border-b-2 border-white/5 text-xs text-text-muted font-black uppercase ${i === 5 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 border-b border-white/5 text-text-primary font-black font-mono">#{p.id}</td>
                <td className="px-4 py-4 border-b border-white/5">
                  <code className="bg-accent-primary/10 text-accent-primary border border-accent-primary/20 px-3 py-1.5 rounded-lg font-black tracking-widest">{p.code}</code>
                </td>
                <td className="px-4 py-4 border-b border-white/5 font-black text-text-primary text-lg">
                  {p.discount_type === 'percentage' ? `${p.discount_value}%` : `Rp ${formatNumber(p.discount_value)}`}
                </td>
                <td className="px-4 py-4 border-b border-white/5 font-bold text-text-primary">
                  {p.used_count} <span className="text-text-muted">/ {p.max_uses || '∞'}</span>
                </td>
                <td className="px-4 py-4 border-b border-white/5 font-semibold">
                  {p.expires_at ? <span className="text-text-primary">{formatDate(p.expires_at)}</span> : <span className="text-success font-black">PERMANENT</span>}
                </td>
                <td className="px-6 py-4 border-b border-white/5 text-right">
                  <button onClick={() => deleteCode(p.id)} className="w-9 h-9 rounded-xl bg-danger/10 text-danger border border-danger/20 flex items-center justify-center hover:scale-110 transition-all ml-auto">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title"><Ticket size={16} /> Buat Promo Code</h3>
              <button onClick={() => setShowCreate(false)} className="btn btn-secondary btn-sm !px-2">✕</button>
            </div>
            <form onSubmit={create} className="space-y-4">
              <div className="form-group"><label className="form-label">Code</label>
                <input type="text" className="form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0"><label className="form-label">Type</label>
                  <select className="form-input" value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (Rp)</option>
                  </select></div>
                <div className="form-group mb-0"><label className="form-label">Value</label>
                  <input type="number" className="form-input" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0"><label className="form-label">Max Uses (kosongkan = ∞)</label>
                  <input type="number" className="form-input" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} /></div>
                <div className="form-group mb-0"><label className="form-label">Expiry (kosongkan = permanent)</label>
                  <input type="date" className="form-input" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
              </div>
              <button type="submit" disabled={saving} className="btn btn-primary btn-block">
                {saving ? <><span className="spinner" /> Membuat...</> : 'Buat Promo Code'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
