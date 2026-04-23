'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from '@/utils/getCroppedImg';

type UploadState = 'initial' | 'preview';

interface Props {
  onUpload: (file: File) => Promise<void>;
  onUploadComplete?: (url: string) => void;
  onDelete?: () => void;
  initialUrl?: string;
  compress?: boolean;
  label?: string;
  loading?: boolean;
}

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/webp' as const,
};

// ── Crop modal ──────────────────────────────────────────────────────────────

interface CropModalProps {
  imageSrc: string;
  onConfirm: (pixels: Area) => void;
  onCancel: () => void;
  uploading: boolean;
  error: string | null;
}

function CropModal({ imageSrc, onConfirm, onCancel, uploading, error }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex flex-col bg-black'
      role='dialog'
      aria-modal='true'
      aria-label='Recortar imagen'
    >
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 bg-black/80 shrink-0'>
        <button
          type='button'
          onClick={onCancel}
          disabled={uploading}
          className='text-sm text-white/70 hover:text-white disabled:opacity-40 transition-colors'
        >
          Cancelar
        </button>
        <span className='text-sm font-medium text-white'>Ajustar foto</span>
        <button
          type='button'
          onClick={() => croppedAreaPixels && onConfirm(croppedAreaPixels)}
          disabled={uploading || !croppedAreaPixels}
          className='text-sm font-semibold text-white disabled:opacity-40 transition-colors'
        >
          {uploading ? 'Subiendo…' : 'Usar foto'}
        </button>
      </div>

      {/* Cropper area — fills all remaining vertical space */}
      <div className='relative flex-1 w-full'>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#000' },
          }}
        />
      </div>

      {/* Footer: zoom + error */}
      <div className='shrink-0 px-4 pt-3 pb-6 bg-black/80 space-y-2'>
        {error && (
          <p className='text-xs text-red-400 text-center'>{error}</p>
        )}
        <div className='flex items-center gap-3'>
          <span className='text-xs text-white/60 shrink-0'>Zoom</span>
          <input
            type='range'
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className='flex-1 h-1 accent-white'
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function ImageCropUpload({
  onUpload,
  onUploadComplete,
  onDelete,
  initialUrl,
  compress = true,
  label = 'Subir imagen',
  loading = false,
}: Props) {
  const [uiState, setUiState] = useState<UploadState>(initialUrl ? 'preview' : 'initial');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDisabled = loading || uploading;

  const openFilePicker = useCallback(() => {
    if (!isDisabled) inputRef.current?.click();
  }, [isDisabled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError(null);
    const reader = new FileReader();
    reader.onload = ev => setImageSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setError(null);
      const reader = new FileReader();
      reader.onload = ev => setImageSrc(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleCropConfirm = useCallback(async (pixels: Area) => {
    if (!imageSrc) return;
    setUploading(true);
    setError(null);
    try {
      const croppedFile = await getCroppedImg(imageSrc, pixels);
      const processed = compress
        ? await imageCompression(croppedFile, COMPRESSION_OPTIONS)
        : croppedFile;
      const finalFile = new File([processed], 'photo.webp', { type: 'image/webp' });
      const localUrl = URL.createObjectURL(finalFile);
      setPreviewUrl(localUrl);
      setImageSrc(null);
      setUiState('preview');
      await onUpload(finalFile);
      onUploadComplete?.(localUrl);
    } catch {
      setError('Error al procesar o subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }, [imageSrc, compress, onUpload, onUploadComplete]);

  const handleCropCancel = useCallback(() => {
    setImageSrc(null);
    setError(null);
  }, []);

  return (
    <>
      {/* Crop modal — rendered in portal when image is selected */}
      {imageSrc && (
        <CropModal
          imageSrc={imageSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          uploading={uploading}
          error={error}
        />
      )}

      <div className='flex flex-col gap-2 w-full'>
        {/* Square thumbnail area */}
        <div className='relative w-full aspect-square overflow-hidden rounded border border-border bg-muted'>

          {/* PREVIEW */}
          {uiState === 'preview' && previewUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt='Foto de perfil'
              className='absolute inset-0 w-full h-full object-cover'
            />
          )}

          {/* INITIAL drop zone */}
          {uiState === 'initial' && (
            <div
              role='button'
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={openFilePicker}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && openFilePicker()}
              className='absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/70 transition-colors'
              aria-label={label}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='w-7 h-7 text-muted-foreground'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={1.5}
                aria-hidden='true'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' />
              </svg>
              <span className='text-xs text-muted-foreground text-center px-2'>
                {label}
              </span>
              <span className='text-xs text-muted-foreground/60 text-center px-2 hidden sm:block'>
                JPG, PNG o WebP
              </span>
            </div>
          )}

          {/* "Cambiar" — always visible on mobile, hover-only on desktop */}
          {uiState === 'preview' && (
            <button
              type='button'
              onClick={openFilePicker}
              disabled={isDisabled}
              className={[
                'absolute inset-x-0 bottom-0 flex items-center justify-center py-1.5',
                'bg-black/50 disabled:cursor-not-allowed',
                // Always visible on mobile; hover-only on sm+
                'sm:opacity-0 sm:hover:opacity-100 sm:inset-0 sm:py-0 sm:transition-opacity',
              ].join(' ')}
              aria-label='Cambiar foto'
            >
              <span className='text-white text-xs font-medium'>Cambiar</span>
            </button>
          )}
        </div>

        {/* "Eliminar" link below the thumbnail */}
        {uiState === 'preview' && onDelete && (
          <button
            type='button'
            onClick={onDelete}
            disabled={isDisabled}
            className='text-xs text-error hover:text-error/80 underline disabled:opacity-50 transition-colors self-start'
          >
            Eliminar foto
          </button>
        )}

        {error && !imageSrc && (
          <p className='text-xs text-error'>{error}</p>
        )}

        <input
          ref={inputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp'
          onChange={handleChange}
          className='hidden'
          disabled={isDisabled}
        />
      </div>
    </>
  );
}
