'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [selectedDomisili, setSelectedDomisili] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomisili, setFilterDomisili] = useState<string>('all');

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
    formData.append('domisili', selectedDomisili);

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

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDomisili =
        filterDomisili === 'all' ||
        (filterDomisili === 'umum' && doc.domisili === null) ||
        doc.domisili === filterDomisili;
      return matchesSearch && matchesDomisili;
    });
  }, [documents, searchQuery, filterDomisili]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Dokumen Knowledge Base</h1>

      <form
        onSubmit={handleUpload}
        className="flex flex-wrap gap-2 items-center mb-6 p-4 border border-gray-200 rounded-lg"
      >
        <input
          type="file"
          name="file"
          accept=".pdf,.docx"
          required
          className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
        />

        <select
          value={selectedDomisili}
          onChange={(e) => setSelectedDomisili(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Semua Cabang (Umum)</option>
          {domisiliOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploading ? 'Memproses...' : 'Upload'}
        </button>
      </form>

      {message && <p className="text-sm mb-4 text-gray-700">{message}</p>}

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Cari judul dokumen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
        />

        <select
          value={filterDomisili}
          onChange={(e) => setFilterDomisili(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">Semua Domisili</option>
          <option value="umum">Umum</option>
          {domisiliOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-500 mb-2">
        Menampilkan {filteredDocuments.length} dari {documents.length} dokumen
      </p>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2 pr-4">Judul</th>
            <th className="text-left py-2 px-4">Domisili</th>
            <th className="text-left py-2 px-4">Status</th>
            <th className="text-left py-2 px-4">Diupload</th>
            <th className="text-left py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredDocuments.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-6 text-gray-500">
                Tidak ada dokumen yang cocok.
              </td>
            </tr>
          ) : (
            filteredDocuments.map((doc) => (
              <tr key={doc.id} className="border-b border-gray-200">
                <td className="py-2 pr-4">
                  <Link href={`/admin/documents/${doc.id}`} className="text-blue-600 hover:underline">
                    {doc.title}
                  </Link>
                </td>
                <td className="py-2 px-4">
                  {doc.domisili ?? <em className="text-gray-400">Umum</em>}
                </td>
                <td className="py-2 px-4">
                  {doc.status}
                  {doc.status === 'failed' && doc.error_message && (
                    <span className="text-red-500 text-xs"> — {doc.error_message}</span>
                  )}
                </td>
                <td className="py-2 px-4 text-sm text-gray-600">
                  {new Date(doc.created_at).toLocaleString('id-ID')}
                </td>
                <td className="py-2">
                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-md hover:bg-red-100"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}