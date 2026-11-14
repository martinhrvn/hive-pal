import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Readable, Writable } from 'node:stream';
import { MediaUrlService } from './media-url.service';
import { parseRange, StorageController } from './storage.controller';
import {
  ByteRange,
  StorageService,
  StoredObjectInfo,
} from './storage.interface';

describe('parseRange', () => {
  it.each([
    [undefined, 100, undefined],
    ['bytes=0-9', 100, { start: 0, end: 9 }],
    ['bytes=90-', 100, { start: 90, end: 99 }],
    ['bytes=-10', 100, { start: 90, end: 99 }],
    ['bytes=-500', 100, { start: 0, end: 99 }],
    ['bytes=50-500', 100, { start: 50, end: 99 }],
    ['bytes=100-', 100, null],
    ['bytes=9-0', 100, null],
    ['bytes=-', 100, null],
    ['bytes=-0', 100, null],
    ['bytes=0-1,5-6', 100, null],
    ['items=0-1', 100, null],
    ['bytes=0-', 0, null],
  ])('%s of %i bytes -> %j', (header, size, expected) => {
    expect(parseRange(header, size)).toEqual(expected);
  });
});

const BODY = Buffer.from('0123456789');

class FakeStorage extends StorageService {
  constructor(private readonly objects: Record<string, StoredObjectInfo>) {
    super();
  }
  isEnabled() {
    return true;
  }
  statObject(key: string) {
    return Promise.resolve(this.objects[key] ?? null);
  }
  getObject(_key: string, range?: ByteRange) {
    const bytes = range ? BODY.subarray(range.start, range.end + 1) : BODY;
    return Promise.resolve(Readable.from([bytes]));
  }
  uploadObject = () => Promise.resolve();
  uploadStream = () => Promise.resolve();
  generateUploadUrl = () => Promise.resolve('');
  generateDownloadUrl = () => Promise.resolve('');
  deleteObject = () => Promise.resolve();
  deleteObjects = () => Promise.resolve();
}

/** Minimal Express response that records headers, status and body. */
function fakeResponse() {
  const chunks: Buffer[] = [];
  const headers: Record<string, string | number> = {};
  const res = new Writable({
    write(chunk: Buffer, _enc, done) {
      chunks.push(chunk);
      done();
    },
  }) as Writable & Partial<Response> & { statusCode: number };
  res.statusCode = 200;
  res.setHeader = ((name: string, value: string | number) => {
    headers[name.toLowerCase()] = value;
    return res;
  }) as Response['setHeader'];
  res.status = ((code: number) => {
    res.statusCode = code;
    return res;
  }) as Response['status'];
  return {
    res: res as unknown as Response,
    headers,
    status: () => res.statusCode,
    body: () => Buffer.concat(chunks).toString(),
  };
}

describe('StorageController.serveFile', () => {
  const media = new MediaUrlService({
    get: (name: string) => (name === 'JWT_SECRET' ? 'secret' : undefined),
  } as unknown as ConfigService);
  const controller = new StorageController(
    new FakeStorage({
      'photos/a.jpg': { size: BODY.length, contentType: 'image/jpeg' },
      'docs/page.html': { size: BODY.length, contentType: 'text/html' },
      'docs/drawing.svg': { size: BODY.length },
    }),
    media,
  );

  async function get(key: string, range?: string, keyParam?: string[]) {
    const url = new URL(
      media.createDownloadUrl(key).downloadUrl,
      'https://hivepal.test',
    );
    const out = fakeResponse();
    await controller.serveFile(
      keyParam ?? key.split('/'),
      url.searchParams.get('token')!,
      url.searchParams.get('expires')!,
      out.res,
      { headers: range ? { range } : {} } as Request,
    );
    return out;
  }

  it('streams the object with cache headers bounded by the URL expiry', async () => {
    const out = await get('photos/a.jpg');
    expect(out.status()).toBe(200);
    expect(out.body()).toBe('0123456789');
    expect(out.headers['content-type']).toBe('image/jpeg');
    expect(out.headers['content-length']).toBe(10);
    expect(out.headers['x-content-type-options']).toBe('nosniff');
    expect(out.headers['cache-control']).toMatch(/^public, max-age=\d+$/);
  });

  it('serves byte ranges', async () => {
    const out = await get('photos/a.jpg', 'bytes=2-4');
    expect(out.status()).toBe(206);
    expect(out.body()).toBe('234');
    expect(out.headers['content-range']).toBe('bytes 2-4/10');
    expect(out.headers['content-length']).toBe(3);
  });

  it('answers 416 for an unsatisfiable range', async () => {
    const out = await get('photos/a.jpg', 'bytes=50-');
    expect(out.status()).toBe(416);
    expect(out.headers['content-range']).toBe('bytes */10');
  });

  it('accepts the key as a single URL-decoded segment', async () => {
    const out = await get('photos/a.jpg', undefined, ['photos/a.jpg']);
    expect(out.status()).toBe(200);
  });

  it.each(['docs/page.html', 'docs/drawing.svg'])(
    'sends %s as a download, never inline',
    async (key) => {
      const out = await get(key);
      expect(out.headers['content-type']).toBe('application/octet-stream');
      expect(out.headers['content-disposition']).toBe('attachment');
    },
  );

  it('rejects a token signed for a different object', async () => {
    const url = new URL(
      media.createDownloadUrl('photos/a.jpg').downloadUrl,
      'https://hivepal.test',
    );
    await expect(
      controller.serveFile(
        ['photos', 'other.jpg'],
        url.searchParams.get('token')!,
        url.searchParams.get('expires')!,
        fakeResponse().res,
        { headers: {} } as Request,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns 404 for a missing object', async () => {
    await expect(get('photos/missing.jpg')).rejects.toBeInstanceOf(
      HttpException,
    );
    await expect(get('photos/missing.jpg')).rejects.toMatchObject({
      status: 404,
    });
  });
});
