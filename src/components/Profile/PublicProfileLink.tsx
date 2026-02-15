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
			<p className='text-xs text-zinc-500'>
				Perfil público: <span className='text-zinc-900 font-medium'>{url}</span>
			</p>
			<button
				onClick={handleCopy}
				className='px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors'
			>
				{copied ? 'Copiado' : 'Copiar enlace'}
			</button>
		</div>
	);
}
