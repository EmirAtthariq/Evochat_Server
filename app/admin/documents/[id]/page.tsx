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

  if (loading) return <p className="text-gray-500">Memuat...</p>;
  if (!document) return <p className="text-gray-500">Dokumen tidak ditemukan.</p>;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push('/admin/documents')}
        className="mb-4 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
      >
        ← Kembali
      </button>

      <h1 className="text-2xl font-bold">{document.title}</h1>
      <p className="text-gray-500 mt-1">
        Status: <strong className="text-gray-700">{document.status}</strong> · {chunks.length} chunk
      </p>
      {document.status === 'failed' && document.error_message && (
        <p className="text-red-500 mt-1">Error: {document.error_message}</p>
      )}

      <h2 className="text-lg font-semibold mt-6 mb-3">Chunks</h2>

      {chunks.length === 0 && (
        <p className="text-gray-400">Belum ada chunk (dokumen mungkin masih diproses atau gagal).</p>
      )}

      {chunks.map((chunk) => (
        <div
          key={chunk.id}
          className="border border-gray-200 rounded-lg p-4 mb-3"
        >
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400">
              Chunk #{chunk.chunk_index}
            </span>
            <span className="text-xs font-bold text-gray-600">
              {chunk.heading_path || '(tanpa heading)'}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-800">{chunk.content}</p>
        </div>
      ))}
    </div>
  );
}