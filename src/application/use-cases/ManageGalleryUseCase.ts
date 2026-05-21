import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IFileStorageService, FileInput } from '../../domain/interfaces/IFileStorageService';
import { GalleryPhoto } from '../../domain/entities/User';
import { GalleryPhotoDto, UserDto } from '../../dtos/user.dto';

const MAX_GALLERY_PHOTOS = 10;

function toGalleryPhotoDto(p: GalleryPhoto): GalleryPhotoDto {
  return { id: p.id, url: p.url, order: p.order };
}

function toUserDto(user: import('../../domain/entities/User').User): UserDto {
  return {
    id: user.id,
    name: user.name,
    description: user.description,
    email: user.email,
    emailVerified: user.emailVerified ?? false,
    username: user.username,
    usernameChangedAt: user.usernameChangedAt,
    profilePhoto: user.profilePhoto,
    plan: user.plan,
    planExpiredAt: user.planExpiredAt,
    subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
    subscriptionStatus: user.subscriptionStatus,
    stripeSubscriptionId: user.stripeSubscriptionId,
    referredBy: user.referredBy,
    contactFormEnabled: user.contactFormEnabled,
    calendarEnabled: user.calendarEnabled,
    galleryEnabled: user.galleryEnabled,
    galleryPhotos: user.galleryPhotos.map(toGalleryPhotoDto),
    theme: user.theme,
    links: user.links,
    calendarSlots: [],
  };
}

// ---------------------------------------------------------------------------
// UploadGalleryPhotoUseCase
// ---------------------------------------------------------------------------

export class UploadGalleryPhotoUseCase {
  constructor(
    private userRepo: IUserRepository,
    private storageService: IFileStorageService
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    file: FileInput
  ): Promise<GalleryPhotoDto[]> {
    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) throw new Error('User not found');

    const photos = user.galleryPhotos ?? [];
    if (photos.length >= MAX_GALLERY_PHOTOS) {
      throw new Error('Máximo 10 fotos en la galería');
    }

    const url = await this.storageService.saveGalleryFile(tenantId, userId, file);
    const newPhoto: GalleryPhoto = {
      id: crypto.randomUUID(),
      url,
      order: photos.length,
    };

    const updated = await this.userRepo.updateGalleryPhotos(tenantId, userId, [
      ...photos,
      newPhoto,
    ]);
    return (updated?.galleryPhotos ?? []).map(toGalleryPhotoDto);
  }
}

// ---------------------------------------------------------------------------
// DeleteGalleryPhotoUseCase
// ---------------------------------------------------------------------------

export class DeleteGalleryPhotoUseCase {
  constructor(
    private userRepo: IUserRepository,
    private storageService: IFileStorageService
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    photoId: string
  ): Promise<GalleryPhotoDto[]> {
    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) throw new Error('User not found');

    const target = user.galleryPhotos.find((p) => p.id === photoId);
    if (!target) throw new Error('Photo not found');

    // Delete from storage in background — don't block or throw on failure
    this.storageService.deleteFile(tenantId, target.url).catch(() => {});

    const remaining = user.galleryPhotos
      .filter((p) => p.id !== photoId)
      .map((p, i) => ({ ...p, order: i }));

    const updated = await this.userRepo.updateGalleryPhotos(tenantId, userId, remaining);
    return (updated?.galleryPhotos ?? []).map(toGalleryPhotoDto);
  }
}

// ---------------------------------------------------------------------------
// ReorderGalleryPhotosUseCase
// ---------------------------------------------------------------------------

export class ReorderGalleryPhotosUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(
    tenantId: string,
    userId: string,
    orderedIds: string[]
  ): Promise<GalleryPhotoDto[]> {
    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) throw new Error('User not found');

    const photoMap = new Map(user.galleryPhotos.map((p) => [p.id, p]));

    if (orderedIds.length !== user.galleryPhotos.length) {
      throw new Error('Invalid reorder: photo count mismatch');
    }

    const reordered: GalleryPhoto[] = orderedIds.map((id, index) => {
      const photo = photoMap.get(id);
      if (!photo) throw new Error(`Photo ${id} not found`);
      return { ...photo, order: index };
    });

    const updated = await this.userRepo.updateGalleryPhotos(tenantId, userId, reordered);
    return (updated?.galleryPhotos ?? []).map(toGalleryPhotoDto);
  }
}

// ---------------------------------------------------------------------------
// ToggleGalleryUseCase
// ---------------------------------------------------------------------------

export class ToggleGalleryUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string, userId: string, enabled: boolean): Promise<UserDto> {
    const updated = await this.userRepo.updateGalleryEnabled(tenantId, userId, enabled);
    if (!updated) throw new Error('User not found');
    return toUserDto(updated);
  }
}
