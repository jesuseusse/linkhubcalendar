'use client';

import { UserSummaryDto } from '@/dtos/user.dto';
import { USERS_LABELS, LOADING_TEXT } from './superAdmin.const';

interface Props {
  users: UserSummaryDto[];
  loading: boolean;
}

export function UserTable({ users, loading }: Props) {
  if (loading) {
    return <p className='text-sm text-muted-foreground py-4'>{LOADING_TEXT}</p>;
  }

  if (users.length === 0) {
    return <p className='text-sm text-muted-foreground py-4'>{USERS_LABELS.empty}</p>;
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border text-left'>
            <th className='py-2 pr-4 font-medium text-muted-foreground'>{USERS_LABELS.colEmail}</th>
            <th className='py-2 pr-4 font-medium text-muted-foreground'>{USERS_LABELS.colPlan}</th>
            <th className='py-2 pr-4 font-medium text-muted-foreground'>{USERS_LABELS.colLinks}</th>
            <th className='py-2 font-medium text-muted-foreground'>{USERS_LABELS.colProfile}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className='border-b border-border last:border-0'>
              <td className='py-3 pr-4 text-foreground'>{user.email}</td>
              <td className='py-3 pr-4'>
                {user.plan ? (
                  <span className='inline-block px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded capitalize'>
                    {user.plan}
                  </span>
                ) : (
                  <span className='text-muted-foreground text-xs'>free</span>
                )}
              </td>
              <td className='py-3 pr-4 text-foreground'>
                {user.links.length === 0 ? (
                  <span className='text-muted-foreground'>—</span>
                ) : (
                  <span title={user.links.map((l) => l.title).join(', ')}>
                    {user.links.length}
                  </span>
                )}
              </td>
              <td className='py-3'>
                {user.username ? (
                  <a
                    href={`/${user.username}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary underline underline-offset-2 hover:opacity-80 transition-opacity'
                  >
                    {USERS_LABELS.viewProfile}
                  </a>
                ) : (
                  <span className='text-muted-foreground'>{USERS_LABELS.noUsername}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
