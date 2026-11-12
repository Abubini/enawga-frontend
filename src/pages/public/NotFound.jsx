import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export default function NotFound() {
  return (
    <div>
      <Navbar />
      <div className="container text-center" style={{ padding: '100px 24px' }}>
        <div className="empty-icon" style={{ margin: '0 auto 20px' }}><Compass size={26} /></div>
        <h1 style={{ fontSize: 30, marginBottom: 10 }}>Page not found</h1>
        <p style={{ marginBottom: 24 }}>The page you're looking for doesn't exist or may have moved.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
      <Footer />
    </div>
  );
}
