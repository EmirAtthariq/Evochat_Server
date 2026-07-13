'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  status: string;
  error_message: string | null;
  domisili: string | null;
  created_at: string;
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [domisiliOptions, setDomisiliOptions] = useState<string[]>([]);
  const [selectedDomisili, setSelectedDomisili] = useState<string>(''); // '' = umum
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function fetchDocuments() {
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocuments(data);
  }

  async function fetchDomisiliOptions() {
    const res = await fetch('/api/domisili-list');
    const data = await res.json();
    setDomisiliOptions(data);
  }

  useEffect(() => {
    fetchDocuments();
    fetchDomisiliOptions();
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
    formData.append('domisili', selectedDomisili); // kosong = umum/semua cabang

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
        setSelectedDomisili('');
        fetchDocuments();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    const confirmed = confirm(`Yakin mau hapus dokumen "${title}"? Aksi ini tidak bisa dibatalkan.`);
    if (!confirmed) return;

    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });

    if (res.ok) {
      setMessage(`Dokumen "${title}" berhasil dihapus.`);
      fetchDocuments();
    } else {
      const data = await res.json();
      setMessage(`Gagal menghapus: ${data.error}`);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Dokumen Knowledge Base</h1>

      <form onSubmit={handleUpload} style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="file" name="file" accept=".pdf,.docx" required />

        <select
          value={selectedDomisili}
          onChange={(e) => setSelectedDomisili(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="">Semua Cabang (Umum)</option>
          {domisiliOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <button type="submit" disabled={uploading}>
          {uploading ? 'Memproses...' : 'Upload'}
        </button>
      </form>

      {message && <p>{message}</p>}

      <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ textAlign: 'left' }}>Judul</th>
            <th style={{ textAlign: 'left' }}>Domisili</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Diupload</th>
            <th style={{ textAlign: 'left' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>
                <Link href={`/admin/documents/${doc.id}`} style={{ color: '#4093f7', textDecoration: 'underline' }}>
                  {doc.title}
                </Link>
              </td>
              <td>{doc.domisili ?? <em style={{ color: '#999' }}>Umum</em>}</td>
              <td>
                {doc.status}
                {doc.status === 'failed' && doc.error_message && (
                  <span style={{ color: 'red', fontSize: 12 }}> — {doc.error_message}</span>
                )}
              </td>
              <td>{new Date(doc.created_at).toLocaleString('id-ID')}</td>
              <td>
                <button onClick={() => handleDelete(doc.id, doc.title)} style={{ color: 'red' }}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}