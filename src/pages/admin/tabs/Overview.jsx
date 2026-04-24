import { useEffect, useState } from 'react';
import { Users, Server, TrendingUp, Clock, ShoppingBag, AlertCircle, Power, Coins, MessageCircle, Mail, ShieldCheck, Save, Send, Image, Upload } from 'lucide-react';
import api from '../../../services/api';
import { formatNumber } from '../../../utils/helpers';
import { useToast } from '../../../context/ToastContext';

export default function Overview() {
  const showToast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [brandingFiles, setBrandingFiles] = useState({ logo: null, icon: null });

  const load = () => {
    setLoading(true);
    api.get('/admin/stats')
      .then(setData)
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const saveSetting = async (key, value, btnKey) => {
    setSaving(s => ({ ...s, [btnKey]: true }));
    try {
      await api.post('/settings/save', { key, value });
      showToast('Setting berhasil disimpan!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(s => ({ ...s, [btnKey]: false }));
    }
  };

  const saveMultiple = async (pairs, btnKey) => {
    setSaving(s => ({ ...s, [btnKey]: true }));
    try {
      await Promise.all(pairs.map(([key, value]) => api.post('/settings/save', { key, value })));
      showToast('Settings berhasil disimpan!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(s => ({ ...s, [btnKey]: false }));
    }
  };

  const handleBrandingUpload = async (type) => {
    const file = brandingFiles[type];
    if (!file) return showToast('Pilih file terlebih dahulu!', 'warning');
    
    setSaving(s => ({ ...s, [type]: true }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await api.post('/settings/upload-branding', formData);
      showToast(res.message, 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(s => ({ ...s, [type]: false }));
    }
  };

  const toggleMaintenance = async (currentValue) => {
    const newValue = currentValue ? 'off' : 'on';
    if (!confirm(`Ubah Maintenance Mode ke ${newValue.toUpperCase()}?`)) return;
    try {
      const res = await api.post('/settings/maintenance', { value: newValue });
      showToast(res.message, 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => <div key={i} className="bg-bg-card rounded-3xl h-40" />)}
      </div>
      <div className="bg-bg-card rounded-3xl h-64" />
    </div>
  );

  if (!data) return null;
  const s = data.stats;
  const settings = data.settings || {};

  const get = (id) => document.getElementById(id)?.value || '';

  return (
    <div className="space-y-6">
      {/* Primary Stats */}
      <div className="grid md:grid-cols-3 gap-5">
        <StatCard icon={Users} label="Total Community" value={s.totalUsers} color="cyan" accent="#42C8F5" />
        <StatCard icon={Server} label="Active Servers" value={s.activeServers} color="green" accent="#AEEA00" />
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={`Rp ${formatNumber(s.totalRevenue)}`} color="aqua" accent="#00D2FF" large />
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <MiniStat icon={Clock} label="Pending Orders" value={s.pendingOrders} color="#f59e0b" />
        <MiniStat icon={ShoppingBag} label="Lifetime Orders" value={s.totalOrders} color="#42C8F5" />
        <MiniStat icon={AlertCircle} label="Unpaid Invoices" value={s.unpaidInvoices} color="#ef4444" />
      </div>

      {/* Settings */}
      <SectionHeader icon={Power} label="Pengaturan Sistem" />
      <div className="grid md:grid-cols-2 gap-5">

        {/* Maintenance */}
        <SettingCard icon={Power} title="Maintenance Mode" color="#42C8F5"
          desc="Mode Pemeliharaan">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-text-primary mb-1">Mode Pemeliharaan</h3>
              <p className="text-text-muted text-sm">User non-admin tidak bisa login saat aktif.</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className={`font-black text-lg ${settings.maintenance_mode ? 'text-danger' : 'text-success'}`}>
                {settings.maintenance_mode ? '● ON' : '● OFF'}
              </span>
              <button
                onClick={() => toggleMaintenance(settings.maintenance_mode)}
                className="btn font-bold px-4 py-2 rounded-xl text-sm text-white border-0"
                style={{ background: settings.maintenance_mode ? '#10b981' : '#ef4444' }}
              >
                {settings.maintenance_mode ? 'Turn OFF' : 'Turn ON'}
              </button>
            </div>
          </div>
        </SettingCard>

        {/* Disk Price */}
        <SettingCard icon={Coins} title="Pricing Config" color="#f59e0b">
          <div className="form-group mb-0">
            <label className="form-label text-xs uppercase tracking-wider">Disk Upgrade Price (Rp/GB)</label>
            <div className="flex gap-2">
              <input id="cfg-disk-price" type="number" className="form-input" placeholder="1000"
                defaultValue={settings.disk_upgrade_price_per_gb || '1000'} />
              <button
                disabled={saving.disk}
                onClick={() => saveSetting('disk_upgrade_price_per_gb', get('cfg-disk-price'), 'disk')}
                className="btn btn-primary px-3 rounded-xl"
              >
                {saving.disk ? <span className="spinner" /> : <Save size={16} />}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-1">Harga per GB untuk upgrade disk instan</p>
          </div>
        </SettingCard>

        {/* Discord Webhooks */}
        <div className="col-span-full">
          <SettingCard icon={MessageCircle} title="Discord Notifications" color="#42C8F5">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { id: 'wh-payment', label: 'Payment Webhook 💰', key: 'discord_webhook_url' },
                { id: 'wh-deposit', label: 'Deposit Webhook 🏦', key: 'discord_deposit_webhook' },
                { id: 'wh-invoice', label: 'Invoice Webhook 📄', key: 'discord_invoice_webhook' },
                { id: 'wh-suspend', label: 'Suspend Webhook ⚠️', key: 'discord_suspend_webhook' },
                { id: 'wh-terminate', label: 'Terminate Webhook ❌', key: 'discord_terminate_webhook' },
                { id: 'wh-stock', label: 'Stock Alert Webhook 📦', key: 'discord_stock_alert_webhook' },
              ].map(wh => (
                <div key={wh.id} className="form-group mb-0">
                  <label className="form-label text-xs uppercase tracking-wider">{wh.label}</label>
                  <input id={wh.id} type="text" className="form-input" placeholder="https://discord.com/api/webhooks/..."
                    defaultValue={settings[wh.key] || ''} />
                </div>
              ))}
              <div className="flex items-end">
                <button
                  disabled={saving.webhooks}
                  onClick={() => saveMultiple([
                    ['discord_invoice_webhook', get('wh-invoice')],
                    ['discord_webhook_url', get('wh-payment')],
                    ['discord_deposit_webhook', get('wh-deposit')],
                    ['discord_suspend_webhook', get('wh-suspend')],
                    ['discord_terminate_webhook', get('wh-terminate')],
                    ['discord_stock_alert_webhook', get('wh-stock')],
                  ], 'webhooks')}
                  className="btn btn-primary w-full py-3 rounded-xl font-bold"
                >
                  {saving.webhooks ? <><span className="spinner" /> Saving...</> : <><Save size={15} /> Save All Webhooks</>}
                </button>
              </div>
            </div>
          </SettingCard>
        </div>

        {/* SMTP */}
        <SettingCard icon={Mail} title="SMTP Email" color="#AEEA00">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="form-group mb-0">
              <label className="form-label text-xs">SMTP Host</label>
              <input id="mail-host" type="text" className="form-input" placeholder="smtp.gmail.com" defaultValue={settings.mail_host || ''} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label text-xs">SMTP Port</label>
              <input id="mail-port" type="number" className="form-input" placeholder="587" defaultValue={settings.mail_port || ''} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label text-xs">SMTP User</label>
            <input id="mail-user" type="text" className="form-input" placeholder="user@gmail.com" defaultValue={settings.mail_user || ''} />
          </div>
          <div className="form-group">
            <label className="form-label text-xs">SMTP Password</label>
            <input id="mail-pass" type="password" className="form-input" placeholder="App password" defaultValue={settings.mail_pass || ''} />
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs">From Email</label>
            <div className="flex gap-2">
              <input id="mail-from" type="email" className="form-input flex-1" placeholder="noreply@example.com" defaultValue={settings.mail_from || ''} />
              <button
                disabled={saving.smtpTest}
                onClick={async () => {
                  setSaving(s => ({ ...s, smtpTest: true }));
                  try {
                    const user = api.getUser() || {};
                    const res = await api.post('/settings/test-smtp', {
                      host: get('mail-host'), port: get('mail-port'),
                      user: get('mail-user'), pass: get('mail-pass'),
                      from: get('mail-from'), to: user.email
                    });
                    showToast(res.message || 'Test email sent!', 'success');
                  } catch (err) { showToast(err.message, 'error'); }
                  finally { setSaving(s => ({ ...s, smtpTest: false })); }
                }}
                className="btn btn-secondary px-3 rounded-xl text-sm"
              >
                {saving.smtpTest ? <span className="spinner" /> : <><Send size={13} /> Test</>}
              </button>
              <button
                disabled={saving.smtp}
                onClick={() => saveMultiple([
                  ['mail_host', get('mail-host')], ['mail_port', get('mail-port')],
                  ['mail_user', get('mail-user')], ['mail_pass', get('mail-pass')],
                  ['mail_from', get('mail-from')],
                ], 'smtp')}
                className="btn btn-primary px-3 rounded-xl"
              >
                {saving.smtp ? <span className="spinner" /> : <Save size={16} />}
              </button>
            </div>
          </div>
        </SettingCard>

        {/* Cloudflare Turnstile */}
        <SettingCard icon={ShieldCheck} title="Cloudflare Turnstile" color="#06b6d4">
          <div className="form-group">
            <label className="form-label text-xs uppercase tracking-wider">Site Key</label>
            <input id="cfg-turnstile-site" type="text" className="form-input" placeholder="0x4AAAAAA..." defaultValue={settings.turnstile_site_key || ''} />
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs uppercase tracking-wider">Secret Key</label>
            <div className="flex gap-2">
              <input id="cfg-turnstile-secret" type="password" className="form-input flex-1" placeholder="1x00000..." defaultValue={settings.turnstile_secret_key || ''} />
              <button
                disabled={saving.turnstile}
                onClick={() => saveMultiple([
                  ['turnstile_site_key', get('cfg-turnstile-site')],
                  ['turnstile_secret_key', get('cfg-turnstile-secret')],
                ], 'turnstile')}
                className="btn btn-primary px-3 rounded-xl"
              >
                {saving.turnstile ? <span className="spinner" /> : <Save size={16} />}
              </button>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">
            📌 Get keys from{' '}
            <a href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer" className="text-[#06b6d4] font-bold">Cloudflare Dashboard</a>
          </p>
        </SettingCard>

        {/* Branding Config */}
        <div className="col-span-full">
          <SectionHeader icon={Image} label="Web Branding" />
        </div>
        
        <SettingCard icon={Image} title="Logo Utama" color="#42C8F5">
          <div className="space-y-4">
            {settings.branding_logo && (
              <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-center">
                <img src={settings.branding_logo} alt="Logo Prev" className="max-h-12 object-contain" />
              </div>
            )}
            <div className="form-group mb-0">
                <label className="form-label text-xs">Upload New Logo (JPG/PNG/SVG)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      accept=".jpg,.jpeg,.png,.svg" 
                      onChange={e => setBrandingFiles(f => ({ ...f, logo: e.target.files[0] }))} 
                    />
                    <div className="form-input flex items-center gap-2 group-hover:border-accent-primary transition-all">
                      <Image size={14} className="text-text-muted" />
                      <span className="text-xs truncate">
                        {brandingFiles.logo ? brandingFiles.logo.name : 'Pilih file logo...'}
                      </span>
                    </div>
                  </div>
                  <button disabled={saving.logo} onClick={() => handleBrandingUpload('logo')} className="btn btn-primary px-4 rounded-xl shadow-glow">
                    {saving.logo ? <span className="spinner" /> : <Upload size={16} />}
                  </button>
                </div>
            </div>
          </div>
        </SettingCard>

        <SettingCard icon={ShieldCheck} title="Favicon / Icon" color="#00D2FF">
          <div className="space-y-4">
            {settings.branding_icon && (
              <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-center">
                <img src={settings.branding_icon} alt="Icon Prev" className="w-12 h-12 object-contain" />
              </div>
            )}
            <div className="form-group mb-0">
                <label className="form-label text-xs">Upload New Icon (JPG/PNG/SVG)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      accept=".jpg,.jpeg,.png,.svg" 
                      onChange={e => setBrandingFiles(f => ({ ...f, icon: e.target.files[0] }))} 
                    />
                    <div className="form-input flex items-center gap-2 group-hover:border-accent-primary transition-all">
                      <ShieldCheck size={14} className="text-text-muted" />
                      <span className="text-xs truncate">
                        {brandingFiles.icon ? brandingFiles.icon.name : 'Pilih file icon...'}
                      </span>
                    </div>
                  </div>
                  <button disabled={saving.icon} onClick={() => handleBrandingUpload('icon')} className="btn btn-primary px-4 rounded-xl shadow-glow">
                    {saving.icon ? <span className="spinner" /> : <Upload size={16} />}
                  </button>
                </div>
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, accent, large }) {
  return (
    <div className="card p-7 relative overflow-hidden" style={{ borderTop: `4px solid ${accent}`, background: `linear-gradient(135deg, ${accent}15, transparent)` }}>
      <div className="absolute top-5 right-5 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${accent}20`, color: accent }}>
        <Icon size={28} />
      </div>
      <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: accent }}>{label}</div>
      <div className={`font-black text-text-primary leading-none ${large ? 'text-4xl' : 'text-5xl'}`}>{value}</div>
      <div className="mt-5 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full w-4/5" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}99)` }} />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4" style={{ background: `${color}08` }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-2xl font-black leading-none" style={{ color }}>{value}</div>
        <div className="text-xs font-black text-text-muted uppercase tracking-wider mt-1">{label}</div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center"><Icon size={18} /></div>
      <h2 className="text-lg font-black text-text-primary">{label}</h2>
    </div>
  );
}

function SettingCard({ icon: Icon, title, color, children, desc }) {
  return (
    <div className="card overflow-hidden" style={{ borderTop: `3px solid ${color}` }}>
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        <span className="font-black text-text-primary">{title}</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
