'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { authService, supportService } from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { SupportPage } from '@/components/Support/SupportPage';

/**
 * Dashboard page for support tickets and suggestions.
 * Accessible from the Header settings dropdown under "Soporte y sugerencias".
 */
export default function SupportDashboardPage() {
  const { logout, user } = useAuth(authService);

  if (!user) {
    return (
      <p className='text-center text-muted-foreground py-16 text-sm'>Cargando...</p>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header userName={user.name} isAuthenticated onLogout={logout} />
      <main className='max-w-5xl mx-auto py-8 px-4'>
        <div className='flex items-center gap-4 mb-6'>
          <Link
            href='../dashboard'
            className='text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            &larr; Dashboard
          </Link>
        </div>
        <section className='bg-surface border border-border p-6 rounded'>
          <SupportPage supportService={supportService} />
        </section>
      </main>
    </div>
  );
}
