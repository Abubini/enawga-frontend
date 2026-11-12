import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/Primitives';

export default function ProtectedRoute({ children, requirePlan }) {
  const { isAuthenticated, booting, user } = useAuth();
  const location = useLocation();

  if (booting) return <PageLoader label="Loading your workspace…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requirePlan && requirePlan.length && !requirePlan.includes(user.plan)) {
    return <Navigate to="/app/billing" replace state={{ upgradeRequired: true }} />;
  }

  return children;
}
