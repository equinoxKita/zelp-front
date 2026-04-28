import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Server, ArrowLeft, ArrowRight, ShieldCheck, Zap, Wallet, CreditCard } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { formatNumber } from '../utils/helpers';

export default function Order() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { user, updateUser } = useAuth();
  const { payment_gateway } = useBranding();
  
  const planId = searchParams.get('plan');
  const months = parseInt(searchParams.get('months')) || 1;
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverName, setServerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('balance');
  const [submitting, setSubmitting] = useState(false);
  
  // Configuration State
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nests, setNests] = useState([]);
  const [selectedNest, setSelectedNest] = useState('');
  const [eggs, setEggs] = useState([]);
  const [selectedEgg, setSelectedEgg] = useState(null);
  const [dockerImages, setDockerImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);

  const gatewayEnabled = payment_gateway && payment_gateway !== 'none';

  useEffect(() => {
    if (!planId) {
      navigate('/');
      return;
    }

    api.get(`/plans/${planId}`)
      .then(data => {
        const p = data.plan || data;
        setPlan(p);
        
        // Fetch nodes for this location
        const nodesUrl = p.location_id ? `/pterodactyl/nodes?location_id=${p.location_id}` : '/pterodactyl/nodes';
        setLoadingNodes(true);
        api.get(nodesUrl)
          .then(res => {
            const nodeData = res.nodes || [];
            setNodes(nodeData);
            if (nodeData.length > 0) setSelectedNode(nodeData[0].id);
          })
          .catch(console.error)
          .finally(() => setLoadingNodes(false));

        // Fetch nests
        api.get('/pterodactyl/nests')
          .then(res => {
            setNests(res.nests || []);
            // Auto select first or relevant nest
            const defaultNest = res.nests?.find(n => n.id === p.nest_id) || res.nests?.[0];
            if (defaultNest) setSelectedNest(defaultNest.id);
          })
          .catch(console.error);
      })
      .catch(err => {
        showToast(err.message, 'error');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [planId]);

  // Fetch eggs when nest changes
  useEffect(() => {
    if (!selectedNest) return;
    api.get(`/pterodactyl/nests/${selectedNest}/eggs`)
      .then(res => {
        let fetchedEggs = res.eggs || [];
        setEggs(fetchedEggs);
        
        // Filter compatible eggs for auto-selection
        const compatibleEggs = fetchedEggs.filter(egg => {
          if (selectedNest != 1 || plan?.ram_mb >= 2048) return true;
          const name = egg.name.toLowerCase();
          return name.includes('proxy') || name.includes('bungeecord') || name.includes('velocity') || name.includes('waterfall');
        });

        const defaultEgg = compatibleEggs.find(e => e.id === plan?.egg_id) || compatibleEggs[0];
        if (defaultEgg) {
          setSelectedEgg(defaultEgg);
          // Parse docker images
          if (defaultEgg.docker_images) {
            try {
              const imgs = typeof defaultEgg.docker_images === 'string' ? JSON.parse(defaultEgg.docker_images) : defaultEgg.docker_images;
              const imgList = Object.entries(imgs).map(([name, val]) => ({ name, val }));
              setDockerImages(imgList);
              if (imgList.length > 0) setSelectedImage(imgList[0].val);
            } catch (e) {
              setDockerImages([]);
            }
          }
        } else {
          setSelectedEgg(null);
          setDockerImages([]);
        }
      })
      .catch(console.error);
  }, [selectedNest, plan]);

  const handleEggChange = (eggId) => {
    const egg = eggs.find(e => String(e.id) === String(eggId));
    if (!egg) return;
    
    // Minecraft Java 2GB Rule (Paper, Spigot, Vanilla, etc.)
    // Bungeecord, Waterfall, Velocity are proxies and can run on 1GB.
    const isJavaServer = !egg.name.toLowerCase().includes('proxy') && 
                         !egg.name.toLowerCase().includes('bungeecord') && 
                         !egg.name.toLowerCase().includes('velocity') && 
                         !egg.name.toLowerCase().includes('waterfall');

    if (selectedNest == 1 && isJavaServer && plan?.ram_mb < 2048) {
      showToast('Paket RAM di bawah 2GB tidak mendukung Minecraft Java (Paper/Spigot/Vanilla). Silakan pilih paket lain atau gunakan Proxy (Bungeecord).', 'warning');
      return;
    }

    setSelectedEgg(egg);
    if (egg.docker_images) {
      try {
        const imgs = typeof egg.docker_images === 'string' ? JSON.parse(egg.docker_images) : egg.docker_images;
        const imgList = Object.entries(imgs).map(([name, val]) => ({ name, val }));
        setDockerImages(imgList);
        if (imgList.length > 0) setSelectedImage(imgList[0].val);
      } catch (e) {
        setDockerImages([]);
      }
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    try {
      const res = await api.post('/orders/validate-promo', { 
        code: promoCode, 
        totalPrice: totalPriceWithoutPromo 
      });
      setPromoDiscount(res.discount_amount);
      setAppliedPromo(promoCode);
      showToast('Kode promo berhasil diterapkan!', 'success');
    } catch (err) {
      setPromoDiscount(0);
      setAppliedPromo(null);
      showToast(err.message || 'Kode promo tidak valid', 'error');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serverName.trim()) return showToast('Nama server wajib diisi', 'error');
    
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        plan_id: plan.id,
        server_name: serverName,
        period_months: months,
        payment_method: paymentMethod,
        node_id: selectedNode,
        nest_id: selectedNest,
        egg_id: selectedEgg?.id,
        docker_image: selectedImage,
        promo_code: appliedPromo
      });
      
      if (res.auto_paid) {
        showToast(res.message || 'Order berhasil dibuat dan dibayar!', 'success');
        if (res.user) updateUser(res.user);
        navigate(`/invoice/${res.invoice_id}`);
      } else if (paymentMethod === 'gateway') {
        // Trigger payment gateway
        const payData = await api.post('/payment/create', { invoice_id: res.invoice_id });
        
        if (payData.payment_method === 'midtrans') {
          if (window.snap) {
            window.snap.pay(payData.token, {
              onSuccess: () => {
                showToast('Pembayaran berhasil!', 'success');
                navigate(`/invoice/${res.invoice_id}`);
              },
              onPending: () => {
                showToast('Pembayaran tertunda.', 'info');
                navigate(`/invoice/${res.invoice_id}`);
              },
              onError: () => {
                showToast('Pembayaran gagal.', 'error');
                navigate(`/invoice/${res.invoice_id}`);
              },
              onClose: () => {
                showToast('Pembayaran dibatalkan.', 'warning');
                navigate(`/invoice/${res.invoice_id}`);
              }
            });
          } else {
            showToast('Midtrans Snap tidak termuat.', 'error');
            navigate(`/invoice/${res.invoice_id}`);
          }
        } else if (typeof payData.redirect_url === 'string' && /^https?:\/\//.test(payData.redirect_url)) {
          window.location.href = payData.redirect_url;
        } else {
          navigate(`/invoice/${res.invoice_id}`);
        }
      } else {
        showToast(res.message || 'Order berhasil dibuat!', 'success');
        navigate(`/invoice/${res.invoice_id}`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
      <div className="w-16 h-16 bg-white/5 rounded-full mb-4" />
      <div className="h-4 w-48 bg-white/5 rounded" />
    </div>
  );

  if (!plan) return null;

  const DURATIONS = [
    { m: 1, disc: 0 },
    { m: 3, disc: 5 },
    { m: 6, disc: 10 },
    { m: 12, disc: 15 },
  ];
  const selectedDuration = DURATIONS.find(d => d.m === months);
  const totalPriceWithoutPromo = Math.floor(plan.price_monthly * months * (1 - (selectedDuration?.disc || 0) / 100));
  const finalTotalPrice = Math.max(0, totalPriceWithoutPromo - promoDiscount);

  return (
    <div className="p-6 lg:p-8 animate-in max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-text-muted">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Konfirmasi Pesanan</h1>
          <p className="text-text-muted text-sm">Lengkapi detail untuk server baru kamu</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="card p-7 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-black text-text-primary uppercase tracking-wider">
                Nama Server
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent-primary transition-colors">
                  <Zap size={18} />
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Server Survival 1"
                  className="input pl-11 py-4 text-lg font-bold w-full bg-white/[0.02] border-white/5 focus:bg-white/[0.04] focus:border-accent-primary/50 transition-all rounded-2xl"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <p className="text-[11px] text-text-muted font-bold flex items-center gap-1.5 px-1">
                <ShieldCheck size={12} className="text-success" /> Gunakan nama yang mudah diingat untuk server kamu.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-accent-primary rounded-full shadow-glow" />
                <h3 className="font-black text-text-primary uppercase text-sm tracking-widest">Server Configuration</h3>
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm font-black text-text-primary uppercase tracking-wider">
                  Pilih Tipe CPU & RAM Speed
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nodes.length > 0 ? nodes.map(node => {
                    const isOutOfStock = (node.allocated_resources.memory / (node.memory * (1 + node.memory_overcommit/100))) > 0.98;
                    const isSelected = selectedNode === node.id;
                    
                    return (
                      <button
                        key={node.id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setSelectedNode(node.id)}
                        className={`relative p-5 rounded-2xl border-2 text-left transition-all group ${isSelected ? 'border-accent-primary bg-accent-primary/5' : isOutOfStock ? 'border-white/5 opacity-50 cursor-not-allowed' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}
                      >
                        {isSelected && <div className="absolute top-4 right-4 text-accent-primary"><ShieldCheck size={20} /></div>}
                        <div className="font-black text-text-primary group-hover:text-accent-primary transition-colors">{node.name}</div>
                        <div className="text-[10px] text-text-muted font-bold mt-1 line-clamp-1">{node.description || 'Enterprise Grade Performance'}</div>
                        <div className={`text-[10px] font-black uppercase mt-3 tracking-wider ${isOutOfStock ? 'text-danger' : 'text-success'}`}>
                          {isOutOfStock ? 'Out of Stock' : 'Stock Available'}
                        </div>
                      </button>
                    );
                  }) : loadingNodes ? (
                    <div className="col-span-2 p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
                      <div className="text-[10px] text-text-muted font-black uppercase tracking-widest">Memuat ketersediaan node...</div>
                    </div>
                  ) : (
                    <div className="col-span-2 p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
                      <div className="text-text-muted"><Server size={24} /></div>
                      <div className="text-xs font-black text-text-primary">Tidak Ada Node Tersedia</div>
                      <div className="text-[10px] text-text-muted text-center max-w-[200px]">Maaf, saat ini tidak ada node yang tersedia untuk lokasi paket ini.</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-sm font-black text-text-primary uppercase tracking-wider">Nest</label>
                  <select 
                    className="input w-full py-4 px-4 bg-white/[0.02] border-white/5 rounded-2xl font-bold"
                    value={selectedNest}
                    onChange={(e) => setSelectedNest(e.target.value)}
                  >
                    {nests.map(nest => (
                      <option key={nest.id} value={nest.id}>{nest.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-sm font-black text-text-primary uppercase tracking-wider">Server Version</label>
                  <select 
                    className="input w-full py-4 px-4 bg-white/[0.02] border-white/5 rounded-2xl font-bold"
                    value={selectedEgg?.id || ''}
                    onChange={(e) => handleEggChange(e.target.value)}
                  >
                    {eggs
                      .filter(egg => {
                        if (selectedNest != 1 || plan?.ram_mb >= 2048) return true;
                        const name = egg.name.toLowerCase();
                        const isProxy = name.includes('proxy') || name.includes('bungeecord') || name.includes('velocity') || name.includes('waterfall');
                        return isProxy;
                      })
                      .map(egg => (
                        <option key={egg.id} value={egg.id}>{egg.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {dockerImages.length > 0 && (
                <div className="space-y-4">
                  <label className="block text-sm font-black text-text-primary uppercase tracking-wider">Docker Image / Java Version</label>
                  <select 
                    className="input w-full py-4 px-4 bg-white/[0.02] border-white/5 rounded-2xl font-bold"
                    value={selectedImage}
                    onChange={(e) => setSelectedImage(e.target.value)}
                  >
                    {dockerImages.map(img => (
                      <option key={img.val} value={img.val}>{img.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center text-white">
                  <Server size={20} />
                </div>
                <div>
                  <div className="text-sm font-black text-text-primary">{plan.name}</div>
                  <div className="text-[10px] text-text-muted uppercase font-black">{plan.category || 'Game Hosting'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                <div className="text-center">
                  <div className="text-[10px] text-text-muted font-black uppercase">CPU</div>
                  <div className="text-xs font-black text-text-primary">{plan.cpu}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-text-muted font-black uppercase">RAM</div>
                  <div className="text-xs font-black text-text-primary">{plan.ram_mb}MB</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-text-muted font-black uppercase">Disk</div>
                  <div className="text-xs font-black text-text-primary">{plan.disk_mb}MB</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-black text-text-primary uppercase tracking-wider">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('balance')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${paymentMethod === 'balance' ? 'border-accent-primary bg-accent-primary/5' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'balance' ? 'bg-accent-primary text-white' : 'bg-white/5 text-text-muted'}`}>
                    <Wallet size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-text-primary">Saldo Akun</div>
                    <div className="text-[10px] text-text-muted font-bold">Rp {formatNumber(user?.balance || 0)}</div>
                  </div>
                </button>

                {gatewayEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gateway')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${paymentMethod === 'gateway' ? 'border-accent-primary bg-accent-primary/5' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'gateway' ? 'bg-accent-primary text-white' : 'bg-white/5 text-text-muted'}`}>
                      <CreditCard size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-black text-text-primary">Payment Gateway</div>
                      <div className="text-[10px] text-text-muted font-bold">Otomatis Terkonfirmasi</div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`btn btn-primary btn-block py-4 rounded-2xl font-black text-lg shadow-glow transition-all active:scale-95 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Memproses...' : (
                <>
                  Bayar Sekarang <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-5 bg-accent-primary/5 border-accent-primary/10">
            <h3 className="font-black text-text-primary uppercase text-xs tracking-widest">Ringkasan Pembayaran</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted font-bold">Harga Paket</span>
                <span className="text-text-primary font-black">Rp {formatNumber(plan.price_monthly)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted font-bold">Durasi</span>
                <span className="text-text-primary font-black">{months} Bulan</span>
              </div>
              {selectedDuration?.disc > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span className="font-bold">Diskon Durasi</span>
                  <span className="font-black">-{selectedDuration.disc}%</span>
                </div>
              )}
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span className="font-bold">Promo ({appliedPromo})</span>
                  <span className="font-black">-Rp {formatNumber(promoDiscount)}</span>
                </div>
              )}
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-text-muted font-black uppercase">Total Bayar</div>
                  <div className="text-2xl font-black text-text-primary tracking-tight">Rp {formatNumber(finalTotalPrice)}</div>
                </div>
              </div>
            </div>
          </div>
 
          <div className="card p-6 space-y-4">
            <h3 className="font-black text-text-primary uppercase text-xs tracking-widest">Punya Kode Promo?</h3>
            <div className="relative group">
              <input
                type="text"
                placeholder="Masukkan kode..."
                className="input py-3 pl-4 pr-24 text-sm font-bold w-full bg-white/[0.02] border-white/5 focus:border-accent-primary/50 transition-all rounded-xl"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                disabled={validatingPromo || !!appliedPromo}
              />
              <div className="absolute inset-y-1.5 right-1.5 flex">
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={validatingPromo || !promoCode || !!appliedPromo}
                  className={`px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    appliedPromo 
                      ? 'bg-success/20 text-success border border-success/20' 
                      : 'bg-accent-primary text-white shadow-glow hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:shadow-none'
                  }`}
                >
                  {validatingPromo ? '...' : appliedPromo ? 'Applied' : 'Gunakan'}
                </button>
              </div>
            </div>
            {appliedPromo && (
              <button 
                type="button"
                onClick={() => { setAppliedPromo(null); setPromoDiscount(0); setPromoCode(''); }}
                className="text-[10px] text-danger/70 hover:text-danger font-bold flex items-center gap-1 transition-colors"
              >
                <div className="w-1 h-1 rounded-full bg-current" /> Hapus Promo
              </button>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-text-muted">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xs font-black text-text-primary">Aman & Terpercaya</div>
              <div className="text-[10px] text-text-muted leading-tight">Server kamu akan aktif secara otomatis setelah pembayaran berhasil dikonfirmasi.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
