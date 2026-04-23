'use client';

import { useState } from 'react';
import { TiktokIcon } from '@/components/Common/SocialIcons';
import { CreateLinkDto } from '@/dtos/link.dto';

interface Props {
  onConfirm: (dto: CreateLinkDto) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export function AddTiktokModal({ onConfirm, onClose, loading }: Props) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cleanUsername = username.replace(/^@/, '').trim();

  const handleConfirm = async () => {
    if (!cleanUsername) {
      setError('Ingresa tu usuario de TikTok');
      return;
    }
    setError(null);
    try {
      await onConfirm({ title: 'TikTok', url: `https://tiktok.com/@${cleanUsername}` });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al agregar el enlace');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleConfirm();
  };

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <div className='bg-surface w-full max-w-sm p-6 relative rounded'>
        <button
          type='button'
          onClick={onClose}
          disabled={loading}
          className='absolute top-3 right-3 text-muted-foreground hover:text-foreground text-lg disabled:opacity-50'
          aria-label='Cerrar'
        >
          &times;
        </button>

        <div className='flex items-center gap-2 mb-1'>
          <TiktokIcon className='w-5 h-5 fill-foreground shrink-0' />
          <h2 className='text-sm font-semibold text-foreground'>Agregar TikTok</h2>
        </div>
        <p className='text-xs text-muted-foreground mb-4'>
          Ingresa tu usuario y se creará el enlace automáticamente.
        </p>

        <div className='flex items-center border border-border rounded overflow-hidden focus-within:border-foreground'>
          <span className='px-3 py-2 text-sm text-muted-foreground bg-muted select-none shrink-0'>
            tiktok.com/@
          </span>
          <input
            type='text'
            placeholder='usuario'
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className='flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none'
          />
        </div>

        {error && <p className='text-xs text-error mt-2'>{error}</p>}

        <div className='flex gap-2 mt-4'>
          <button
            type='button'
            onClick={handleConfirm}
            disabled={loading || !cleanUsername}
            className='flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors rounded'
          >
            {loading ? 'Agregando...' : 'OK'}
          </button>
          <button
            type='button'
            onClick={onClose}
            disabled={loading}
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors rounded'
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
