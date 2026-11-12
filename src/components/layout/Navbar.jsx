import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const links = [
  { to: '/#products', label: 'Products' },
  { to: '/#languages', label: 'Languages' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/instant', label: 'Try Instant Chat' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="nav-wrap">
      <div className="container nav-inner">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="nav-links">
          {links.map((l) => (
            <a key={l.to} href={l.to} onClick={(e) => {
              if (l.to.startsWith('/#') && window.location.pathname === '/') {
                e.preventDefault();
                document.querySelector(l.to.slice(1))?.scrollIntoView({ behavior: 'smooth' });
              }
            }}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          {isAuthenticated ? (
            <button className="btn btn-primary" onClick={() => navigate('/app')}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="nav-mobile container">
          {links.map((l) => (
            <a key={l.to} href={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 mt-4">
            {isAuthenticated ? (
              <button className="btn btn-primary btn-block" onClick={() => navigate('/app')}>
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-block" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
