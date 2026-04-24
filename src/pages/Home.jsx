import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Zap, Database, HardDrive, Tag, ArrowRight, Cpu, MapPin,
  Save, MessageCircle, Star, Clock, Check
} from 'lucide-react';
import api from '../services/api';
import { formatNumber, formatMB } from '../utils/helpers';

function PlanCard({ plan, index }) {
  const navigate = useNavigate();
  const isPopular = index === 0;
  const isPreorder = plan.setup_type === 'manual';
  const isOutOfStock = plan.stock <= 0;
  const isBasic = plan.name?.toLowerCase().includes('basic');
  const isLite = plan.name?.toLowerCase().includes('lite');

  return (
    <div className={`relative flex flex-col rounded-3xl p-7 border transition-all duration-300 hover:-translate-y-1 hover:shadow-glow ${
      isPopular
        ? 'bg-gradient-to-br from-accent-primary/15 to-accent-secondary/8 border-accent-primary'
        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
    }`}>
      {isPopular && (
        <div className="inline-flex items-center gap-2 bg-accent-gradient text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 w-fit">
          <Star size={12} /> Most Popular
        </div>
      )}
      {isPreorder && (
        <div className="absolute top-7 right-7 flex items-center gap-1 bg-warning text-black px-3 py-1 rounded-lg text-xs font-black uppercase shadow-md">
          <Clock size={11} /> Preorder
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-lg font-black text-text-primary mb-2">{plan.name}</h3>
        <p className="text-text-muted text-sm leading-relaxed">{plan.description || ''}</p>
      </div>

      <div className="mb-6 pb-6 border-b border-white/5">
        <div className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Monthly Price</div>
        <div className="text-4xl font-black text-accent-secondary">
          Rp {formatNumber(plan.price_monthly)}
          <span className="text-sm text-text-muted font-normal">/mo</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-blue-500/5 rounded-xl border-l-2 border-blue-500">
          <div className="flex items-center gap-1 text-xs text-text-muted font-bold mb-1"><Cpu size={11} /> CPU</div>
          <div className="font-black text-lg text-text-primary">{plan.cpu}%</div>
          {(isBasic || isLite) && (
            <div className="text-xs text-text-muted font-black mt-0.5">{isBasic ? 'EPYC 9B14' : 'i9 13900HK'}</div>
          )}
        </div>
        <div className="p-3 bg-success/5 rounded-xl border-l-2 border-success">
          <div className="flex items-center gap-1 text-xs text-text-muted font-bold mb-1"><Database size={11} /> RAM</div>
          <div className="font-black text-lg text-text-primary">{formatMB(plan.ram_mb)}</div>
          <div className="text-xs text-text-muted font-black mt-0.5">{isBasic ? 'DDR5' : 'DDR4'}</div>
        </div>
        <div className="p-3 bg-warning/5 rounded-xl border-l-2 border-warning">
          <div className="flex items-center gap-1 text-xs text-text-muted font-bold mb-1"><HardDrive size={11} /> Disk</div>
          <div className="font-black text-lg text-text-primary">{formatMB(plan.disk_mb)}</div>
        </div>
        <div className="p-3 bg-accent-primary/5 rounded-xl border-l-2 border-accent-primary">
          <div className="flex items-center gap-1 text-xs text-text-muted font-bold mb-1"><Database size={11} /> DB</div>
          <div className="font-black text-lg text-text-primary">{plan.databases_count || plan.databases || 1}</div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Check size={13} className="text-success font-bold" />
          <Save size={11} /> {plan.backups || 1} Backup Slots
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Check size={13} className="text-success font-bold" />
          <MapPin size={11} /> {plan.location || 'SG'} Lokasi
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Check size={13} className="text-success font-bold" />
          <ShieldCheck size={11} /> DDoS Protection
        </div>
        {isPreorder && (
          <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 px-3 py-2 rounded-lg border-l-2 border-warning">
            <Clock size={13} /> 1-2 Days Delivery
          </div>
        )}
      </div>

      <button
        onClick={() => !isOutOfStock && navigate(`/plan/${plan.id}`)}
        disabled={isOutOfStock}
        className={`mt-auto btn btn-block py-3 rounded-xl font-bold ${
          isOutOfStock ? 'opacity-50 cursor-not-allowed btn-secondary' :
          isPopular ? 'btn-primary shadow-glow-sm' : 'btn-secondary'
        }`}
      >
        {isOutOfStock ? 'Out of Stock' : <><ArrowRight size={14} /> Select Plan</>}
      </button>
    </div>
  );
}

export default function Home() {
  const [plans, setPlans] = useState([]);
  const [plansByCategory, setPlansByCategory] = useState({});
  const [activeCategory, setActiveCategory] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/plans')
      .then((data) => {
        const allPlans = data.plans || [];
        setPlans(allPlans);
        const cats = {};
        allPlans.forEach((p) => {
          const cat = p.category || 'Uncategorized';
          if (!cats[cat]) cats[cat] = [];
          cats[cat].push(p);
        });
        setPlansByCategory(cats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const catNames = Object.keys(plansByCategory);
  const displayPlans = catNames.length > 1
    ? plansByCategory[catNames[activeCategory]] || []
    : plans;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-[70px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline text-text-primary">
            <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center shadow-glow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">ZelpStore</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-secondary px-5 py-2.5 rounded-xl font-bold text-sm">Login</Link>
            <Link to="/register" className="btn btn-primary px-5 py-2.5 rounded-xl font-black text-sm">
              Get Started <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-secondary/10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary px-6 py-2.5 rounded-full font-bold text-sm mb-8">
            <span className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center"><Zap size={12} className="text-white" /></span>
            NEXT-GEN GAMING INFRASTRUCTURE
          </div>
          <h1 className="text-[clamp(3rem,10vw,6rem)] leading-[0.93] font-black tracking-[-0.05em] mb-8">
            Elevate Your{' '}
            <span className="gradient-text">Experience.</span>
          </h1>
          <p className="text-[clamp(1.1rem,3vw,1.4rem)] text-text-secondary font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            Deploy high-performance game servers in seconds with{' '}
            <span className="text-text-primary font-bold">ZelpStore</span>.
            Enterprise-grade Ryzen 9 hardware combined with ultra-low latency networking.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn btn-primary text-lg px-12 py-4 rounded-2xl font-black shadow-glow">
              Get Started Now <ArrowRight size={20} />
            </Link>
            <a href="#pricing" className="btn btn-secondary text-lg px-12 py-4 rounded-2xl font-bold">
              <Tag size={18} /> Browse Plans
            </a>
          </div>

          {/* Trust Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
            {[
              { icon: ShieldCheck, label: 'Anti-DDoS Game', color: 'text-accent-primary' },
              { icon: Zap, label: '5.0GHz+ CPUs', color: 'text-accent-secondary' },
              { icon: Database, label: 'NVMe Gen4 Storage', color: 'text-success' },
              { icon: Clock, label: '99.9% Uptime', color: 'text-warning' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 justify-center font-bold text-sm">
                <Icon size={20} className={color} /> {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Why Choose <span className="gradient-text">ZelpStore</span>?</h2>
            <p className="text-text-secondary text-lg">Enterprise-grade infrastructure designed for ultimate gaming performance.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'DDoS Protection', desc: 'Perlindungan DDoS hingga 1 Tbps. Server kamu aman dari serangan apapun.' },
              { icon: HardDrive, title: 'NVMe SSD Storage', desc: 'Disk NVMe SSD tercepat untuk loading map dan chunk generation instan.' },
              { icon: Cpu, title: 'Pterodactyl Panel', desc: 'Panel kontrol modern dan mudah digunakan. Install mod, kelola file, dan monitoring real-time.' },
              { icon: MapPin, title: 'Lokasi Strategis', desc: 'Server berlokasi di Singapore dengan latency rendah ke seluruh Asia Tenggara.' },
              { icon: Save, title: 'Auto Backup', desc: 'Backup otomatis terjadwal. Restore kapan saja dengan sekali klik.' },
              { icon: MessageCircle, title: 'Support 24/7', desc: 'Tim support siap membantu 24 jam melalui Discord.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:border-white/15 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-accent-gradient/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-black text-text-primary mb-2">{title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Explore <span className="gradient-text">Our Plans</span></h2>
            <p className="text-text-secondary text-lg">Instant scaling, DDoS protection, and premium NVMe storage included by default.</p>
          </div>

          {catNames.length > 1 && (
            <div className="flex gap-3 justify-center mb-10 flex-wrap">
              {catNames.map((cat, i) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(i)}
                  className={`px-5 py-2 rounded-xl border text-sm font-bold transition-all ${
                    activeCategory === i ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-bg-card rounded-3xl h-96" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayPlans.map((plan, i) => <PlanCard key={plan.id} plan={plan} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-accent-gradient rounded-3xl p-16 text-center relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
          <div className="absolute -top-16 -left-16 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <h2 className="text-4xl font-black text-white mb-4 relative z-10">
            Ready to <span className="bg-white/20 px-3 rounded-xl">Level Up?</span>
          </h2>
          <p className="text-white/90 text-lg mb-10 max-w-xl mx-auto relative z-10">
            Join thousands of gamers who trust ZelpStore for their performance needs. Your empire starts here.
          </p>
          <Link to="/register"
            className="relative z-10 inline-flex items-center gap-2 bg-white text-accent-primary font-black text-lg px-12 py-4 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
            🎮 Deploy Your Server
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5 text-center">
        <p className="text-text-muted text-sm">© 2026 ZelpStore — High-Performance Game Hosting Powered by Pterodactyl</p>
      </footer>
    </div>
  );
}
