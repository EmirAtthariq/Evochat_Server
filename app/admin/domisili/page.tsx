'use client';

import { useState, useEffect } from 'react';

interface DomisiliItem {
  id: string;
  nama: string;
}

export default function AdminDomisiliPage() {
  const [items, setItems] = useState<DomisiliItem[]>([]);
  const [newNama, setNewNama] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function fetchItems() {
    const res = await fetch('/api/admin/domisili');
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newNama.trim()) return;

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/domisili', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: newNama.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`);
      } else {
        setNewNama('');
        fetchItems();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, nama: string) {
    const confirmed = confirm(
      `Yakin mau hapus domisili "${nama}"?\n\nCatatan: ini tidak menghapus dokumen/kontak/user yang sudah pakai nama domisili ini, hanya menghapusnya dari daftar pilihan.`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/admin/domisili/${id}`, { method: 'DELETE' });

    if (res.ok) {
      fetchItems();
    } else {
      setMessage('Gagal menghapus domisili.');
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-1">Kelola Domisili</h1>
      <p className="text-sm text-gray-500 mb-4">
        Daftar cabang/domisili yang tersedia untuk dipilih saat upload dokumen, kelola kontak helpdesk, dan assign user.
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          value={newNama}
          onChange={(e) => setNewNama(e.target.value)}
          placeholder="Nama domisili baru"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {saving ? 'Menambah...' : 'Tambah'}
        </button>
      </form>

      {message && <p className="text-sm text-red-500 mb-3">{message}</p>}

      <table className="w-full border-collapse">
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-2.5">{item.nama}</td>
              <td className="py-2.5 text-right">
                <button
                  onClick={() => handleDelete(item.id, item.nama)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-md hover:bg-red-100"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && <p className="text-gray-400 mt-3">Belum ada domisili terdaftar.</p>}
    </div>
  );
}