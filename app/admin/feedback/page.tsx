'use client';

import { useState, useEffect, useCallback } from 'react';

interface FeedbackItem {
  id: string;
  answer: string;
  feedback: 'up' | 'down';
  created_at: string;
  question: string | null;
}

type FilterType = 'all' | 'up' | 'down';

const PAGE_SIZE = 20;

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      type: filter,
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    const res = await fetch(`/api/admin/feedback?${params}`);
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [filter, page]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  function handleFilterChange(next: FilterType) {
    setFilter(next);
    setPage(0); // reset ke halaman pertama tiap ganti filter
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Feedback</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Daftar jawaban assistant yang di-upvote atau downvote user, beserta pertanyaan yang memicunya.
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {(['all', 'up', 'down'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className="hover:opacity-90 transition-opacity"
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #93c5fd',
              background: filter === f ? '#2563eb' : '#fff',
              color: filter === f ? '#fff' : '#2563eb',
              cursor: 'pointer',
            }}
          >
            {f === 'all' ? 'Semua' : f === 'up' ? '👍 Positif' : '👎 Negatif'}
          </button>
        ))}
      </div>

      {loading && <p style={{ marginTop: 16 }}>Memuat...</p>}
      {!loading && items.length === 0 && (
        <p style={{ color: '#999', marginTop: 16 }}>Belum ada feedback.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid #eee',
              borderLeft: `4px solid ${item.feedback === 'up' ? '#2e7d32' : '#c62828'}`,
              borderRadius: 8,
              padding: 16,
              background: item.feedback === 'up' ? '#f0fdf4' : '#fef2f2',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                {new Date(item.created_at).toLocaleString('id-ID')}
              </span>
              <span style={{ fontSize: 13 }}>
                {item.feedback === 'up' ? '👍' : '👎'}
              </span>
            </div>
            <p style={{ fontWeight: 600, marginBottom: 4, color: '#111' }}>
              Q: {item.question ?? <em style={{ color: '#999' }}>(tidak ditemukan)</em>}
            </p>
                <p style={{ color: '#333' }}>A: {item.answer}</p>
          </div>
        ))}
      </div>

      {!loading && total > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="disabled:opacity-40 disabled:cursor-not-allowed hover:text-blue-600"
          >
            Sebelumnya
          </button>
          <span style={{ fontSize: 14 }}>
            Halaman {page + 1} dari {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="disabled:opacity-40 disabled:cursor-not-allowed hover:text-blue-600"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}