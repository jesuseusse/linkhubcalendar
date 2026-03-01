'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

	const recent = leads.slice(0, 5);

	return (
		<div className='space-y-3'>
			{recent.map(lead => (
				<div key={lead.id} className='border border-border p-3'>
					<div className='flex items-center justify-between mb-1'>
						<p className='text-sm font-medium text-foreground'>{lead.name}</p>
						<p className='text-xs text-muted-foreground'>
							{format(new Date(lead.createdAt), 'd MMM yy', { locale: es })}
						</p>
					</div>
					<p className='text-xs text-muted-foreground mb-1'>{lead.email}</p>
					{lead.phone && (
						<p className='text-xs text-muted-foreground mb-1'>{lead.phone}</p>
					)}
					<p className='text-sm text-foreground'>{lead.message}</p>
				</div>
			))}
			<div className='pt-1 text-right'>
				<Link
					href='/u/admin/dashboard/leads'
					className='text-xs text-muted-foreground hover:text-foreground underline'
				>
					Ver todos los contactos →
				</Link>
			</div>
		</div>
	);
}
