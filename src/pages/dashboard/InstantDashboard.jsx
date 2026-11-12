import InstantChatPanel from '../../components/chat/InstantChatPanel';

export default function InstantDashboard() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Instant Chat</h1>
          <p>Spin up an ephemeral, session-based RAG chatbot from a single document — free on every plan.</p>
        </div>
      </div>
      <InstantChatPanel embedded />
    </div>
  );
}
