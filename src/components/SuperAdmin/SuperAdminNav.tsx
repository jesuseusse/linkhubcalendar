'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SUPER_ADMIN_NAV } from './superAdmin.const';

export function SuperAdminNav() {
  const pathname = usePathname();
  const dashboardIndex = pathname.indexOf('/dashboard');
  const dashboardBase =
    dashboardIndex !== -1
      ? pathname.slice(0, dashboardIndex + '/dashboard'.length)
      : '';
  const hubBase = `${dashboardBase}/console/hub`;

  const tabs = [
    { label: SUPER_ADMIN_NAV.dashboard, href: hubBase },
    { label: SUPER_ADMIN_NAV.users, href: `${hubBase}/users` },
    { label: SUPER_ADMIN_NAV.tickets, href: `${hubBase}/tickets` },
    { label: SUPER_ADMIN_NAV.campaigns, href: `${hubBase}/campaigns` },
  ];

  return (
    <nav className='flex gap-1 mb-6 border-b border-border'>
      {tabs.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href !== hubBase && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
