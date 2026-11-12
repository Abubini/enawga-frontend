import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import InstantChatPanel from '../../components/chat/InstantChatPanel';

export default function InstantChatPage() {
  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '48px 24px 80px' }}>
        <div className="mb-6">
          <span className="eyebrow">Free · No account needed</span>
          <h1 style={{ fontSize: 30, marginTop: 10 }}>Try Instant Chat</h1>
          <p style={{ marginTop: 8, maxWidth: 560 }}>
            Upload a document and get a live, multilingual RAG chatbot in seconds.
          </p>
        </div>
        <InstantChatPanel />
      </div>
      <Footer />
    </div>
  );
}
