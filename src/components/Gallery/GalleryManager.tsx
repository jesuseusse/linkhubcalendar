'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GalleryPhotoDto } from '@/dtos/user.dto';
import { ImageCropUpload } from '@/components/Common/ImageCropUpload';
import { GALLERY_LABELS } from './gallery.const';

interface SortablePhotoProps {
  photo: GalleryPhotoDto;
  onDelete: (id: string) => void;
  loading: boolean;
}

function SortablePhoto({ photo, onDelete, loading }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='relative group rounded-xl overflow-hidden aspect-square bg-muted'
    >
      <Image
        src={photo.url}
        alt='Foto de galería'
        fill
        className='object-cover'
        sizes='(max-width: 640px) 33vw, 160px'
      />

      {/* Drag handle — full overlay on touch, top-left grip on desktop */}
      <div
        {...attributes}
        {...listeners}
        className='absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none'
        aria-label={GALLERY_LABELS.dragAriaLabel}
      />

      {/* Drag handle icon visible on hover/focus */}
      <div className='absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
        <span className='material-icons text-sm' style={{ fontSize: 14 }}>
          drag_indicator
        </span>
      </div>

      {/* Delete button */}
      <button
        type='button'
        onClick={() => onDelete(photo.id)}
        disabled={loading}
        aria-label={GALLERY_LABELS.deleteAriaLabel}
        className='absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-error transition-colors pointer-events-auto z-10 opacity-0 group-hover:opacity-100'
      >
        <span className='material-icons' style={{ fontSize: 14 }}>
          close
        </span>
      </button>
    </div>
  );
}

interface Props {
  photos: GalleryPhotoDto[];
  galleryEnabled: boolean;
  loading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onToggle: (enabled: boolean) => Promise<void>;
}

export function GalleryManager({
  photos,
  galleryEnabled,
  loading,
  onUpload,
  onDelete,
  onReorder,
  onToggle,
}: Props) {
  const [localPhotos, setLocalPhotos] = useState<GalleryPhotoDto[]>(photos);
  const [showUpload, setShowUpload] = useState(false);
  const maxReached = localPhotos.length >= 10;

  // Keep local state in sync when parent updates (after upload/delete)
  if (photos.length !== localPhotos.length || photos.some((p, i) => p.id !== localPhotos[i]?.id)) {
    setLocalPhotos([...photos].sort((a, b) => a.order - b.order));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localPhotos.findIndex((p) => p.id === active.id);
    const newIndex = localPhotos.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(localPhotos, oldIndex, newIndex);
    setLocalPhotos(reordered);
    await onReorder(reordered.map((p) => p.id));
  }

  async function handleDelete(photoId: string) {
    await onDelete(photoId);
  }

  async function handleUpload(file: File) {
    await onUpload(file);
    setShowUpload(false);
  }

  return (
    <div className='space-y-5'>
      {/* Toggle */}
      <div className='flex items-center justify-between p-4 bg-muted rounded-xl'>
        <div>
          <p className='text-sm font-medium text-foreground'>{GALLERY_LABELS.toggleLabel}</p>
          <p className='text-xs text-muted-foreground mt-0.5'>{GALLERY_LABELS.toggleHint}</p>
        </div>
        <button
          type='button'
          onClick={() => onToggle(!galleryEnabled)}
          disabled={loading}
          aria-pressed={galleryEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 ${
            galleryEnabled ? 'bg-primary' : 'bg-border'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              galleryEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Counter + instructions */}
      <div className='flex items-center justify-between'>
        <p className='text-xs text-muted-foreground'>
          {localPhotos.length === 0
            ? GALLERY_LABELS.addPhotoHint
            : GALLERY_LABELS.dragHint}
        </p>
        <span className='text-xs font-medium text-muted-foreground tabular-nums'>
          {GALLERY_LABELS.counter(localPhotos.length)}
        </span>
      </div>

      {/* Photo grid */}
      {localPhotos.length === 0 ? (
        <p className='text-sm text-muted-foreground text-center py-8 border-2 border-dashed border-border rounded-xl'>
          {GALLERY_LABELS.emptyState}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localPhotos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5'>
              {localPhotos.map((photo) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  onDelete={handleDelete}
                  loading={loading}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add photo */}
      {maxReached ? (
        <p className='text-xs text-muted-foreground text-center'>{GALLERY_LABELS.maxReached}</p>
      ) : showUpload ? (
        <div className='border border-border rounded-xl p-4'>
          <ImageCropUpload
            onUpload={handleUpload}
            label={GALLERY_LABELS.uploadImageLabel}
            loading={loading}
          />
          <button
            type='button'
            onClick={() => setShowUpload(false)}
            className='mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors'
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => setShowUpload(true)}
          disabled={loading}
          className='w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary rounded-xl transition-colors'
        >
          <span className='material-icons text-[18px]'>add_photo_alternate</span>
          {GALLERY_LABELS.addPhoto}
        </button>
      )}
    </div>
  );
}
