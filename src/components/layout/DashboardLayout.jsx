import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageCircleMore,
  Bot,
  Plug,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import Logo from '../ui/Logo';
import GithubMark from '../ui/GithubMark';
import ThemeToggle from '../ui/ThemeToggle';
import { PlanBadge } from '../ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { NotificationsAPI } from '../../lib/api';
import './DashboardLayout.css';

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/instant', label: 'Instant Chat', icon: MessageCircleMore },
  { to: '/app/hosted', label: 'Hosted Chatbots', icon: Bot, plan: ['pro', 'enterprise'] },
  { to: '/app/api', label: 'Plug & Play API', icon: Plug, plan: ['pro', 'enterprise'] },
  { to: '/app/github', label: 'GitHub Ingestion', icon: GithubMark, plan: ['pro', 'enterprise'] },
  { to: '/app/billing', label: 'Billing', icon: CreditCard },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await NotificationsAPI.unreadCount();
        if (mounted) setUnread(data.unread_count || 0);
      } catch {
        /* ignore */
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="dash-shell">
      <aside className={`dash-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="dash-sidebar-header">
          <Logo size={26} />
          <button className="nav-burger dash-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="dash-nav">
          {NAV_ITEMS.map((item) => {
            const locked = item.plan && !item.plan.includes(user?.plan);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.label === 'Notifications' && unread > 0 && <span className="dash-nav-dot">{unread}</span>}
                {locked && <span className="badge badge-gold dash-nav-lock">PRO</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="flex items-center gap-3">
            <div className="avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--color-navy)', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <PlanBadge plan={user?.plan} />
            </div>
          </div>
          <button className="btn btn-outline btn-sm btn-block mt-4" onClick={handleLogout}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="dash-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="dash-main">
        <header className="dash-topbar">
          <button className="nav-burger dash-burger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/app/notifications')} aria-label="Notifications">
            <span style={{ position: 'relative' }}>
              <Bell size={18} />
              {unread > 0 && <span className="topbar-dot" />}
            </span>
          </button>
          <div className="dash-user-menu" ref={menuRef}>
            <button className="avatar" onClick={() => setMenuOpen((o) => !o)} style={{ border: 'none', cursor: 'pointer' }}>
              {initials}
            </button>
            {menuOpen && (
              <div className="dash-user-dropdown card">
                <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 13.5 }}>{user?.name}</p>
                <p style={{ fontSize: 12.5 }}>{user?.email}</p>
                <hr className="divider" />
                <button className="btn btn-ghost btn-sm btn-block" onClick={() => { setMenuOpen(false); navigate('/app/settings'); }}>
                  Account settings
                </button>
                <button className="btn btn-ghost btn-sm btn-block" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
