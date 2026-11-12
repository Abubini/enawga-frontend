import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { PLANS } from '../../lib/plans';
import './Landing.css';

export default function Pricing() {
  const [cycle, setCycle] = useState('monthly');

  return (
    <div>
      <Navbar />
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container section-head">
          <span className="eyebrow">Pricing</span>
          <h2>Plans that scale with your support volume</h2>
          <p>All charges are in Ethiopian Birr (ETB), processed through Telebirr's H5 payment flow.</p>

          <div className="flex items-center justify-content-center gap-3 mt-6" style={{ justifyContent: 'center' }}>
            <button
              className={`btn btn-sm ${cycle === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`btn btn-sm ${cycle === 'annual' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCycle('annual')}
            >
              Annual <span className="badge badge-success" style={{ marginLeft: 6 }}>2 months free</span>
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="pricing-grid">
            {PLANS.map((p) => {
              const price = cycle === 'annual' ? p.annualEtb : p.monthlyEtb;
              const per = cycle === 'annual' ? '/yr' : '/mo';
              return (
                <div key={p.id} className={`card price-card ${p.featured ? 'featured' : ''}`}>
                  {p.featured && <span className="featured-tag">Most popular</span>}
                  <h3>{p.name}</h3>
                  <p className="price-sub">{p.tagline}</p>
                  <div className="price-amount">
                    {price === 0 ? 'Free' : `${price.toLocaleString()} ETB`}
                    {price > 0 && <span>{per}</span>}
                  </div>
                  <ul className="price-features">
                    {p.features.map((f) => (
                      <li key={f}><Check size={15} /> {f}</li>
                    ))}
                  </ul>
                  <Link to="/register" className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'} btn-block`}>
                    {p.monthlyEtb === 0 ? 'Start free' : 'Get started'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
