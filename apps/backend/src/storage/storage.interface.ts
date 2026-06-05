import { Readable } from 'node:stream';

export abstract class StorageService {
  abstract isEnabled(): boolean;
  abstract uploadObject(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void>;
  abstract uploadStream(
    key: string,
    stream: Readable,
    contentType: string,
  ): Promise<void>;
  abstract getObject(key: string): Promise<Readable>;
  abstract generateUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<string>;
  abstract generateDownloadUrl(
    key: string,
    expiresIn?: number,
  ): Promise<string>;
  abstract deleteObject(key: string): Promise<void>;
  abstract deleteObjects(keys: string[]): Promise<void>;
}
