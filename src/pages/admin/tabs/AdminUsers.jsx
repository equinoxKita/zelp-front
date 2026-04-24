import { useEffect, useState } from 'react';
import { Users, Search, LogIn, Key, Plus, FileText, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import api from '../../../services/api';
import { formatNumber, formatDate } from '../../../utils/helpers';
import { useToast } from '../../../context/ToastContext';

export default function AdminUsers() {
  const showToast = useToast();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type, user }
  const PER_PAGE = 25;

  const load = () => {
    api.get('/admin/users')
      .then(d => setAll(d.users || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = all.filter(u => {
    const q = search.toLowerCase();
    const match = !q || String(u.id).includes(q) || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return match && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageData = filtered.slice(start, start + PER_PAGE);

  const updateRole = async (userId, role) => {
    if (!confirm(`Ubah role user ini menjadi ${role.toUpperCase()}?`)) { load(); return; }
    try {
      const data = await api.patch(`/admin/users/${userId}/role`, { role });
      showToast(data.message, 'success');
      setAll(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) { showToast(err.message, 'error'); load(); }
  };

  const impersonate = async (user) => {
    if (!confirm(`Login sebagai "${user.name}"?`)) return;
    try {
      const adminToken = api.getToken();
      const adminUser = api.getUser();
      localStorage.setItem('_admin_token', adminToken);
      localStorage.setItem('_admin_user', JSON.stringify(adminUser));
      const data = await api.post(`/admin/users/${user.id}/impersonate`);
      api.setToken(data.token);
      api.setUser(data.user);
      showToast(`Login sebagai ${data.user.name}`, 'success');
      window.location.href = '/dashboard';
    } catch (err) { showToast(err.message, 'error'); }
  };

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-bg-card h-16 rounded-2xl" />)}</div>;

  return (
    <>
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center"><Users size={18} /></div>
          <div>
            <div className="font-black text-text-primary">Identity Directory</div>
            <div className="text-xs text-text-muted uppercase font-bold">Showing {filtered.length} of {all.length} users</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="px-6 py-4 border-b border-white/5 flex flex-wrap gap-3 bg-white/[0.01]">
          <div className="relative flex-1 min-w-52">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" className="form-input pl-10 h-11 bg-black/20" placeholder="Search by ID, name, email..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-input h-11 w-auto bg-black/20 font-bold"
            value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="user">Standard User</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-text-muted">No users found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-white/[0.02]">
                    {['ID', 'Profile', 'Role', 'Balance', 'Joined', 'Controls'].map((h, i) => (
                      <th key={h} className={`px-${i === 0 || i === 5 ? '6' : '4'} py-4 border-b-2 border-white/5 text-xs font-black text-text-muted uppercase ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 border-b border-white/5 font-black text-text-primary font-mono">#{u.id}</td>
                      <td className="px-4 py-4 border-b border-white/5">
                        <div className="font-bold text-text-primary">{u.name}</div>
                        <div className="text-xs text-text-muted">{u.email}</div>
                      </td>
                      <td className="px-4 py-4 border-b border-white/5">
                        <span className={`badge text-xs font-black uppercase ${u.role === 'admin' ? 'badge-info' : 'badge-secondary'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-4 border-b border-white/5 font-black text-success">Rp {formatNumber(u.balance)}</td>
                      <td className="px-4 py-4 border-b border-white/5 text-sm text-text-muted">{formatDate(u.created_at)}</td>
                      <td className="px-6 py-4 border-b border-white/5">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <select className="form-input h-9 py-0 text-xs font-bold w-24 bg-white/5"
                            defaultValue={u.role}
                            onChange={e => updateRole(u.id, e.target.value)}>
                            <option value="user">USER</option>
                            <option value="admin">ADMIN</option>
                          </select>
                          <ActionBtn color="#22c55e" title="Impersonate" onClick={() => impersonate(u)}><LogIn size={15} /></ActionBtn>
                          <ActionBtn color="#42C8F5" title="Change Password" onClick={() => setModal({ type: 'password', user: u })}><Key size={15} /></ActionBtn>
                          <ActionBtn color="#AEEA00" title="Add Balance" onClick={() => setModal({ type: 'balance', user: u })}><Plus size={15} /></ActionBtn>
                          <ActionBtn color="#42C8F5" title="Create Invoice" onClick={() => setModal({ type: 'invoice', user: u })}><FileText size={15} /></ActionBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01] flex-wrap gap-4">
              <span className="text-sm text-text-muted">Showing <strong className="text-text-primary">{start + 1}–{Math.min(start + PER_PAGE, filtered.length)}</strong> of <strong className="text-text-primary">{filtered.length}</strong></span>
              <div className="flex gap-2">
                <PagBtn onClick={() => setPage(1)} disabled={safePage <= 1}><ChevronsLeft size={16} /></PagBtn>
                <PagBtn onClick={() => setPage(p => p - 1)} disabled={safePage <= 1}><ChevronLeft size={14} /> PREV</PagBtn>
                <div className="px-4 h-9 flex items-center bg-white/5 border border-white/10 rounded-xl font-black text-sm">{safePage} / {totalPages}</div>
                <PagBtn onClick={() => setPage(p => p + 1)} disabled={safePage >= totalPages}>NEXT <ChevronRight size={14} /></PagBtn>
                <PagBtn onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}><ChevronsRight size={16} /></PagBtn>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'password' && <ChangePasswordModal user={modal.user} onClose={() => setModal(null)} showToast={showToast} />}
      {modal?.type === 'balance' && <AddBalanceModal user={modal.user} onClose={() => { setModal(null); load(); }} showToast={showToast} />}
      {modal?.type === 'invoice' && <CreateInvoiceModal user={modal.user} onClose={() => setModal(null)} showToast={showToast} />}
    </>
  );
}

function ActionBtn({ children, color, title, onClick }) {
  return (
    <button onClick={onClick} title={title}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 border"
      style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
      {children}
    </button>
  );
}

function PagBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="btn btn-secondary h-9 px-3 text-sm font-bold rounded-xl flex items-center gap-1 disabled:opacity-40">
      {children}
    </button>
  );
}

function ChangePasswordModal({ user, onClose, showToast }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw !== confirm) return showToast('Password tidak cocok!', 'error');
    setLoading(true);
    try {
      const data = await api.patch(`/admin/users/${user.id}/password`, { password: pw });
      showToast(data.message, 'success');
      onClose();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3 className="modal-title"><Key size={16} /> Ubah Password</h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm !px-2">✕</button>
        </div>
        <p className="text-text-secondary text-sm mb-4">User: <strong className="text-text-primary">{user.name}</strong></p>
        <form onSubmit={submit} className="space-y-4">
          <div className="form-group"><label className="form-label">Password Baru</label>
            <input type="password" className="form-input" value={pw} onChange={e => setPw(e.target.value)} minLength={6} required /></div>
          <div className="form-group"><label className="form-label">Konfirmasi</label>
            <input type="password" className="form-input" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? <><span className="spinner" /> Menyimpan...</> : 'Simpan Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddBalanceModal({ user, onClose, showToast }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.patch(`/admin/users/${user.id}/balance`, { amount: parseInt(amount) });
      showToast(data.message, 'success');
      onClose();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3 className="modal-title"><Plus size={16} /> Tambah Saldo</h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm !px-2">✕</button>
        </div>
        <p className="text-text-secondary text-sm mb-4">User: <strong className="text-text-primary">{user.name}</strong></p>
        <form onSubmit={submit} className="space-y-4">
          <div className="form-group"><label className="form-label">Jumlah (Rp)</label>
            <input type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} min={1000} required /></div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? <><span className="spinner" /> Memproses...</> : 'Tambah Saldo'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ user, onClose, showToast }) {
  const [form, setForm] = useState({ amount: '', description: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/admin/invoices/create', { user_id: user.id, amount: parseInt(form.amount), description: form.description });
      showToast(data.message, 'success');
      onClose();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3 className="modal-title"><FileText size={16} /> Buat Invoice Manual</h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm !px-2">✕</button>
        </div>
        <p className="text-text-secondary text-sm mb-4">User: <strong className="text-text-primary">{user.name}</strong></p>
        <form onSubmit={submit} className="space-y-4">
          <div className="form-group"><label className="form-label">Nominal (Rp)</label>
            <input type="number" className="form-input" value={form.amount} onChange={e => set('amount', e.target.value)} min={1000} required /></div>
          <div className="form-group"><label className="form-label">Keterangan</label>
            <input type="text" className="form-input" value={form.description} onChange={e => set('description', e.target.value)} required /></div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? <><span className="spinner" /> Membuat...</> : 'Buat Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
}
