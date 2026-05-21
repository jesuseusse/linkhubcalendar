'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { authService, superAdminService } from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { SuperAdminNav } from '@/components/SuperAdmin/SuperAdminNav';
import { UserTable } from '@/components/SuperAdmin/UserTable';
import { SUPER_ADMIN_BADGE, USERS_LABELS } from '@/components/SuperAdmin/superAdmin.const';

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const { logout, user } = useAuth(authService);
  const {
    visibleUsers,
    totalUsersCount,
    allUserEmails,
    usersLoading,
    loadUsers,
    usersSortBy,
    usersSortOrder,
    toggleUsersSort,
    hasMoreUsers,
    loadMoreUsers,
    forbidden,
    checking,
  } = useSuperAdmin(superAdminService);

  useEffect(() => {
    if (forbidden) router.replace('../../../dashboard');
  }, [forbidden, router]);

  useEffect(() => {
    loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking || forbidden || !user) {
    return (
      <p className='text-center text-muted-foreground py-16 text-sm'>Cargando...</p>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header userName={user.name} isAuthenticated onLogout={logout} badge={SUPER_ADMIN_BADGE} />
      <main className='max-w-5xl mx-auto py-8 px-4'>
        <div className='flex items-center gap-4 mb-6'>
          <Link
            href='../../../dashboard'
            className='text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            &larr; Dashboard
          </Link>
        </div>
        <section className='bg-surface border border-border p-6 rounded'>
          <SuperAdminNav />
          <h2 className='text-sm font-semibold text-foreground uppercase tracking-wider mb-4'>
            {USERS_LABELS.title}
          </h2>
          <UserTable
            users={visibleUsers}
            allEmails={allUserEmails}
            totalCount={totalUsersCount}
            loading={usersLoading}
            sortBy={usersSortBy}
            sortOrder={usersSortOrder}
            onSort={toggleUsersSort}
            hasMore={hasMoreUsers}
            onLoadMore={loadMoreUsers}
          />
        </section>
      </main>
    </div>
  );
}
