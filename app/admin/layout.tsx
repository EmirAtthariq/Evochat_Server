'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const menu = [
    { href: '/admin/documents', label: 'Dokumen' },
    { href: '/admin/chat', label: 'Test Chat' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: 200, borderRight: '1px solid #eee', padding: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 24 }}>Admin</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                color: pathname === item.href ? '#fff' : '#333',
                background: pathname === item.href ? '#333' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} style={{ marginTop: 32 }}>
          Logout
        </button>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}