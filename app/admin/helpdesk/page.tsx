'use client';

import { useState, useEffect, useMemo } from 'react';

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
  const [filterDomisili, setFilterDomisili] = useState<string>('');
  const [filterLabel, setFilterLabel] = useState<string>('');
  async function fetchContacts() {
    const res = await fetch('/api/admin/helpdesk-contacts');
    const data = await res.json();
    setContacts(data);
  }

  async function fetchDomisiliOptions() {
    const res = await fetch('/api/domisili-list');
    const data = await res.json();
    setDomisiliList(data);
  }

  useEffect(() => {
    fetchContacts();
    fetchDomisiliOptions();
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
  const labelList = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.label))).sort(),
    [contacts]
  );
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesDomisili = filterDomisili ? c.domisili === filterDomisili : true;
      const matchesLabel = filterLabel ? c.label === filterLabel : true;
      return matchesDomisili && matchesLabel;
    });
  }, [contacts, filterDomisili, filterLabel]);
  const grouped = filteredContacts.reduce<Record<string, Contact[]>>((acc, c) => {
    (acc[c.domisili] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Kelola Domisili &amp; Kontak Helpdesk</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-2 mt-4 mb-2 p-4 border border-gray-200 rounded-lg"
      >
        <input
          list="domisili-options"
          placeholder="Domisili"
          value={form.domisili}
          onChange={(e) => setForm({ ...form, domisili: e.target.value })}
          required
          className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-md text-sm"
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
          className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-md text-sm"
        />

        <input
          placeholder="Nama PIC (opsional)"
          value={form.pic_name}
          onChange={(e) => setForm({ ...form, pic_name: e.target.value })}
          className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-md text-sm"
        />

        <input
          placeholder="Nomor WA (628xxxxxxxxxx)"
          value={form.whatsapp_number}
          onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
          required
          className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-md text-sm"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Kontak'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {message && <p className="text-sm text-gray-700 mb-2">{message}</p>}
      <div className="flex flex-wrap gap-2 items-center mt-4 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-600">Filter:</span>

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

        <select
          value={filterLabel}
          onChange={(e) => setFilterLabel(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Semua Label</option>
          {labelList.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {(filterDomisili || filterLabel) && (
          <button
            type="button"
            onClick={() => {
              setFilterDomisili('');
              setFilterLabel('');
            }}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 underline"
          >
            Reset Filter
          </button>
        )}
      </div>
      {Object.keys(grouped).length === 0 && (
        <p className="text-gray-400 mt-4">Tidak ada kontak yang cocok dengan filter.</p>
      )}

      {Object.entries(grouped).map(([domisili, items]) => (
        <div key={domisili} className="mt-6">
          <h3 className="font-semibold mb-2">{domisili}</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 pr-4">Label</th>
                <th className="text-left py-2 px-4">PIC</th>
                <th className="text-left py-2 px-4">Nomor WA</th>
                <th className="text-left py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-gray-200">
                  <td className="py-2 pr-4">{c.label}</td>
                  <td className="py-2 px-4">
                    {c.pic_name ?? <em className="text-gray-400">—</em>}
                  </td>
                  <td className="py-2 px-4">{c.whatsapp_number}</td>
                  <td className="py-2 flex gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.label)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-md hover:bg-red-100"
                    >
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