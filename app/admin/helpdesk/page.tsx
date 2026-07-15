'use client';

import { useState, useEffect } from 'react';

interface Contact {
  id: string;
  domisili: string;
  label: string;
  pic_name: string | null;
  whatsapp_number: string;
  created_at: string;
}

const emptyForm = { domisili: '', label: '', pic_name: '', whatsapp_number: '' };

export default function AdminHelpdeskPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [domisiliList, setDomisiliList] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchContacts() {
    const res = await fetch('/api/admin/helpdesk-contacts');
    const data = await res.json();
    setContacts(data);
    setDomisiliList(Array.from(new Set(data.map((c: Contact) => c.domisili))));
  }

  useEffect(() => {
    fetchContacts();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(contact: Contact) {
    setForm({
      domisili: contact.domisili,
      label: contact.label,
      pic_name: contact.pic_name ?? '',
      whatsapp_number: contact.whatsapp_number,
    });
    setEditingId(contact.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(
        editingId ? `/api/admin/helpdesk-contacts/${editingId}` : '/api/admin/helpdesk-contacts',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`);
      } else {
        setMessage(editingId ? 'Kontak berhasil diperbarui.' : 'Kontak berhasil ditambahkan.');
        resetForm();
        fetchContacts();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, label: string) {
    const confirmed = confirm(`Yakin mau hapus kontak "${label}"?`);
    if (!confirmed) return;

    const res = await fetch(`/api/admin/helpdesk-contacts/${id}`, { method: 'DELETE' });

    if (res.ok) {
      setMessage(`Kontak "${label}" berhasil dihapus.`);
      fetchContacts();
      if (editingId === id) resetForm();
    } else {
      setMessage('Gagal menghapus kontak.');
    }
  }

  // grouping berdasarkan domisili biar rapi ditampilkan
  const grouped = contacts.reduce<Record<string, Contact[]>>((acc, c) => {
    (acc[c.domisili] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Kelola Domisili & Kontak Helpdesk</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 16,
          marginBottom: 8,
          padding: 16,
          border: '1px solid #eee',
          borderRadius: 8,
        }}
      >
        <input
          list="domisili-options"
          placeholder="Domisili"
          value={form.domisili}
          onChange={(e) => setForm({ ...form, domisili: e.target.value })}
          required
          style={{ padding: 8, flex: '1 1 150px' }}
        />
        <datalist id="domisili-options">
          {domisiliList.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <input
          placeholder="Label"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          required
          style={{ padding: 8, flex: '1 1 150px' }}
        />

        <input
          placeholder="Nama PIC (opsional)"
          value={form.pic_name}
          onChange={(e) => setForm({ ...form, pic_name: e.target.value })}
          style={{ padding: 8, flex: '1 1 150px' }}
        />

        <input
          placeholder="Nomor WA (628xxxxxxxxxx)"
          value={form.whatsapp_number}
          onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
          required
          style={{ padding: 8, flex: '1 1 150px' }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={saving}>
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Kontak'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Batal
            </button>
          )}
        </div>
      </form>

      {message && <p style={{ fontSize: 14 }}>{message}</p>}

      {Object.keys(grouped).length === 0 && (
        <p style={{ color: '#999', marginTop: 16 }}>Belum ada kontak helpdesk.</p>
      )}

      {Object.entries(grouped).map(([domisili, items]) => (
        <div key={domisili} style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>{domisili}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '8px 16px 8px 0' }}>Label</th>
                <th style={{ textAlign: 'left', padding: '8px 16px' }}>PIC</th>
                <th style={{ textAlign: 'left', padding: '8px 16px' }}>Nomor WA</th>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 16px 8px 0' }}>{c.label}</td>
                  <td style={{ padding: '8px 16px' }}>{c.pic_name ?? <em style={{ color: '#999' }}>—</em>}</td>
                  <td style={{ padding: '8px 16px' }}>{c.whatsapp_number}</td>
                  <td style={{ padding: '8px 0', display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(c)}>Edit</button>
                    <button onClick={() => handleDelete(c.id, c.label)} style={{ color: 'red' }}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}