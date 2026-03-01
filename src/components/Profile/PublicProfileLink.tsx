'use client';

import { useState } from 'react';

interface Props {
	username: string;
}

export function PublicProfileLink({ username }: Props) {
	const [copied, setCopied] = useState(false);
	const domain = window.location.host.replace(/^www\./, '');
	const url = `${domain}/${username}`;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(`https://${url}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className='flex items-center gap-2'>
			<p className='text-xs text-muted-foreground'>
				Comparte este enlace:{' '}
				<span className='text-foreground font-medium'>{url}</span>
			</p>
			<button
				onClick={handleCopy}
				className='rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted transition-colors'
			>
				{copied ? 'Copiado' : 'Copiar enlace'}
			</button>
		</div>
	);
}
