import { useState, useEffect } from 'react';
import { User, Mail, Key, ShieldCheck, Smartphone, Save, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { formatNumber } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const showToast = useToast();
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [twoFA, setTwoFA] = useState({ enabled: false, qr: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '' });
      setTwoFA((prev) => ({ ...prev, enabled: !!user.two_fa_enabled }));
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.patch('/user/profile', { name: profile.name });
      if (data.user) updateUser(data.user);
      showToast('Profil berhasil diperbarui', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return showToast('Password tidak cocok', 'error');
    if (passwords.newPass.length < 8) return showToast('Password minimal 8 karakter', 'error');
    setPwLoading(true);
    try {
      const data = await api.post('/user/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      showToast(data.message || 'Password berhasil diperbarui', 'success');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-in max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent-gradient flex items-center justify-center text-white shadow-glow font-black text-xl">
          {user?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">{user?.name}</h1>
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <span>Rp {formatNumber(user?.balance)}</span>
            {user?.role === 'admin' && <span className="badge badge-info">Admin</span>}
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card p-6 space-y-5">
        <h2 className="text-lg font-black text-text-primary flex items-center gap-2"><User size={18} /> Edit Profil</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input type="text" className="form-input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label flex items-center gap-1"><Mail size={12} /> Email</label>
            <input type="email" className="form-input opacity-60 cursor-not-allowed" value={profile.email} readOnly />
            <p className="text-xs text-text-muted mt-1">Email tidak dapat diubah.</p>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary px-5 py-2.5 rounded-xl font-black">
            {loading ? <><span className="spinner" /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6 space-y-5">
        <h2 className="text-lg font-black text-text-primary flex items-center gap-2"><Key size={18} /> Ubah Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Password Saat Ini</label>
            <input type="password" className="form-input" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password Baru</label>
            <input type="password" className="form-input" value={passwords.newPass} onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))} minLength={8} required />
          </div>
          <div className="form-group">
            <label className="form-label">Konfirmasi Password Baru</label>
            <input type="password" className="form-input" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} minLength={8} required />
          </div>
          <button type="submit" disabled={pwLoading} className="btn btn-primary px-5 py-2.5 rounded-xl font-black">
            {pwLoading ? <><span className="spinner" /> Memperbarui...</> : <><ShieldCheck size={15} /> Ubah Password</>}
          </button>
        </form>
      </div>

      {/* 2FA */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-black text-text-primary flex items-center gap-2"><Smartphone size={18} /> Two-Factor Authentication</h2>
        <p className="text-text-muted text-sm">Tambahkan lapisan keamanan ekstra ke akun Anda dengan 2FA.</p>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${twoFA.enabled ? 'bg-success/10 border-success/30 text-success' : 'bg-white/[0.02] border-white/10 text-text-muted'}`}>
          {twoFA.enabled ? '✅ 2FA Aktif' : '⚠️ 2FA Belum Aktif'}
        </div>
        {/* Full 2FA management would be a more complex subcomponent */}
      </div>
    </div>
  );
}
