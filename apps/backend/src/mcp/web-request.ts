import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

/**
 * Bridges Express to the Fetch API used by better-auth's MCP helpers and the
 * MCP SDK's web-standard transport. Express has already parsed the JSON body,
 * so it is re-serialised, and the original framing headers no longer apply.
 */
export function toWebRequest(req: ExpressRequest): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(name, v));
    else if (value !== undefined) headers.set(name, value);
  }
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  const url = new URL(
    req.originalUrl,
    `${req.protocol}://${req.get('host') ?? 'localhost'}`,
  );
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(url, {
    method: req.method,
    headers,
    body:
      hasBody && req.body !== undefined ? JSON.stringify(req.body) : undefined,
  });
}

export async function sendWebResponse(
  res: ExpressResponse,
  response: Response,
): Promise<void> {
  res.status(response.status);
  response.headers.forEach((value, name) => res.setHeader(name, value));
  if (!response.body) {
    res.end();
    return;
  }
  await new Promise<void>((resolve, reject) => {
    Readable.fromWeb(response.body as NodeReadableStream)
      .on('error', reject)
      .pipe(res)
      .on('finish', resolve)
      .on('error', reject);
  });
}
