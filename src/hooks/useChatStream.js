import { useCallback, useEffect, useRef, useState } from 'react';
import { streamChat } from '../lib/api';

const HOUR = 60 * 60 * 1000;

/** Remove failed/empty assistant replies together with the user message that caused them. */
function dropFailedTurns(msgs) {
  const out = [];
  for (const m of msgs) {
    const dead = m.role === 'assistant' && (m.failed || !m.content);
    if (dead) {
      if (out.length && out[out.length - 1].role === 'user') out.pop();
      continue;
    }
    out.push(m);
  }
  return out;
}

function readStored(key, ttlMs) {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const { savedAt, messages } = JSON.parse(raw);
    if (!Array.isArray(messages) || Date.now() - savedAt > ttlMs) {
      localStorage.removeItem(key);
      return [];
    }
    return dropFailedTurns(messages);
  } catch {
    return [];
  }
}

/**
 * Generic hook for talking to any of Enawga's streaming chat endpoints.
 *
 * Optional persistence: pass `storageKey` and the conversation is kept in this
 * browser and restored after a refresh. It expires `ttlMs` after the LAST message.
 */
export function useChatStream({
  url,
  buildBody,
  headers,
  storageKey = null,
  ttlMs = 2 * HOUR,
  maxStored = 60,
  historyLimit = 16,
}) {
  const [messages, setMessages] = useState(() => readStored(storageKey, ttlMs));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const assistantIndexRef = useRef(null);
  const loadedRef = useRef(messages); // the array we last loaded from storage (don't re-save it)
  const keyRef = useRef(storageKey);

  // Save (declared BEFORE the load effect on purpose)
  useEffect(() => {
    if (!storageKey || keyRef.current !== storageKey) return;
    if (messages === loadedRef.current) return; // just restored, nothing new to save
    try {
      if (messages.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ savedAt: Date.now(), messages: messages.slice(-maxStored) })
        );
      }
    } catch {
      /* storage full or blocked - chat still works, just not persisted */
    }
  }, [messages, storageKey, maxStored]);

  // Load when the storage key changes (e.g. bot info / session id becomes available)
  useEffect(() => {
    if (keyRef.current === storageKey) return;
    keyRef.current = storageKey;
    const stored = readStored(storageKey, ttlMs);
    loadedRef.current = stored;
    setMessages(stored);
  }, [storageKey, ttlMs]);

  const send = useCallback(
    async (message) => {
      if (!message.trim() || sending) return;
      setError(null);

      const history = dropFailedTurns(messages)
        .slice(-historyLimit)
        .map((m) => ({ role: m.role, content: m.content }));
      const nextMessages = [...messages, { role: 'user', content: message }, { role: 'assistant', content: '' }];
      assistantIndexRef.current = nextMessages.length - 1;
      setMessages(nextMessages);
      setSending(true);

      const body = buildBody ? buildBody(message, history) : { message, history };

      await streamChat(url, body, {
        headers,
        onToken: (token) => {
          setMessages((prev) => {
            const copy = [...prev];
            const idx = assistantIndexRef.current;
            if (copy[idx]) copy[idx] = { ...copy[idx], content: copy[idx].content + token };
            return copy;
          });
        },
        onDone: () => setSending(false),
        onError: (msg) => {
          setError(msg);
          setSending(false);
          setMessages((prev) => {
            const copy = [...prev];
            const idx = assistantIndexRef.current;
            if (copy[idx] && !copy[idx].content) {
              copy[idx] = { ...copy[idx], content: '', failed: true, error: msg };
            }
            return copy;
          });
        },
      });
    },
    [url, buildBody, headers, messages, sending, historyLimit]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, send, sending, error, reset, setMessages };
}