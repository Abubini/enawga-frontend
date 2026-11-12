import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';

import Landing from './pages/public/Landing';
import Pricing from './pages/public/Pricing';
import NotFound from './pages/public/NotFound';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OAuthCallback from './pages/auth/OAuthCallback';
import GoogleCallbackBridge from './pages/auth/GoogleCallbackBridge';

import InstantChatPage from './pages/chat/InstantChatPage';
import PublicBotChat from './pages/chat/PublicBotChat';

import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Overview from './pages/dashboard/Overview';
import InstantDashboard from './pages/dashboard/InstantDashboard';
import HostedList from './pages/dashboard/HostedList';
import HostedDetail from './pages/dashboard/HostedDetail';
import ApiList from './pages/dashboard/ApiList';
import ApiDetail from './pages/dashboard/ApiDetail';
import GitHubList from './pages/dashboard/GitHubList';
import GitHubDetail from './pages/dashboard/GitHubDetail';
import Billing from './pages/dashboard/Billing';
import BillingSuccess from './pages/dashboard/BillingSuccess';
import Notifications from './pages/dashboard/Notifications';
import Settings from './pages/dashboard/Settings';

import AdminLayout from './components/layout/AdminLayout';
import ProtectedAdminRoute from './components/layout/ProtectedAdminRoute';
import AdminLogin from './pages/admin/AdminLogin';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminHealth from './pages/admin/AdminHealth';

import ProjectAnalytics from './pages/dashboard/ProjectAnalytics';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
          <AdminProvider>
            <Routes>
              {/* Public marketing */}
              <Route path="/" element={<Landing />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/instant" element={<InstantChatPage />} />
              <Route path="/bot/:botId" element={<PublicBotChat />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/auth/google/callback" element={<GoogleCallbackBridge />} />

              {/* Billing return (Telebirr) */}
              <Route path="/billing/success" element={<BillingSuccess />} />

              {/* Dashboard */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Overview />} />
                <Route path="projects/:projectId" element={<ProjectAnalytics />} />
                <Route path="instant" element={<InstantDashboard />} />
                <Route path="hosted" element={<HostedList />} />
                <Route path="hosted/:botId" element={<HostedDetail />} />
                <Route path="api" element={<ApiList />} />
                <Route path="api/:projectId" element={<ApiDetail />} />
                <Route path="github" element={<GitHubList />} />
                <Route path="github/:repoId" element={<GitHubDetail />} />
                <Route path="billing" element={<Billing />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Admin console — gated by X-Admin-Key, separate from user auth */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout />
                  </ProtectedAdminRoute>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="health" element={<AdminHealth />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AdminProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}