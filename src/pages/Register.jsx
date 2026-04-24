import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, User, Mail, Key, ShieldCheck, UserPlus, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { useBranding } from '../context/BrandingContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const showToast = useToast();
  const { branding_name, branding_logo } = useBranding();
  const navigate = useNavigate();
  const turnstileRef = useRef(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState(null);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);

  useEffect(() => {
    api.get('/settings/public').then((s) => {
      setTurnstileEnabled(s.turnstile_enabled);
      if (s.turnstile_site_key) setTurnstileSiteKey(s.turnstile_site_key);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!turnstileSiteKey || !window.turnstile || !turnstileRef.current) return;
    window.turnstile.render(turnstileRef.current, {
      sitekey: turnstileSiteKey,
      theme: 'dark',
    });
  }, [turnstileSiteKey]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Password tidak cocok!');
      return;
    }
    const turnstile_token = turnstileEnabled ? document.querySelector('[name="cf-turnstile-response"]')?.value : 'OMITTED';
    if (turnstileEnabled && !turnstile_token) {
      setError('Silakan selesaikan captcha (Turnstile).');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        turnstile_token,
      });
      login(data.token, data.user);
      showToast('Registrasi berhasil! Selamat datang', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      if (window.turnstile) window.turnstile.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-16">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-text-primary no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow">
              {branding_logo ? (
                <img src={branding_logo} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <Zap size={20} className="text-white" />
              )}
            </div>
            <span className="text-2xl font-black tracking-tight">{branding_name}</span>
          </Link>
        </div>

        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto mb-4">
              <Rocket size={28} className="text-accent-primary" />
            </div>
            <h1 className="text-2xl font-black text-text-primary">Create Account</h1>
            <p className="text-text-secondary mt-1 text-sm">Buat akun untuk mulai memesan server</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label flex items-center gap-1"><User size={12} /> Nama Lengkap</label>
              <input type="text" name="name" className="form-input" placeholder="Nama kamu" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label flex items-center gap-1"><Mail size={12} /> Email</label>
              <input type="email" name="email" className="form-input" placeholder="email@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label flex items-center gap-1"><Key size={12} /> Password</label>
              <input type="password" name="password" className="form-input" placeholder="Minimal 6 karakter" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label flex items-center gap-1"><ShieldCheck size={12} /> Konfirmasi Password</label>
              <input type="password" name="confirm" className="form-input" placeholder="Ulangi password" value={form.confirm} onChange={handleChange} required />
            </div>

            {turnstileEnabled && turnstileSiteKey && (
              <div className="flex justify-center my-4">
                <div ref={turnstileRef} />
              </div>
            )}

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg mt-2">
              {loading ? <><span className="spinner" /> Memproses...</> : <><UserPlus size={18} /> Daftar Sekarang</>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-accent-primary font-bold hover:underline">Login di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
