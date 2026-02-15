"use client";

import { useState, type ReactNode } from 'react';
import { hasPermission, type Plan, type Permission } from '@/permissions/plans';
import { UpgradeModal } from './UpgradeModal';

interface Props {
	plan?: Plan;
	permission: Permission;
	children: ReactNode;
	email?: string;
}

export function RequirePermission({ plan, permission, children, email }: Props) {
	const [showModal, setShowModal] = useState(false);
	const allowed = plan ? hasPermission(plan, permission) : false;

	return (
		<div className='relative'>
			{!allowed && (
				<div className='absolute inset-0 bg-surface/60 z-10 flex items-center justify-center cursor-pointer' onClick={() => setShowModal(true)}>
					<span className='text-xs font-medium text-muted-foreground bg-surface border border-border px-3 py-1.5'>
						Upgrade
					</span>
				</div>
			)}
			<div className={!allowed ? 'pointer-events-none opacity-50' : ''}>
				{children}
			</div>
			{showModal && <UpgradeModal onClose={() => setShowModal(false)} email={email} />}
		</div>
	);
}
