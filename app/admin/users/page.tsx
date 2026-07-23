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
  const [filterDomisili, setFilterDomisili] = useState('');

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
  const filteredUsers = filterDomisili
  ? users.filter((u) => u.domisili === filterDomisili)
  : users;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Kelola User</h1>
      <p className="text-sm text-gray-500 mb-4">
        Assign nama dan domisili untuk tiap akun yang terdaftar. Domisili menentukan knowledge base dan kontak helpdesk yang bisa diakses user.
      </p>

      {message && <p className="text-sm text-gray-700 mb-2">{message}</p>}
      <div className="flex flex-wrap gap-2 items-center mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-600">Filter Domisili:</span>

        <select
          value={filterDomisili}
          onChange={(e) => setFilterDomisili(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Semua Domisili</option>
          {domisiliList.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {filterDomisili && (
          <button
            type="button"
            onClick={() => setFilterDomisili('')}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 underline"
          >
            Reset Filter
          </button>
        )}
      </div>
            <datalist id="domisili-options">
        {domisiliList.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      <table className="w-full mt-4 border-collapse">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2 pr-4">Email</th>
            <th className="text-left py-2 px-4">Nama</th>
            <th className="text-left py-2 px-4">Domisili</th>
            <th className="text-left py-2 px-4">Terdaftar</th>
            <th className="text-left py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
            const isEditing = editingId === user.id;

            return (
              <tr key={user.id} className="border-b border-gray-200">
                <td className="py-2 pr-4">{user.email}</td>

                <td className="py-2 px-4">
                  {isEditing ? (
                    <input
                      value={editForm.nama}
                      onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                      placeholder="Nama"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  ) : (
                    user.nama ?? <em className="text-gray-400">Belum diisi</em>
                  )}
                </td>

                <td className="py-2 px-4">
                  {isEditing ? (
                    <input
                      list="domisili-options"
                      value={editForm.domisili}
                      onChange={(e) => setEditForm({ ...editForm, domisili: e.target.value })}
                      placeholder="Domisili"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  ) : (
                    user.domisili ?? <em className="text-gray-400">Belum diisi</em>
                  )}
                </td>

                <td className="py-2 px-4 text-sm text-gray-500">
                  {new Date(user.registered_at).toLocaleDateString('id-ID')}
                </td>

                <td className="py-2">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(user.id)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-100 disabled:opacity-50"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(user)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    {filteredUsers.length === 0 && (
      <p className="text-gray-400 mt-4">
        {filterDomisili ? 'Tidak ada user dengan domisili ini.' : 'Belum ada user terdaftar.'}
      </p>
    )}
    </div>
  );
}