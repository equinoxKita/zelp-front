import { useState, useEffect } from 'react';
import {
  Save, Shield, CreditCard, Zap, Globe, Lock, Key,
  CheckCircle2, AlertCircle, Loader2, ExternalLink, Settings as SettingsIcon,
  ToggleLeft, ToggleRight, Layout, Palette, Mail
} from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useBranding } from '../../../context/BrandingContext';

const Section = ({ title, icon: Icon, children, color = 'accent-primary' }) => (
  <div className="card overflow-hidden">
    <div className={`p-4 border-b border-white/5 bg-${color}/5 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center text-${color}`}>
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-black text-text-primary">{title}</h3>
    </div>
    <div className="p-6 space-y-6">
      {children}
    </div>
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
    <div>
      <div className="text-sm font-bold text-text-primary">{label}</div>
      <div className="text-xs text-text-muted mt-0.5">{value === 'on' ? 'Aktif' : 'Nonaktif'}</div>
    </div>
    <button
      type="button"
      onClick={() => onChange(value === 'on' ? 'off' : 'on')}
      className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${
        value === 'on' ? 'bg-success shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white/10'
      }`}
    >
      <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
        value === 'on' ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  </div>
);

const ImageUpload = ({ label, value, onUpload, type }) => {
  const [uploading, setUploading] = useState(false);
  const showToast = useToast();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      setUploading(true);
      const res = await api.post('/settings/upload-branding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpload(res.url);
      showToast(`${label} berhasil diunggah!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="flex items-center gap-4 mt-2">
        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain" />
          ) : (
            <div className="text-text-muted text-[10px] font-black uppercase">No Image</div>
          )}
        </div>
        <label className="btn btn-secondary btn-sm cursor-pointer">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Palette size={14} />}
          <span>{uploading ? 'Uploading...' : 'Pilih File'}</span>
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={uploading} />
        </label>
      </div>
    </div>
  );
};

