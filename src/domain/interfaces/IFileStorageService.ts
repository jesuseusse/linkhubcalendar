export interface FileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface IFileStorageService {
  saveFile(tenantId: string, file: FileInput): Promise<string>;
  deleteFile(tenantId: string, filePath: string): Promise<void>;
}
