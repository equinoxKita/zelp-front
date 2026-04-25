import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Server, BookOpen, Receipt, Wallet, User, MessageCircle, ScrollText,
  ShieldCheck, LogOut, Bell, Zap, Eye, ArrowLeft,
  LayoutGrid, LineChart, Key, PackageCheck, Users, FileText, Ticket,
  CheckCircle, XCircle, Megaphone, Headphones, Trash2,
  ArrowLeftCircle, Menu, X, Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useBranding } from '../../context/BrandingContext';
import NotificationModal from '../modals/NotificationModal';

const userGroups = [
  {
    label: 'Main',
    links: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/subscriptions', icon: Server, label: 'My Servers' },
      { to: '/kb', icon: BookOpen, label: 'Knowledge Base' },
    ],
  },
  {
    label: 'Billing',
    links: [
      { to: '/transactions', icon: Receipt, label: 'Invoices' },
      { to: '/deposit', icon: Wallet, label: 'Top Up' },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/profile', icon: User, label: 'Profile' },
      { to: '/tos', icon: ScrollText, label: 'Terms' },
    ],
  },
];

const adminGroups = [
  {
    label: 'System Control',
    links: [
      { to: '/admin', icon: LayoutGrid, label: 'Overview', exact: true },
      { to: '/admin?tab=stats', icon: LineChart, label: 'Analytics' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { to: '/admin?tab=subscriptions', icon: PackageCheck, label: 'Subscriptions' },
      { to: '/admin?tab=plans', icon: Server, label: 'Plans' },
      { to: '/admin?tab=users', icon: Users, label: 'Users' },
    ],
  },
  {
    label: 'Billing & Promo',
    links: [
      { to: '/admin?tab=invoices', icon: FileText, label: 'Invoices' },
      { to: '/admin?tab=promo', icon: Ticket, label: 'Promo Codes' },
      { to: '/admin?tab=confirmation', icon: CheckCircle, label: 'Verification' },
      { to: '/admin?tab=cancellations', icon: XCircle, label: 'Cancellations' },
    ],
  },
  {
    label: 'Support & Content',
    links: [
      { to: '/admin?tab=announcements', icon: Megaphone, label: 'Announce' },
      { to: '/admin?tab=kb', icon: BookOpen, label: 'Knowledge Base' },
    ],
  },
  {
    label: 'Maintenance',
    links: [
      { to: '/admin?tab=cleanup', icon: Trash2, label: 'Cleanup' },
      { to: '/admin?tab=bulk', icon: Zap, label: 'Bulk Actions' },
      { to: '/admin?tab=settings', icon: SettingsIcon, label: 'System Settings' },
    ],
  },
];

const SidebarContent = ({ 
  user, isAdmin, isImpersonating, returnToAdmin, 
  handleLogout, setShowNotifications, unreadCount, 
  groups, isAdminSection, location, navigate, onClose 
}) => {
  const initial = user?.name?.charAt(0).toUpperCase() || '?';
  return (
    <div className="flex flex-col h-full">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <button
          onClick={returnToAdmin}
          className="flex items-center justify-center gap-2 mx-3 mb-4 p-3 bg-warning/20 text-warning border border-warning/30 rounded-xl text-xs font-black hover:bg-warning/30 transition-colors"
        >
          <ArrowLeft size={14} /> Exit Impersonation
        </button>
      )}

      {/* User Card */}
      {user && (
        <div className="px-3 mb-6">
          <button
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all duration-300 group text-left"
            onClick={() => { navigate('/profile'); onClose?.(); }}
          >
            <div className="w-11 h-11 min-w-[44px] rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-black text-sm shadow-glow-sm border border-white/10 group-hover:scale-105 transition-transform duration-300">
              {initial}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-black text-text-primary truncate">{user.name}</div>
              <div className="text-[10px] font-bold mt-0.5 truncate uppercase tracking-tight">
                {isImpersonating ? (
                  <span className="text-warning flex items-center gap-1"><Eye size={10} /> Viewing Mode</span>
                ) : isAdmin ? (
                  <span className="text-accent-primary flex items-center gap-1"><ShieldCheck size={10} /> Administrator</span>
                ) : (
                  <span className="flex items-center gap-1" style={{ color: user?.tier?.color || '#1bcfb4' }}>
                    <Zap size={10} /> {user?.tier?.name || 'Bronze'} Member
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-2 scrollbar-hide">
        {/* Notifications Bell */}
        <div className="px-3 mb-4">
          <button 
            onClick={() => setShowNotifications(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-bg-card" />
                )}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Pemberitahuan</span>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-accent-primary/20 text-accent-primary">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {groups.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest px-3 py-2 mt-3">
              {group.label}
            </div>
            {group.links.map((link) => {
              const Icon = link.icon;
              // Manually compute active: for ?tab= links compare full path+search
              const linkPath = link.to.split('?')[0];
              const linkSearch = link.to.includes('?') ? link.to.split('?')[1] : '';
              const isActive = link.exact
                ? location.pathname === linkPath && !location.search
                : linkPath === location.pathname && (!linkSearch || location.search === `?${linkSearch}`);
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  onClick={onClose}
                  className={`sidebar-link mb-0.5 ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Admin link for regular users */}
        {isAdmin && !isAdminSection && (
          <div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest px-3 py-2 mt-3">
              Admin
            </div>
            <NavLink to="/admin" onClick={onClose} className="sidebar-link mb-0.5">
              <ShieldCheck size={20} />
              <span>Admin Panel</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-2 pt-2 pb-4 border-t border-white/5">
        {isAdminSection && (
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className="sidebar-link mb-1"
            style={{ background: 'rgba(66,200,245,0.1)', color: '#42C8F5', border: '1px solid rgba(66,200,245,0.2)' }}
          >
            <ArrowLeftCircle size={20} />
            <span className="font-bold">Client Area</span>
          </NavLink>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-danger border border-danger/10 hover:bg-danger/10"
        >
          <LogOut size={20} className="opacity-80" />
          <span className="font-bold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { branding_name, branding_logo, branding_icon } = useBranding();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    // Initial notifications check
    if (user) {
      api.get('/notifications').then(data => {
        if (isMounted) setUnreadCount(data.unread || 0);
      }).catch(() => {});
    }

    return () => { isMounted = false; };
  }, [user]);

  const isAdminSection = location.pathname.startsWith('/admin');
  const isImpersonating = !!localStorage.getItem('_admin_token');
  const groups = isAdminSection ? adminGroups : userGroups;

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const returnToAdmin = () => {
    api.returnToAdmin();
  };



  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-bg-card border-r border-white/5 z-40 overflow-hidden">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/5">
          <NavLink to="/dashboard" className="flex items-center gap-2 text-text-primary no-underline">
            {branding_logo && (
              <img src={branding_logo} alt="Logo" className="h-8 w-auto object-contain" />
            )}
            <span className="text-lg font-black tracking-tight uppercase">
              {branding_name}
            </span>
          </NavLink>
        </div>
        <SidebarContent 
          user={user} isAdmin={isAdmin} isImpersonating={isImpersonating} 
          returnToAdmin={returnToAdmin} handleLogout={handleLogout} 
          setShowNotifications={setShowNotifications} unreadCount={unreadCount} 
          groups={groups} isAdminSection={isAdminSection} 
          location={location} navigate={navigate} onClose={onClose} 
        />
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-bg-card border-r border-white/5 z-50 overflow-hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-5 border-b border-white/5 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-2 text-text-primary no-underline" onClick={onClose}>
            {branding_logo && (
              <img src={branding_logo} alt="Logo" className="h-8 w-auto object-contain" />
            )}
            <span className="text-lg font-black tracking-tight uppercase">
              {branding_name}
            </span>
          </NavLink>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
        <SidebarContent 
          user={user} isAdmin={isAdmin} isImpersonating={isImpersonating} 
          returnToAdmin={returnToAdmin} handleLogout={handleLogout} 
          setShowNotifications={setShowNotifications} unreadCount={unreadCount} 
          groups={groups} isAdminSection={isAdminSection} 
          location={location} navigate={navigate} onClose={onClose} 
        />
      </aside>
      {/* Notification Modal */}
      <NotificationModal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)}
        onRefresh={() => api.get('/notifications').then(data => setUnreadCount(data.unread || 0))}
      />
    </>
  );
}
