import { adminStorage } from '@/lib/firebase/admin';
import { IFileStorageService, FileInput } from '@/domain/interfaces/IFileStorageService';

export class FirebaseStorageService implements IFileStorageService {
  async saveFile(tenantId: string, file: FileInput): Promise<string> {
    const bucket = adminStorage.bucket();
    const filename = `tenants/${tenantId}/profilePhotos/${Date.now()}-${file.originalName}`;
    const fileRef = bucket.file(filename);

    await fileRef.save(file.buffer, {
      metadata: { contentType: file.mimeType },
    });

    await fileRef.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  }

  async deleteFile(tenantId: string, filePath: string): Promise<void> {
    try {
      const bucket = adminStorage.bucket();
      const url = new URL(filePath);
      const path = url.pathname.split(`${bucket.name}/`)[1];
      if (path) {
        await bucket.file(path).delete();
      }
    } catch {
      // File may not exist, ignore
    }
  }
}
