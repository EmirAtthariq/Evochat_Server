'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Chunk {
  id: string;
  content: string;
  heading_path: string;
  chunk_index: number;
}

interface DocumentDetail {
  id: string;
  title: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/${id}/chunks`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setLoading(false);
          return;
        }
        setDocument(data.document);
        setChunks(data.chunks);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Memuat...</p>;
  if (!document) return <p>Dokumen tidak ditemukan.</p>;

  return (
    <div style={{ maxWidth: 800 }}>
      <button onClick={() => router.push('/admin/documents')} style={{ marginBottom: 16 }}>
        ← Kembali
      </button>

      <h1>{document.title}</h1>
      <p style={{ color: '#666' }}>
        Status: <strong>{document.status}</strong> · {chunks.length} chunk
      </p>
      {document.status === 'failed' && document.error_message && (
        <p style={{ color: 'red' }}>Error: {document.error_message}</p>
      )}

      <h2 style={{ marginTop: 24 }}>Chunks</h2>

      {chunks.length === 0 && <p style={{ color: '#999' }}>Belum ada chunk (dokumen mungkin masih diproses atau gagal).</p>}

      {chunks.map((chunk) => (
        <div
          key={chunk.id}
          style={{
            border: '1px solid #eee',
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#999' }}>
              Chunk #{chunk.chunk_index}
            </span>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>
              {chunk.heading_path || '(tanpa heading)'}
            </span>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{chunk.content}</p>
        </div>
      ))}
    </div>
  );
}