'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    try {
      // ambil access token dari session admin yang lagi login
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sesi login tidak ditemukan, silakan login ulang.');
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          conversationId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Request gagal (${res.status})`);
      }

      const newConvId = res.headers.get('X-Conversation-Id');
      if (newConvId) setConversationId(newConvId);

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        accumulated += chunkText;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
      }
    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: `Error: ${err.message}` };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', height: '80vh' }}>
      <h1>Test Chatbot</h1>

      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        {messages.length === 0 && (
          <p style={{ color: '#999' }}>Belum ada percakapan. Coba tanya sesuatu.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 12, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: 12,
                background: msg.role === 'user' ? '#333' : '#f0f0f0',
                color: msg.role === 'user' ? '#fff' : '#000',
                maxWidth: '80%',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya sesuatu..."
          disabled={loading}
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? '...' : 'Kirim'}
        </button>
      </form>

      {conversationId && (
        <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
          Conversation ID: {conversationId}
        </p>
      )}
    </div>
  );
}