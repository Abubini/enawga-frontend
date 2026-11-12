import { Link } from 'react-router-dom';
import {
  MessageCircleMore,
  Bot,
  Plug,
  ArrowRight,
  Check,
  Languages,
  ShieldCheck,
  Layers,
  GitPullRequestArrow,
  Sparkles,
  Globe2,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import GithubMark from '../../components/ui/GithubMark';
import Footer from '../../components/layout/Footer';
import { PLANS } from '../../lib/plans';
import './Landing.css';

const PRODUCTS = [
  {
    icon: MessageCircleMore,
    title: 'Instant Chat',
    tag: 'Free',
    desc: 'Upload a document and get a live RAG chatbot in seconds — no account required.',
    to: '/instant',
  },
  {
    icon: Bot,
    title: 'Hosted Chatbot',
    tag: 'Pro+',
    desc: 'A permanent, brandable chatbot with a public URL for your business or product.',
    to: '/register',
  },
  {
    icon: Plug,
    title: 'Plug & Play API',
    tag: 'Pro+',
    desc: 'REST API + embeddable widget for developers building support into their own app.',
    to: '/register',
  },
  {
    icon: GithubMark,
    title: 'GitHub Ingestion',
    tag: 'Pro+',
    desc: 'Connect a repo — docs stay synced automatically as commits land, with dev alerts.',
    to: '/register',
  },
];

const FEATURES = [
  {
    icon: Languages,
    title: 'Multilingual by default',
    desc: 'Amharic and Oromifaa retrieval and generation, powered by bge-m3, NLLB-200 and GPT-4o — cross-lingual by construction.',
  },
  {
    icon: Layers,
    title: 'Hybrid retrieval + re-ranking',
    desc: 'Dense + BM25 sparse search fused with Reciprocal Rank Fusion, then re-scored by a cross-encoder for the best 5 chunks.',
  },
  {
    icon: GitPullRequestArrow,
    title: 'Incremental doc sync',
    desc: 'GitHub commits only re-embed the chunks that changed — untouched vectors are never reprocessed.',
  },
  {
    icon: ShieldCheck,
    title: 'Namespace isolation',
    desc: 'Every session, bot and project gets its own vector namespace. Cross-tenant access is impossible by construction.',
  },
  {
    icon: Sparkles,
    title: 'MCP-native',
    desc: 'An open Model Context Protocol server exposes retrieval, sync status and file lists as callable tools for any LLM.',
  },
  {
    icon: Globe2,
    title: 'Built for Ethiopia',
    desc: 'ETB billing through Telebirr\'s H5 payment flow — pay directly from your phone, no card required.',
  },
];

const LANGUAGES = [
  { name: 'Amharic', code: 'አማርኛ' },
  { name: 'Oromifaa', code: 'Oromoo' },
  { name: 'English', code: 'EN' },
  { name: 'Arabic', code: 'العربية' },
  { name: 'French', code: 'FR' },
  { name: '100+ more', code: 'bge-m3' },
];

export default function Landing() {
  return (
    <div>
      <Navbar />

      <section className="hero">
        <div className="container hero-inner">
          <span className="eyebrow"><Sparkles size={14} /> Multilingual RAG, purpose-built for Ethiopia</span>
          <h1>
            Support that understands <span className="accent">Amharic</span>, Oromifaa, and everyone else.
          </h1>
          <p className="lead">
            Enawga turns your documents, GitHub repos, and knowledge base into a multilingual AI
            support assistant — instant chat sessions, hosted chatbots, a developer API, and
            live-synced GitHub docs, all on one retrieval engine.
          </p>
          <div className="hero-actions">
            <Link to="/instant" className="btn btn-primary btn-lg">
              Try Instant Chat free <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg">
              Create an account
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>100+</strong><span>Languages supported</span></div>
            <div className="hero-stat"><strong>&lt;5s</strong><span>GitHub webhook sync</span></div>
            <div className="hero-stat"><strong>0.35</strong><span>Confidence fallback threshold</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Architecture</span>
            <h2>One RAG engine, four ways to ship support</h2>
            <p>Every product routes through the same gateway into a shared ingestion, retrieval and
              generation pipeline — so quality and behavior stay consistent everywhere.</p>
          </div>
          <div className="arch-diagram">
            <div className="arch-row"><span className="arch-label">Client</span> Next.js Web · Mobile Browser · Developer CLI</div>
            <div className="arch-connector" />
            <div className="arch-row"><span className="arch-label">Gateway</span> Rate limiting · Auth middleware · Request routing</div>
            <div className="arch-connector" />
            <div className="arch-row"><span className="arch-label">Service</span> Instant Chat · Hosted Chatbot · Plugin API · GitHub Ingestion</div>
            <div className="arch-connector" />
            <div className="arch-row core"><span className="arch-label">Engine</span> Ingestion · Hybrid Retrieval · Multilingual · LLM Generation</div>
            <div className="arch-connector" />
            <div className="arch-row"><span className="arch-label">Storage</span> Qdrant · PostgreSQL · Redis · Cloudflare R2</div>
          </div>
        </div>
      </section>

      <section className="section" id="products" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border-soft)', borderBottom: '1px solid var(--color-border-soft)' }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Products</span>
            <h2>Four products. One knowledge base.</h2>
            <p>Start free with Instant Chat, then graduate to hosted bots, a developer API, or
              always-in-sync GitHub documentation search.</p>
          </div>
          <div className="products-grid">
            {PRODUCTS.map((p) => (
              <Link to={p.to} key={p.title} className="card card-hover product-card">
                <div className="product-icon"><p.icon size={22} /></div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <span className={`badge plan-tag ${p.tag === 'Free' ? 'badge-success' : 'badge-gold'}`}>{p.tag}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Under the hood</span>
            <h2>Retrieval built for accuracy, not vibes</h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="card feature-card">
                <div className="product-icon"><f.icon size={20} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="languages" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border-soft)', borderBottom: '1px solid var(--color-border-soft)' }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Multilingual architecture</span>
            <h2>Ask in Amharic, retrieve from English docs, answer in Amharic</h2>
            <p>Cross-lingual retrieval runs at every pipeline stage by default — no manual translation
              step required for most queries.</p>
          </div>
          <div className="lang-grid">
            {LANGUAGES.map((l) => (
              <div key={l.name} className="lang-chip">
                <strong>{l.name}</strong>
                <span>{l.code}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Pricing</span>
            <h2>Simple plans, billed in ETB</h2>
            <p>Pay directly from your phone with Telebirr — no card required, no auto-renewal surprises.</p>
          </div>
          <div className="pricing-grid">
            {PLANS.map((p) => (
              <div key={p.id} className={`card price-card ${p.featured ? 'featured' : ''}`}>
                {p.featured && <span className="featured-tag">Most popular</span>}
                <h3>{p.name}</h3>
                <p className="price-sub">{p.tagline}</p>
                <div className="price-amount">
                  {p.monthlyEtb === 0 ? 'Free' : `${p.monthlyEtb.toLocaleString()} ETB`}
                  {p.monthlyEtb > 0 && <span>/mo</span>}
                </div>
                {p.monthlyEtb > 0 && (
                  <p className="price-sub">or {p.annualEtb.toLocaleString()} ETB billed yearly</p>
                )}
                <ul className="price-features">
                  {p.features.map((f) => (
                    <li key={f}><Check size={15} /> {f}</li>
                  ))}
                </ul>
                <Link to="/register" className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'} btn-block`}>
                  {p.monthlyEtb === 0 ? 'Start free' : 'Get started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <h2>Give your product multilingual support today</h2>
            <p>Free to try, no card required. Upgrade to Pro whenever you're ready to go live.</p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <Link to="/instant" className="btn btn-primary btn-lg">Try Instant Chat</Link>
              <Link to="/register" className="btn btn-outline btn-lg" style={{ borderColor: 'var(--color-primary-md)', color: 'var(--color-bg)' }}>
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