const Input = ({ label, type = 'text', placeholder, value, onChange, description }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input
      type={type}
      className="form-input"
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
    {description && <p className="text-[10px] text-text-muted mt-1 uppercase font-black tracking-widest">{description}</p>}
  </div>
);

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [modifiedSettings, setModifiedSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const showToast = useToast();
  const { refreshBranding } = useBranding();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/settings/admin/all');
      setSettings(data);
      setModifiedSettings({});
    } catch (err) {
      showToast('Gagal memuat setting: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setModifiedSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (Object.keys(modifiedSettings).length === 0) {
      showToast('Tidak ada perubahan untuk disimpan.', 'info');
      return;
    }
    
    try {
      setSaving(true);
      await api.post('/settings/admin/bulk-save', { settings: modifiedSettings });
      setModifiedSettings({});
      refreshBranding();
      showToast('Setting berhasil disimpan!', 'success');
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-accent-primary" size={40} />
      </div>
    );
  }


  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary flex items-center gap-2">
            <SettingsIcon className="text-accent-primary" /> System Settings
          </h2>
          <p className="text-text-muted text-sm font-medium">Konfigurasi keamanan, pembayaran, dan sistem utama.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary px-8 rounded-2xl font-black shadow-glow"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cloudflare Turnstile */}
        <Section title="Cloudflare Turnstile" icon={Shield} color="warning">
          <Toggle
            label="Enable Anti-Bot"
            value={settings.turnstile_enabled}
            onChange={(v) => handleUpdate('turnstile_enabled', v)}
          />
          <Input
            label="Site Key"
            value={settings.turnstile_site_key}
            onChange={(v) => handleUpdate('turnstile_site_key', v)}
            placeholder="1x000..."
          />
          <Input
            label="Secret Key"
            type="password"
            value={settings.turnstile_secret_key}
            onChange={(v) => handleUpdate('turnstile_secret_key', v)}
            placeholder="1x000..."
          />
        </Section>

        {/* Global Settings */}
        <Section title="General System" icon={Globe} color="accent-primary">
          <Toggle
            label="Maintenance Mode"
            value={settings.maintenance_mode}
            onChange={(v) => handleUpdate('maintenance_mode', v)}
          />
          <Toggle
            label="Enable Landing Page"
            value={settings.enable_landing_page}
            onChange={(v) => handleUpdate('enable_landing_page', v)}
          />
          <Input
            label="Upgrade Disk Price (per GB)"
            value={settings.disk_upgrade_price_per_gb}
            onChange={(v) => handleUpdate('disk_upgrade_price_per_gb', v)}
            description="Harga dalam IDR"
          />
          <Input
            label="Dedicated IP Price"
            value={settings.dedicated_ip_port_price}
            onChange={(v) => handleUpdate('dedicated_ip_port_price', v)}
            description="Harga dalam IDR"
          />
        </Section>

        {/* Payment Gateway Base */}
        <Section title="Payment Configuration" icon={CreditCard} color="success">
          <div className="form-group">
            <label className="form-label">Active Gateway</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate('payment_gateway', 'midtrans')}
                className={`p-4 rounded-2xl border transition-all text-left ${
                  settings.payment_gateway === 'midtrans'
                    ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                    : 'bg-white/5 border-white/5 text-text-muted hover:border-white/10'
                }`}
              >
                <div className="font-black">Midtrans</div>
                <div className="text-[10px] uppercase mt-1">Direct Payments</div>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate('payment_gateway', 'tripay')}
                className={`p-4 rounded-2xl border transition-all text-left ${
                  settings.payment_gateway === 'tripay'
                    ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                    : 'bg-white/5 border-white/5 text-text-muted hover:border-white/10'
                }`}
              >
                <div className="font-black">Tripay</div>
                <div className="text-[10px] uppercase mt-1">Aggregator</div>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate('payment_gateway', 'xendit')}
                className={`p-4 rounded-2xl border transition-all text-left ${
                  settings.payment_gateway === 'xendit'
                    ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                    : 'bg-white/5 border-white/5 text-text-muted hover:border-white/10'
                }`}
              >
                <div className="font-black">Xendit</div>
                <div className="text-[10px] uppercase mt-1">E-Wallet & VA</div>
              </button>
            </div>
          </div>
        </Section>

        {/* Midtrans Settings */}
        <Section title="Midtrans Settings" icon={Zap} color="sky">
           <Toggle
            label="Production Mode"
            value={settings.midtrans_is_production}
            onChange={(v) => handleUpdate('midtrans_is_production', v)}
          />
          <Input
            label="Client Key"
            value={settings.midtrans_client_key}
            onChange={(v) => handleUpdate('midtrans_client_key', v)}
          />
          <Input
            label="Server Key"
            type="password"
            value={settings.midtrans_server_key}
            onChange={(v) => handleUpdate('midtrans_server_key', v)}
          />
        </Section>

         {/* Tripay Settings */}
         <Section title="Tripay Settings" icon={Key} color="indigo">
          <div className="form-group">
            <label className="form-label">Mode</label>
            <select
              className="form-input"
              value={settings.tripay_mode}
              onChange={(e) => handleUpdate('tripay_mode', e.target.value)}
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
          <Input
            label="API Key"
            value={settings.tripay_api_key}
            onChange={(v) => handleUpdate('tripay_api_key', v)}
          />
          <Input
            label="Private Key"
            type="password"
            value={settings.tripay_private_key}
            onChange={(v) => handleUpdate('tripay_private_key', v)}
          />
          <Input
            label="Merchant Code"
            value={settings.tripay_merchant_code}
            onChange={(v) => handleUpdate('tripay_merchant_code', v)}
          />
        </Section>

        {/* Xendit Settings */}
        <Section title="Xendit Settings" icon={Lock} color="purple">
          <div className="form-group">
            <label className="form-label">Mode</label>
            <select
              className="form-input"
              value={settings.xendit_mode}
              onChange={(e) => handleUpdate('xendit_mode', e.target.value)}
            >
              <option value="sandbox">Sandbox (Test Mode)</option>
              <option value="production">Production (Live Mode)</option>
            </select>
          </div>
          <Input
            label="Secret Key"
            type="password"
            value={settings.xendit_secret_key}
            onChange={(v) => handleUpdate('xendit_secret_key', v)}
          />
          <Input
            label="Callback Token"
            type="password"
            value={settings.xendit_callback_token}
            onChange={(v) => handleUpdate('xendit_callback_token', v)}
            description="Dapatkan dari dashboard Xendit > Settings > Callbacks"
          />
          <Input
            label="MYR Conversion Rate (from IDR)"
            value={settings.xendit_myr_rate}
            onChange={(v) => handleUpdate('xendit_myr_rate', v)}
            description="Contoh: 0.00028 (1 IDR = 0.00028 MYR)"
          />
        </Section>

        {/* Discord Webhook */}
        <Section title="Discord Integration" icon={Mail} color="blue">
          <Input
            label="Webhook URL"
            value={settings.discord_webhook_url}
            onChange={(v) => handleUpdate('discord_webhook_url', v)}
            placeholder="https://discord.com/api/webhooks/..."
          />
        </Section>

        {/* Web Branding */}
        <Section title="Web Branding" icon={Layout} color="accent-secondary">
          <Input
            label="Branding Name"
            value={settings.branding_name}
            onChange={(v) => handleUpdate('branding_name', v)}
            placeholder="e.g. ZelpStore"
            description="Nama ini akan muncul di sidebar dan header website."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUpload
              label="Logo Website"
              type="logo"
              value={settings.branding_logo}
              onUpload={(url) => handleUpdate('branding_logo', url)}
            />
            <ImageUpload
              label="Icon (Favicon)"
              type="icon"
              value={settings.branding_icon}
              onUpload={(url) => handleUpdate('branding_icon', url)}
            />
          </div>
        </Section>
      </div>
    </form>
  );
}
