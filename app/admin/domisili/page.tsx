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
    <div style={{ maxWidth: 500 }}>
      <h1>Kelola Domisili</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Daftar cabang/domisili yang tersedia untuk dipilih saat upload dokumen, kelola kontak helpdesk, dan assign user.
      </p>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 16 }}>
        <input
          value={newNama}
          onChange={(e) => setNewNama(e.target.value)}
          placeholder="Nama domisili baru"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Menambah...' : 'Tambah'}
        </button>
      </form>

      {message && <p style={{ fontSize: 14, color: 'red' }}>{message}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px 0' }}>{item.nama}</td>
              <td style={{ padding: '10px 0', textAlign: 'right' }}>
                <button onClick={() => handleDelete(item.id, item.nama)} style={{ color: 'red' }}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && <p style={{ color: '#999' }}>Belum ada domisili terdaftar.</p>}
    </div>
  );
}