import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function ProtectedAdminRoute({ children }) {
  const { authorized } = useAdmin();
  if (!authorized) return <Navigate to="/admin/login" replace />;
  return children;
}