import { useEffect, useState } from 'react';
import { CheckCircle, Play } from 'lucide-react';
import api from '../../../services/api';
import { formatNumber } from '../../../utils/helpers';
import { useToast } from '../../../context/ToastContext';

export default function Confirmation() {
  const showToast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provisionModal, setProvisionModal] = useState(null);
  const [uuid, setUuid] = useState('');
  const [provisioning, setProvisioning] = useState(false);

  const load = () => {
    api.get('/admin/orders/pending-setup')
      .then(d => setOrders(d.orders || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const provision = async (e) => {
    e.preventDefault();
    if (!uuid.trim()) return showToast('UUID wajib diisi!', 'error');
    setProvisioning(true);
    try {
      const data = await api.post(`/admin/orders/${provisionModal.id}/provision`, { server_uuid: uuid });
      showToast(data.message, 'success');
      setProvisionModal(null);
      setUuid('');
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setProvisioning(false); }
  };

  if (loading) return <div className="animate-pulse bg-bg-card h-48 rounded-3xl" />;

  return (
    <>
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#14b8a6]/10 text-[#14b8a6] flex items-center justify-center"><CheckCircle size={18} /></div>
          <div>
            <div className="font-black text-text-primary">Manual Verification Queue</div>
            <div className="text-xs text-text-muted uppercase font-bold">{orders.length} pending</div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-5xl mb-4">☕</div>
            <h3 className="font-black text-text-primary text-lg mb-1">Queue is Clear</h3>
            <p className="text-text-muted text-sm">No orders require manual verification.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr className="bg-white/[0.02]">
                  {['ID', 'Requester', 'Plan', 'Server Name', 'Value', 'Action'].map((h, i) => (
                    <th key={h} className={`px-${i === 0 || i === 5 ? '6' : '4'} py-4 border-b-2 border-white/5 text-xs text-text-muted font-black uppercase ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 border-b border-white/5 font-black text-text-primary font-mono">#{o.id}</td>
                    <td className="px-4 py-4 border-b border-white/5">
                      <div className="font-bold text-text-primary">{o.user_name}</div>
                      <div className="text-xs text-text-muted">{o.user_email}</div>
                    </td>
                    <td className="px-4 py-4 border-b border-white/5">
                      <span className="bg-accent-primary/10 text-accent-primary border border-accent-primary/20 px-2 py-1 rounded-lg text-xs font-black">{o.plan_name}</span>
                    </td>
                    <td className="px-4 py-4 border-b border-white/5 font-bold text-text-primary">{o.server_name}</td>
                    <td className="px-4 py-4 border-b border-white/5 font-black text-text-primary">Rp {formatNumber(o.total_price)}</td>
                    <td className="px-6 py-4 border-b border-white/5 text-right">
                      <button onClick={() => { setProvisionModal(o); setUuid(''); }}
                        className="btn btn-primary px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ml-auto">
                        <Play size={13} /> INITIALIZE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {provisionModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setProvisionModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title"><Play size={16} /> Manual Provisioning #{provisionModal.id}</h3>
              <button onClick={() => setProvisionModal(null)} className="btn btn-secondary btn-sm !px-2">✕</button>
            </div>
            <p className="text-text-secondary text-sm mb-4">Masukkan <strong>Server UUID</strong> dari Pterodactyl untuk menghubungkan service ini.</p>
            <form onSubmit={provision} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Server UUID</label>
                <input type="text" className="form-input" value={uuid} onChange={e => setUuid(e.target.value)}
                  placeholder="550e8400-e29b-41d4-a716-446655440000" required />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setProvisionModal(null)} className="btn btn-secondary">Batal</button>
                <button type="submit" disabled={provisioning} className="btn btn-primary">
                  {provisioning ? <><span className="spinner" /> Processing...</> : 'Konfirmasi & Aktifkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
