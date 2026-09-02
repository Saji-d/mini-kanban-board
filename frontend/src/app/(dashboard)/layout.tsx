'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <FullPageSpinner />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/boards" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-accent font-display text-sm font-bold text-accent-ink">
              K
            </span>
            <span className="font-display text-sm font-semibold tracking-tight text-ink">
              Mini Kanban
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-ink-muted">{user.name}</span>
            <button
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              className="rounded px-3 py-1.5 text-xs font-medium text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
