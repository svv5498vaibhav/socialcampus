import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SecurityDashboard from './pages/SecurityDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import ProfileDashboard from './pages/ProfileDashboard';
import FeedPage from './pages/FeedPage';
import RankForgeDashboard from './pages/RankForgeDashboard';
import SafeVoiceDashboard from './pages/SafeVoiceDashboard';
import BranchConnectDashboard from './pages/BranchConnectDashboard';
import CreatorBoostDashboard from './pages/CreatorBoostDashboard';
import PulseNotifyDashboard from './pages/PulseNotifyDashboard';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="loader-container" style={{ minHeight: '100vh' }}>
        <div className="loader"></div>
        <p className="loader-text">Loading CampusX...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard/profile" replace />;
  }

  return children;
}

function OnboardingGuard({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="loader-container" style={{ minHeight: '100vh' }}>
        <div className="loader"></div>
        <p className="loader-text">Loading CampusX...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If already completed onboarding, go to profile dashboard
  if (user?.onboardingCompleted) {
    return <Navigate to="/dashboard/profile" replace />;
  }

  return children;
}

function SmartRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/dashboard/feed" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="loader-container" style={{ minHeight: '100vh' }}>
        <div className="loader"></div>
        <p className="loader-text">Loading CampusX...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    if (!user?.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard/feed" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
       <Route path="/onboarding" element={<OnboardingGuard><OnboardingWizard /></OnboardingGuard>} />
      <Route path="/dashboard/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
      <Route path="/dashboard/profile" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/security" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/rankforge" element={<ProtectedRoute><RankForgeDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/safevoice" element={<ProtectedRoute><SafeVoiceDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/branchconnect" element={<ProtectedRoute><BranchConnectDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/creatorboost" element={<ProtectedRoute><CreatorBoostDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/pulsenotify" element={<ProtectedRoute><PulseNotifyDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/" element={<SmartRedirect />} />
      <Route path="*" element={<SmartRedirect />} />
    </Routes>
  );
}

export default function App() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDark ? '#111430' : '#FFFFFF',
              color: isDark ? '#e8eaed' : '#183020',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #C8DDCB',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: isDark ? '#43e97b' : '#16A34A', secondary: isDark ? '#111430' : '#FFFFFF' } },
            error: { iconTheme: { primary: isDark ? '#f87171' : '#DC2626', secondary: isDark ? '#111430' : '#FFFFFF' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
