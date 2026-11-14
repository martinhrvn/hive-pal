import { Readable } from 'node:stream';

/** Inclusive byte range, as in an HTTP `Range: bytes=start-end` header. */
export interface ByteRange {
  start: number;
  end: number;
}

export interface StoredObjectInfo {
  size: number;
  /** Content type recorded at upload, when the backend keeps one. */
  contentType?: string;
}

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
  abstract getObject(key: string, range?: ByteRange): Promise<Readable>;
  /** Size and content type of an object, or `null` when it does not exist. */
  abstract statObject(key: string): Promise<StoredObjectInfo | null>;
  abstract generateUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<string>;
  /**
   * URL for server-side consumers that fetch the file themselves (AI
   * transcription, worker jobs). Browser-facing URLs come from MediaUrlService.
   */
  abstract generateDownloadUrl(
    key: string,
    expiresIn?: number,
  ): Promise<string>;
  abstract deleteObject(key: string): Promise<void>;
  abstract deleteObjects(keys: string[]): Promise<void>;
}
