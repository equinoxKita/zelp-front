import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Key, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { useBranding } from '../context/BrandingContext';
import { Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const turnstileRef = useRef(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState(null);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const { branding_name, branding_logo } = useBranding();

  useEffect(() => {
    api.get('/settings/public').then((s) => {
      setTurnstileEnabled(s.turnstile_enabled);
      if (s.turnstile_site_key) setTurnstileSiteKey(s.turnstile_site_key);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!turnstileEnabled || !turnstileSiteKey || !window.turnstile || !turnstileRef.current) return;
    window.turnstile.render(turnstileRef.current, {
      sitekey: turnstileSiteKey,
      theme: 'dark',
    });
  }, [turnstileEnabled, turnstileSiteKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const turnstile_token = turnstileEnabled ? document.querySelector('[name="cf-turnstile-response"]')?.value : 'OMITTED';
      if (turnstileEnabled && !turnstile_token) {
        showToast('Silakan selesaikan captcha (Turnstile).', 'error');
        setLoading(false);
        return;
      }

      const data = await api.post('/auth/login', {
        email,
        password,
        turnstile_token,
        ...(requires2FA && { code: code2FA }),
      });

      if (data.requires_2fa) {
        setRequires2FA(true);
        showToast('Silakan masukkan kode 2FA kamu', 'info');
        setLoading(false);
        return;
      }

      login(data.token, data.refreshToken, data.user);
      showToast('Login berhasil!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-16">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-text-primary no-underline mb-6">
            <img src={branding_logo} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-black tracking-tight">{branding_name}</span>
          </Link>
        </div>

        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-accent-primary" />
            </div>
            <h1 className="text-2xl font-black text-text-primary">Welcome Back</h1>
            <p className="text-text-secondary mt-1 text-sm">Masuk ke akun {branding_name} Billing kamu</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label flex items-center gap-1"><Mail size={12} /> Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label flex items-center gap-1"><Key size={12} /> Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {requires2FA && (
              <div className="form-group animate-in">
                <label className="form-label flex items-center gap-1"><ShieldCheck size={12} /> 2FA Code</label>
                <input
                  type="text"
                  className="form-input text-center text-xl tracking-[0.3em] font-bold"
                  placeholder="000000"
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value)}
                  maxLength={6}
                />
              </div>
            )}

            {turnstileEnabled && turnstileSiteKey && (
              <div className="flex justify-center my-4">
                <div ref={turnstileRef} />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block btn-lg mt-2"
            >
              {loading ? (
                <><span className="spinner" /> Logging in...</>
              ) : (
                <><LogIn size={18} /> {requires2FA ? 'Verifikasi & Masuk' : 'Masuk'}</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary space-y-2">
            <p>
              Belum punya akun?{' '}
              <Link to="/register" className="text-accent-primary font-bold hover:underline">
                Daftar di sini
              </Link>
            </p>
            <ForgotPasswordLink />
          </div>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordLink() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-text-muted text-xs hover:text-text-secondary transition-colors"
      >
        Lupa Password?
      </button>
      {open && <ForgotPasswordModal onClose={() => setOpen(false)} />}
    </>
  );
}

function ForgotPasswordModal({ onClose }) {
  const showToast = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);

  const sendPin = async (e) => {
    e.preventDefault();
    if (!email) return showToast('Email wajib diisi', 'error');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      showToast('PIN reset telah dikirim ke email kamu', 'success');
      setExpiresAt(Date.now() + 15 * 60 * 1000);
      setStep(2);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!pin || !newPassword || !confirmPassword) return showToast('Semua field wajib diisi', 'error');
    if (pin.length !== 6) return showToast('PIN harus 6 karakter', 'error');
    if (newPassword !== confirmPassword) return showToast('Password tidak cocok', 'error');
    if (newPassword.length < 8) return showToast('Password minimal 8 karakter', 'error');
    setLoading(true);
    try {
      const data = await api.post('/auth/reset-password', { email, pin: pin.toUpperCase(), newPassword });
      showToast(data.message, 'success');
      setTimeout(onClose, 1500);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title"><Key size={18} /> Lupa Password</h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm !px-2 !py-1">✕</button>
        </div>
        {step === 1 ? (
          <form onSubmit={sendPin} className="space-y-4">
            <p className="text-text-secondary text-sm">Masukkan email kamu untuk mendapatkan PIN reset password.</p>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-block">
              {loading ? <><span className="spinner" /> Mengirim...</> : 'Kirim PIN Reset'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <p className="text-text-secondary text-sm">PIN telah dikirim ke <strong className="text-text-primary">{email}</strong>. Cek folder Spam jika tidak ada.</p>
            <div className="form-group">
              <label className="form-label">PIN Reset (6 Karakter)</label>
              <input type="text" className="form-input text-center tracking-widest font-bold font-mono" value={pin} onChange={(e) => setPin(e.target.value.toUpperCase())} maxLength={6} placeholder="A1B2C3" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} placeholder="Min 8 karakter" required />
            </div>
            <div className="form-group">
              <label className="form-label">Konfirmasi Password</label>
              <input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} placeholder="Ulangi password" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-block">
              {loading ? <><span className="spinner" /> Memperbarui...</> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
