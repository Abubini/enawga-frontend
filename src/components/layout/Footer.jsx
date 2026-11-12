import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo size={26} />
          <p style={{ marginTop: 12, maxWidth: 280, fontSize: 13.5 }}>
            Multilingual RAG support platform for Ethiopian businesses and developers — Amharic,
            Oromifaa, English and 100+ languages, powered by hybrid retrieval and GPT-4o.
          </p>
        </div>
        <div>
          <h4 className="footer-heading">Products</h4>
          <ul className="footer-list">
            <li><Link to="/instant">Instant Chat</Link></li>
            <li><Link to="/app/hosted">Hosted Chatbot</Link></li>
            <li><Link to="/app/api">Plug &amp; Play API</Link></li>
            <li><Link to="/app/github">GitHub Ingestion</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="footer-heading">Company</h4>
          <ul className="footer-list">
            <li><Link to="/pricing">Pricing</Link></li>
            <li><a href="/#languages">Languages</a></li>
            <li><a href="/#products">Products</a></li>
          </ul>
        </div>
        <div>
          <h4 className="footer-heading">Payments</h4>
          <p style={{ fontSize: 13.5 }}>Billed in ETB via Telebirr, Ethio Telecom's mobile payment gateway.</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Enawga. All rights reserved.</span>
        <span>Made for Amharic &amp; Oromifaa first.</span>
      </div>
    </footer>
  );
}
