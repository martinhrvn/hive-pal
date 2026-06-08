/**
 * Parses measurement records out of a HiveScale SD-card download.
 *
 * The firmware keeps an append-only `/measurements.ndjson` backup (one JSON
 * object per line) and, in AP mode, lets the beekeeper download the whole card
 * as an uncompressed TAR (`hivescale-sd-data.tar`) containing that file plus the
 * `cache.ndjson` retry queue. We accept either:
 *   - a raw `.ndjson` file, or
 *   - the `.tar` archive (we extract every `*.ndjson` member and parse them).
 *
 * The parser is intentionally dependency-free (no `tar` package) and pure, so it
 * can be unit-tested in isolation. De-duplication is handled downstream by the
 * HiveScale backend keyed on (device_id, measured_at).
 */

export interface SdImportParseResult {
  /** Parsed measurement objects, in file order. */
  records: Record<string, unknown>[];
  /** Non-empty lines that could not be parsed as JSON (corrupted/truncated). */
  skipped: number;
}

const USTAR_MAGIC = 'ustar';

/** True when the buffer looks like a TAR archive (USTAR magic at offset 257). */
function looksLikeTar(buffer: Buffer): boolean {
  if (buffer.length < 512) return false;
  return buffer.toString('latin1', 257, 262) === USTAR_MAGIC;
}

/** Parses NDJSON text, skipping blank and unparseable lines. */
function parseNdjson(text: string): SdImportParseResult {
  const records: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    try {
      const parsed: unknown = JSON.parse(line);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        records.push(parsed as Record<string, unknown>);
      } else {
        skipped += 1;
      }
    } catch {
      skipped += 1;
    }
  }

  return { records, skipped };
}

/**
 * Extracts the concatenated contents of every `*.ndjson` member of an
 * uncompressed (USTAR/GNU) TAR archive. Only regular-file entries are read.
 */
function extractNdjsonFromTar(buffer: Buffer): string {
  const chunks: string[] = [];
  let offset = 0;

  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);

    // A block of all-zero bytes marks the end of the archive.
    if (header.every(byte => byte === 0)) break;

    const name = header.toString('latin1', 0, 100).replace(/\0.*$/, '').trim();
    // Size is a 0-padded octal string in bytes 124..136.
    const sizeField = header.toString('latin1', 124, 136).replace(/\0.*$/, '').trim();
    const size = parseInt(sizeField, 8);
    // typeflag '0' or '\0' is a regular file.
    const typeFlag = header.toString('latin1', 156, 157);

    offset += 512;
    if (!Number.isFinite(size) || size < 0) break;

    if ((typeFlag === '0' || typeFlag === '\0' || typeFlag === '') && /\.ndjson$/i.test(name)) {
      chunks.push(buffer.toString('utf8', offset, offset + size));
    }

    // Advance past the file data, rounded up to the next 512-byte boundary.
    offset += Math.ceil(size / 512) * 512;
  }

  return chunks.join('\n');
}

/**
 * Parses an uploaded SD-card file into measurement records. Detects TAR vs
 * NDJSON from the filename extension first, then falls back to sniffing the
 * USTAR magic so a mislabelled upload still works.
 */
export function parseSdMeasurements(
  buffer: Buffer,
  filename?: string,
): SdImportParseResult {
  const isTar =
    (filename ? /\.tar$/i.test(filename) : false) || looksLikeTar(buffer);

  const text = isTar
    ? extractNdjsonFromTar(buffer)
    : buffer.toString('utf8');

  return parseNdjson(text);
}
