'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { authService, profileService } from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { GalleryManager } from '@/components/Gallery/GalleryManager';
import { GALLERY_LABELS } from '@/components/Gallery/gallery.const';

export default function GalleryDashboardPage() {
  const { logout, user } = useAuth(authService);
  const {
    profile,
    loading,
    uploadGalleryPhoto,
    deleteGalleryPhoto,
    reorderGalleryPhotos,
    toggleGallery,
  } = useProfile(profileService);

  if (!user || !profile) {
    return (
      <p className='text-center text-muted-foreground py-16 text-sm'>Cargando...</p>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header userName={user.name} isAuthenticated onLogout={logout} />
      <main className='max-w-2xl mx-auto py-8 px-4'>
        <div className='flex items-center gap-4 mb-6'>
          <Link
            href='../dashboard'
            className='text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            &larr; Dashboard
          </Link>
        </div>
        <section className='bg-surface border border-border p-6 rounded'>
          <h2 className='text-sm font-semibold text-foreground uppercase tracking-wider mb-6'>
            {GALLERY_LABELS.title}
          </h2>
          <GalleryManager
            photos={profile.galleryPhotos ?? []}
            galleryEnabled={profile.galleryEnabled ?? false}
            loading={loading}
            onUpload={uploadGalleryPhoto}
            onDelete={deleteGalleryPhoto}
            onReorder={reorderGalleryPhotos}
            onToggle={toggleGallery}
          />
        </section>
      </main>
    </div>
  );
}
