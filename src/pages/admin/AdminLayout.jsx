import { useState, useEffect } from 'react';
import {
  ShieldCheck, LayoutGrid, PackageCheck, Server, FileText, Users,
  Ticket, CheckCircle, LineChart, Zap, Megaphone, Headphones,
  BookOpen, XCircle, Trash2, Key, Calendar, Menu, Settings as SettingsIcon
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// Tabs
import Overview from './tabs/Overview';
import Subscriptions from './tabs/Subscriptions';
import Plans from './tabs/Plans';
import Invoices from './tabs/Invoices';
import AdminUsers from './tabs/AdminUsers';
import PromoCodes from './tabs/PromoCodes';
import Confirmation from './tabs/Confirmation';
import AdminStats from './tabs/AdminStats';
import BulkActions from './tabs/BulkActions';
import Announcements from './tabs/Announcements';
// import Tickets from './tabs/Tickets';
import KB from './tabs/KB';
import Cancellations from './tabs/Cancellations';
import Cleanup from './tabs/Cleanup';
import Settings from './tabs/Settings';

const TABS = [
  { id: 'overview', label: 'Overview', Icon: LayoutGrid, color: '#42C8F5' },
  { id: 'subscriptions', label: 'Subscriptions', Icon: PackageCheck, color: '#00D2FF' },
  { id: 'plans', label: 'Plans', Icon: Server, color: '#42C8F5' },
  { id: 'invoices', label: 'Invoices', Icon: FileText, color: '#00D2FF' },
  { id: 'users', label: 'Users', Icon: Users, color: '#42C8F5' },
  { id: 'promo', label: 'Promo Codes', Icon: Ticket, color: '#00D2FF' },
  { id: 'confirmation', label: 'Verification', Icon: CheckCircle, color: '#AEEA00' },
  { id: 'stats', label: 'Analytics', Icon: LineChart, color: '#42C8F5' },
  { id: 'bulk', label: 'Bulk Actions', Icon: Zap, color: '#00D2FF' },
  { id: 'announcements', label: 'Announce', Icon: Megaphone, color: '#f43f5e' },
  { id: 'tickets', label: 'Support', Icon: Headphones, color: '#42C8F5' },
  { id: 'kb', label: 'Knowledge Base', Icon: BookOpen, color: '#00D2FF' },
  { id: 'cancellations', label: 'Cancellations', Icon: XCircle, color: '#94a3b8' },
  { id: 'cleanup', label: 'Cleanup', Icon: Trash2, color: '#ef4444' },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon, color: '#6366f1' }
];

const TAB_COMPONENTS = {
  overview: Overview,
  subscriptions: Subscriptions,
  plans: Plans,
  invoices: Invoices,
  users: AdminUsers,
  promo: PromoCodes,
  confirmation: Confirmation,
  stats: AdminStats,
  bulk: BulkActions,
  announcements: Announcements,
  // tickets: Tickets,
  kb: KB,
  cancellations: Cancellations,
  cleanup: Cleanup,
  settings: Settings,
  // apikeys: ApiKeys,
};

export default function AdminLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeTab = searchParams.get('tab') || 'overview';

  const setTab = (id) => {
    setSearchParams({ tab: id });
    setMobileMenuOpen(false);
  };

  const ActiveComponent = TAB_COMPONENTS[activeTab] || Overview;

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in">
      {/* Premium Admin Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        style={{ background: 'linear-gradient(135deg, #132030, #1e293b, #0ea5e9)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(66,200,245,0.03) 20px, rgba(66,200,245,0.03) 40px)' }} />

        {/* Decorative "Halo" Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 border-[40px] border-accent-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 border-[1px] border-accent-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 border-[2px] border-accent-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none backdrop-blur-sm" />

        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />


        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/15 backdrop-blur border border-white/25 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Admin Center</h1>
              <p className="text-white/80 text-sm font-medium mt-1">Control panel for the ZelpStore ecosystem</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80] animate-pulse" />
              <span className="text-white text-sm font-bold tracking-wide">SYSTEM OPERATIONAL</span>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-2 text-white text-sm font-bold">
              <Calendar size={14} /> {today}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div id="admin-content" className="mt-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
