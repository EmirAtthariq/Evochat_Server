'use client';

import { useState, useEffect } from 'react';

interface Document {
  id: string;
  title: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function fetchDocuments() {
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocuments(data);
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setMessage('Pilih file dulu');
      return;
    }

    setUploading(true);
    setMessage('Mengupload dan memproses...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`);
      } else {
        setMessage(`Berhasil! ${data.chunks} chunk dibuat.`);
        form.reset();
        fetchDocuments(); // refresh list
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Admin - Knowledge Base</h1>

      <form onSubmit={handleUpload} style={{ marginBottom: 24 }}>
        <input type="file" name="file" accept=".pdf,.docx" required />
        <button type="submit" disabled={uploading} style={{ marginLeft: 8 }}>
          {uploading ? 'Memproses...' : 'Upload'}
        </button>
      </form>

      {message && <p>{message}</p>}

      <h2>Dokumen</h2>
      <button onClick={fetchDocuments}>Refresh</button>

      <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ textAlign: 'left' }}>Judul</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Diupload</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{doc.title}</td>
              <td>
                {doc.status}
                {doc.status === 'failed' && doc.error_message && (
                  <span style={{ color: 'red', fontSize: 12 }}> — {doc.error_message}</span>
                )}
              </td>
              <td>{new Date(doc.created_at).toLocaleString('id-ID')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}