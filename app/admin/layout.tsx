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
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/documents', label: 'Dokumen' },
    { href: '/admin/domisili', label: 'Domisili' },
    { href: '/admin/helpdesk', label: 'Helpdesk' },
    { href: '/admin/users', label: 'Kelola User' },
    { href: '/admin/feedback', label: 'Feedback' },
    { href: '/admin/chat', label: 'Test Chat' },
  ];

  return (
    <div className="flex min-h-screen font-sans">
      <aside className="w-52 border-r border-gray-200 p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-6">Admin</h2>

        <nav className="flex flex-col gap-1 flex-1">
          {menu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-8 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}