'use client';

import { useState, useEffect } from 'react';

interface DashboardData {
  documents: { total: number; ready: number; processing: number; failed: number };
  conversations: { total: number; thisWeek: number };
  feedback: { up: number; down: number };
  users: number;
  domisili: number;
  helpdeskContacts: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-gray-500">Memuat...</p>;
  if (!data) return <p className="text-red-500">Gagal memuat data dashboard.</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">
        Ringkasan aktivitas dan data sistem EvoChat.
      </p>

      <Section title="Knowledge Base">
        <StatCard label="Total Dokumen" value={data.documents.total} />
        <StatCard label="Siap (Ready)" value={data.documents.ready} colorClass="text-green-500" />
        <StatCard label="Diproses" value={data.documents.processing} colorClass="text-yellow-500" />
        <StatCard label="Gagal" value={data.documents.failed} colorClass="text-red-500" />
      </Section>

      <Section title="Percakapan">
        <StatCard label="Total Percakapan" value={data.conversations.total} />
        <StatCard label="7 Hari Terakhir" value={data.conversations.thisWeek} />
      </Section>

      <Section title="Feedback Jawaban AI">
        <StatCard label="Membantu (👍)" value={data.feedback.up} colorClass="text-green-500" />
        <StatCard label="Tidak Membantu (👎)" value={data.feedback.down} colorClass="text-red-500" />
      </Section>

      <Section title="Data Master">
        <StatCard label="Total User" value={data.users} />
        <StatCard label="Domisili" value={data.domisili} />
        <StatCard label="Kontak Helpdesk" value={data.helpdeskContacts} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold mb-3 text-gray-800">{title}</h2>
      <div className="flex gap-3 flex-wrap">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  colorClass = 'text-gray-900',
}: {
  label: string;
  value: number;
  colorClass?: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg px-5 py-4 min-w-[140px] flex-1">
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}