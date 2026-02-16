'use client';

import { LinkDto, UpdateLinkDto } from '@/dtos/link.dto';
import { LinkItem } from './LinkItem';

interface Props {
	links: LinkDto[];
	onUpdate: (linkId: string, dto: UpdateLinkDto) => Promise<void>;
	onDelete: (linkId: string) => Promise<void>;
}

export function LinkList({ links, onUpdate, onDelete }: Props) {
	if (links.length === 0) {
		return (
			<div className='text-center py-8'>
				<span
					className='material-icons text-muted-foreground text-4xl mb-2'
					aria-hidden='true'
				>
					link_off
				</span>
				<p className='text-sm text-muted-foreground'>No hay enlaces registrados</p>
			</div>
		);
	}

	return (
		<div className='space-y-2'>
			{links.map(link => (
				<LinkItem
					key={link.id}
					link={link}
					existingLinks={links}
					onUpdate={onUpdate}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
