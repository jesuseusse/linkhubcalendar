'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { GalleryPhotoDto, ThemeDto } from '@/dtos/user.dto';

interface Props {
  photos: GalleryPhotoDto[];
  theme?: ThemeDto;
  animationDelay?: number;
}

export function GalleryCarousel({ photos, theme, animationDelay = 0 }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sorted = [...photos].sort((a, b) => a.order - b.order);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? 0 : Math.min(i + 1, sorted.length - 1)));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? 0 : Math.max(i - 1, 0)));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxIndex, sorted.length, closeLightbox]);

  if (sorted.length === 0) return null;

  return (
    <>
      <div
        className='anim-link w-full'
        style={{ animationDelay: `${animationDelay}s` }}
      >
        {/* Scroll carousel */}
        <div
          className='flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1'
          style={{ scrollbarWidth: 'none' }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const itemWidth = el.scrollWidth / sorted.length;
            setActiveIndex(Math.round(el.scrollLeft / itemWidth));
          }}
        >
          {sorted.map((photo, i) => (
            <button
              key={photo.id}
              type='button'
              onClick={() => setLightboxIndex(i)}
              className='snap-start shrink-0 w-[72vw] max-w-[280px] aspect-square rounded-2xl overflow-hidden shadow-md cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              style={
                theme
                  ? { boxShadow: `0 4px 20px ${theme.buttonColor}25` }
                  : undefined
              }
              aria-label={`Ver foto ${i + 1}`}
            >
              <Image
                src={photo.url}
                alt={`Foto ${i + 1}`}
                width={280}
                height={280}
                className='w-full h-full object-cover'
              />
            </button>
          ))}
        </div>

        {/* Dot indicators */}
        {sorted.length > 1 && (
          <div className='flex justify-center gap-1.5 mt-3'>
            {sorted.map((_, i) => (
              <span
                key={i}
                className='block rounded-full transition-all duration-300'
                style={{
                  width: i === activeIndex ? 16 : 6,
                  height: 6,
                  backgroundColor:
                    i === activeIndex
                      ? theme?.buttonColor ?? 'var(--color-primary)'
                      : theme?.buttonColor
                        ? `${theme.buttonColor}40`
                        : 'var(--color-border)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className='anim-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4'
          onClick={closeLightbox}
          role='dialog'
          aria-modal='true'
          aria-label='Galería de fotos'
        >
          <Image
            src={sorted[lightboxIndex].url}
            alt={`Foto ${lightboxIndex + 1}`}
            className='anim-photo rounded-2xl object-contain shadow-2xl max-h-[85vh] w-auto'
            width={900}
            height={900}
            style={{ maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Close */}
          <button
            type='button'
            onClick={closeLightbox}
            className='absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'
            aria-label='Cerrar'
          >
            <span className='material-icons text-xl'>close</span>
          </button>

          {/* Prev / Next */}
          {lightboxIndex > 0 && (
            <button
              type='button'
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className='absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'
              aria-label='Foto anterior'
            >
              <span className='material-icons text-xl'>chevron_left</span>
            </button>
          )}
          {lightboxIndex < sorted.length - 1 && (
            <button
              type='button'
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className='absolute right-14 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'
              aria-label='Foto siguiente'
            >
              <span className='material-icons text-xl'>chevron_right</span>
            </button>
          )}

          {/* Counter */}
          <span className='absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 tabular-nums'>
            {lightboxIndex + 1} / {sorted.length}
          </span>
        </div>
      )}
    </>
  );
}
