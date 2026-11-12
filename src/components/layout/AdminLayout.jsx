import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Gauge, Users, HeartPulse, LogOut, ExternalLink } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { useAdmin } from '../../context/AdminContext';
import './DashboardLayout.css';
import './AdminLayout.css';

const NAV = [
  { to: '/admin', label: 'Overview', icon: Gauge, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/health', label: 'System health', icon: HeartPulse },
];

export default function AdminLayout() {
  const { logout } = useAdmin();
  const navigate = useNavigate();

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar admin-sidebar">
        <div className="dash-sidebar-header">
          <Logo size={26} />
        </div>
        <div style={{ padding: '0 20px' }}>
          <span className="badge badge-danger">Admin console</span>
        </div>
        <nav className="dash-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="dash-sidebar-footer">
          <button className="btn btn-outline btn-sm btn-block" onClick={() => navigate('/app')}>
            <ExternalLink size={14} /> Back to app
          </button>
          <button className="btn btn-danger btn-sm btn-block mt-2" onClick={() => { logout(); navigate('/admin/login'); }}>
            <LogOut size={14} /> Exit admin
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}