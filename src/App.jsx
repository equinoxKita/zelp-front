import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { BrandingProvider, useBranding } from './context/BrandingContext';
import MainLayout from './components/layout/MainLayout';
import { RequireAuth, RequireAdmin, RequireGuest } from './components/guards/AuthGuard';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import InvoiceDetail from './pages/InvoiceDetail';
import Subscriptions from './pages/Subscriptions';
import ServiceDetail from './pages/ServiceDetail';
import Profile from './pages/Profile';
import Deposit from './pages/Deposit';
import PlanDetail from './pages/PlanDetail';
import Order from './pages/Order';
import Kb from './pages/Kb';
// import Support from './pages/Support';
// import TicketDetail from './pages/TicketDetail';
import Tos from './pages/Tos';
import Maintenance from './pages/Maintenance';
import Admin from './pages/admin/AdminLayout';

function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-8 text-center">
      <div className="animate-in">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-black text-text-primary mb-4">404</h1>
        <p className="text-text-muted text-lg mb-8">Halaman yang kamu cari tidak ada.</p>
        <a href="/" className="btn btn-primary px-8 py-3 rounded-2xl font-black">Kembali ke Beranda</a>
      </div>
    </div>
  );
}

function LandingRoute({ children }) {
  const { enable_landing_page, loading } = useBranding();
  if (loading) return null;
  return enable_landing_page ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BrandingProvider>
          <ToastProvider>
            <Routes>
            {/* Public/Guest routes */}
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
            <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />

            {/* Main layout routes */}
            <Route element={<MainLayout />}>
              {/* Public */}
              <Route path="/" element={<LandingRoute><Home /></LandingRoute>} />
              <Route path="/plan/:id" element={<PlanDetail />} />
              <Route path="/order" element={<RequireAuth><Order /></RequireAuth>} />
              <Route path="/tos" element={<Tos />} />

              {/* Auth required */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/subscriptions" element={<RequireAuth><Subscriptions /></RequireAuth>} />
              <Route path="/service/:id" element={<RequireAuth><ServiceDetail /></RequireAuth>} />
              <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
              <Route path="/invoice/:id" element={<RequireAuth><InvoiceDetail /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/deposit" element={<RequireAuth><Deposit /></RequireAuth>} />
              <Route path="/kb" element={<RequireAuth><Kb /></RequireAuth>} />
              <Route path="/kb/:articleId" element={<RequireAuth><Kb /></RequireAuth>} />
              {/* <Route path="/support" element={<RequireAuth><Support /></RequireAuth>} />
              <Route path="/support/:id" element={<RequireAuth><TicketDetail /></RequireAuth>} /> */}

              {/* Admin required */}
              <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
              <Route path="/admin/*" element={<RequireAdmin><Admin /></RequireAdmin>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
        </BrandingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
