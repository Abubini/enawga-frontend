import { Link } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import ThemeToggle from '../../components/ui/ThemeToggle';
import './Auth.css';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-panel-top">
          <Link to="/"><Logo /></Link>
          <ThemeToggle />
        </div>

        <div className="auth-form-wrap fade-in-up">
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </div>

      <div className="auth-side">
        <div className="auth-side-content">
          <span className="eyebrow" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            Enawga
          </span>
          <h2>Multilingual AI support, built for Ethiopia.</h2>
          <p>
            Amharic and Oromifaa retrieval, hybrid search with re-ranking, and GitHub-synced
            documentation — one engine behind Instant Chat, Hosted Chatbots, the Plug &amp; Play API
            and GitHub Ingestion.
          </p>
          <ul className="auth-side-list">
            <li>Namespace-isolated Qdrant vector storage</li>
            <li>GPT-4o generation with grounded, cited context</li>
            <li>ETB billing via Telebirr — no card required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
