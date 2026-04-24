import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';

// Pages where sidebar is hidden (full-width layout)
const EXCLUDED_PATHS = ['/', '/login', '/register', '/maintenance'];

function isExcluded(pathname) {
  return (
    EXCLUDED_PATHS.includes(pathname) ||
    pathname.startsWith('/payment-pending') ||
    pathname.startsWith('/plan/') ||
    pathname.startsWith('/checkout/') ||
    pathname.startsWith('/order/checkout/')
  );
}

export default function MainLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isLoggedIn } = useAuth();
  const { branding_name, branding_logo } = useBranding();
  const location = useLocation();
  const excluded = isExcluded(location.pathname);
  const showSidebar = isLoggedIn && !excluded;

  // Handle scroll untuk efek header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll ketika sidebar terbuka
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileSidebarOpen]);

  // Tutup sidebar ketika route berubah
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-shiroko-gradient relative overflow-hidden">
      {/* Background Decorative Auras */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-accent-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {showSidebar && (
        <>
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
          
          {/* Mobile Header Bar */}
          <header 
            className={`lg:hidden fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
              isScrolled 
                ? 'bg-bg-card/95 backdrop-blur-md border-b border-white/10 shadow-lg' 
                : 'bg-transparent'
            }`}
          >
            <div className="flex items-center justify-between px-4 h-16">
              {/* Hamburger Button */}
              <button
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  mobileSidebarOpen 
                    ? 'bg-accent-primary text-white rotate-90' 
                    : 'bg-bg-card border border-white/10 text-text-secondary hover:text-text-primary hover:border-accent-primary/50'
                }`}
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                aria-label={mobileSidebarOpen ? "Close menu" : "Open menu"}
              >
                {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Page Title / Brand */}
              <div className="flex items-center gap-2">
                {branding_logo ? (
                  <img src={branding_logo} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                    <span className="text-white font-black text-xs">{branding_name?.charAt(0)}</span>
                  </div>
                )}
                <span className="font-black text-text-primary tracking-tight">{branding_name}</span>
              </div>

              {/* Spacer untuk balance */}
              <div className="w-10" />
            </div>
          </header>

          {/* Overlay dengan efek blur yang lebih baik */}
          {mobileSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </>
      )}

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          showSidebar ? 'lg:ml-64' : ''
        } ${showSidebar ? 'pt-16 lg:pt-0' : ''}`}
      >
        <Outlet />
      </main>

      {/* Safe Area untuk perangkat dengan notch */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[env(safe-area-inset-bottom)] bg-bg-card/80 backdrop-blur-sm z-20 border-t border-white/5" />
    </div>
  );
}