'use client';

import { useState, useEffect } from 'react';

interface AppUser {
  id: string;
  email: string;
  registered_at: string;
  nama: string | null;
  domisili: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [domisiliList, setDomisiliList] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nama: '', domisili: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function fetchUsers() {
    const res = await fetch('/api/admin/users');
    const data: AppUser[] = await res.json();
    setUsers(data);
  }
  async function fetchDomisiliOptions() {
  const res = await fetch('/api/domisili-list');
  const data = await res.json();
  setDomisiliList(data);
}
  useEffect(() => {
    fetchUsers();
    fetchDomisiliOptions();
  }, []);

  function startEdit(user: AppUser) {
    setEditingId(user.id);
    setEditForm({ nama: user.nama ?? '', domisili: user.domisili ?? '' });
    setMessage('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ nama: '', domisili: '' });
  }

  async function handleSave(id: string) {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        setMessage('Gagal menyimpan perubahan.');
      } else {
        setMessage('Berhasil disimpan.');
        cancelEdit();
        fetchUsers();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Kelola User</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Assign nama dan domisili untuk tiap akun yang terdaftar. Domisili menentukan knowledge base dan kontak helpdesk yang bisa diakses user.
      </p>

      {message && <p style={{ fontSize: 14 }}>{message}</p>}

      <datalist id="domisili-options">
        {domisiliList.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '8px 16px 8px 0' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '8px 16px' }}>Nama</th>
            <th style={{ textAlign: 'left', padding: '8px 16px' }}>Domisili</th>
            <th style={{ textAlign: 'left', padding: '8px 16px' }}>Terdaftar</th>
            <th style={{ textAlign: 'left', padding: '8px 0' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isEditing = editingId === user.id;

            return (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 16px 8px 0' }}>{user.email}</td>

                <td style={{ padding: '8px 16px' }}>
                  {isEditing ? (
                    <input
                      value={editForm.nama}
                      onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                      placeholder="Nama"
                      style={{ padding: 6, width: '100%' }}
                    />
                  ) : (
                    user.nama ?? <em style={{ color: '#999' }}>Belum diisi</em>
                  )}
                </td>

                <td style={{ padding: '8px 16px' }}>
                  {isEditing ? (
                    <input
                      list="domisili-options"
                      value={editForm.domisili}
                      onChange={(e) => setEditForm({ ...editForm, domisili: e.target.value })}
                      placeholder="Domisili"
                      style={{ padding: 6, width: '100%' }}
                    />
                  ) : (
                    user.domisili ?? <em style={{ color: '#999' }}>Belum diisi</em>
                  )}
                </td>

                <td style={{ padding: '8px 16px', fontSize: 13, color: '#666' }}>
                  {new Date(user.registered_at).toLocaleDateString('id-ID')}
                </td>

                <td style={{ padding: '8px 0' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleSave(user.id)} disabled={saving}>
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button onClick={cancelEdit} disabled={saving}>
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(user)}>Edit</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {users.length === 0 && <p style={{ color: '#999', marginTop: 16 }}>Belum ada user terdaftar.</p>}
    </div>
  );
}