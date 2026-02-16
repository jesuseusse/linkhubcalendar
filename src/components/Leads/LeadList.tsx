'use client';

import { LeadDto } from '@/dtos/user.dto';

interface Props {
	leads: LeadDto[];
	loading: boolean;
}

export function LeadList({ leads, loading }: Props) {
	if (loading) {
		return (
			<p className='text-sm text-muted-foreground text-center py-4'>Cargando...</p>
		);
	}

	if (leads.length === 0) {
		return (
			<div className='text-center py-8'>
				<span
					className='material-icons text-muted-foreground text-4xl mb-2'
					aria-hidden='true'
				>
					mail_outline
				</span>
				<p className='text-sm text-muted-foreground'>No hay leads registrados</p>
			</div>
		);
	}

	return (
		<div className='space-y-3'>
			{leads.map(lead => (
				<div key={lead.id} className='border border-border p-3'>
					<div className='flex items-center justify-between mb-1'>
						<p className='text-sm font-medium text-foreground'>{lead.name}</p>
						<p className='text-xs text-muted-foreground'>
							{new Date(lead.createdAt).toLocaleDateString()}
						</p>
					</div>
					<p className='text-xs text-muted-foreground mb-1'>{lead.email}</p>
					<p className='text-sm text-foreground'>{lead.message}</p>
				</div>
			))}
		</div>
	);
}
