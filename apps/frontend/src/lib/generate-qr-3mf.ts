import { create as createQR } from 'qrcode';

interface HiveEntry {
  name: string;
  url: string;
}

/**
 * Generates a .3mf file (ZIP) containing one 3D object per hive QR code.
 * Each QR code is a flat base plate with raised dark modules, arranged in a grid.
 */
export function generateQR3MF(
  hives: HiveEntry[],
  physicalSizeMm: number,
): ArrayBuffer {
  const BASE_HEIGHT_MM = 1.2;
  const MODULE_RAISE_HEIGHT_MM = 0.8;
  const GRID_COLS = Math.ceil(Math.sqrt(hives.length));
  const SPACING_MM = physicalSizeMm + 10;

  const enc = new TextEncoder();
  let resourcesXml = '';
  let buildXml = '';

  for (let i = 0; i < hives.length; i++) {
    const objId = i + 1;
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const tx = col * SPACING_MM;
    const ty = row * SPACING_MM;

    const qr = createQR(hives[i].url, { errorCorrectionLevel: 'H' });
    const { size: moduleCount, data: moduleData } = qr.modules;
    const moduleSize = physicalSizeMm / moduleCount;

    const { verticesXml, trianglesXml } = buildQRMesh(
      moduleData,
      moduleCount,
      moduleSize,
      BASE_HEIGHT_MM,
      MODULE_RAISE_HEIGHT_MM,
    );

    resourcesXml +=
      `<object id="${objId}" name="${escXml(hives[i].name)}" type="model">` +
      `<mesh>` +
      `<vertices>${verticesXml}</vertices>` +
      `<triangles>${trianglesXml}</triangles>` +
      `</mesh></object>`;

    buildXml += `<item objectid="${objId}" transform="1 0 0 0 1 0 0 0 1 ${tx} ${ty} 0"/>`;
  }

  const modelXml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">' +
    `<resources>${resourcesXml}</resources>` +
    `<build>${buildXml}</build>` +
    '</model>';

  const contentTypesXml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>' +
    '</Types>';

  const relsXml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="r1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/>' +
    '</Relationships>';

  return createZip([
    { name: '[Content_Types].xml', data: enc.encode(contentTypesXml) },
    { name: '_rels/.rels', data: enc.encode(relsXml) },
    { name: '3D/3dmodel.model', data: enc.encode(modelXml) },
  ]);
}

interface MeshResult {
  verticesXml: string;
  trianglesXml: string;
}

function buildQRMesh(
  moduleData: Uint8Array,
  moduleCount: number,
  moduleSize: number,
  baseHeight: number,
  raiseHeight: number,
): MeshResult {
  const vParts: string[] = [];
  const tParts: string[] = [];
  let vIdx = 0;

  // Adds a box with outward-facing normals (right-hand winding).
  // Vertices layout: 0=(-x,-y,-z) 1=(+x,-y,-z) 2=(+x,+y,-z) 3=(-x,+y,-z)
  //                  4=(-x,-y,+z) 5=(+x,-y,+z) 6=(+x,+y,+z) 7=(-x,+y,+z)
  function box(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
  ) {
    const b = vIdx;
    vParts.push(
      v(x1, y1, z1),
      v(x2, y1, z1),
      v(x2, y2, z1),
      v(x1, y2, z1),
      v(x1, y1, z2),
      v(x2, y1, z2),
      v(x2, y2, z2),
      v(x1, y2, z2),
    );
    vIdx += 8;
    // Bottom (-z)
    tParts.push(t(b, b + 2, b + 1), t(b, b + 3, b + 2));
    // Top (+z)
    tParts.push(t(b + 4, b + 5, b + 6), t(b + 4, b + 6, b + 7));
    // Front (-y)
    tParts.push(t(b, b + 1, b + 5), t(b, b + 5, b + 4));
    // Back (+y)
    tParts.push(t(b + 2, b + 7, b + 6), t(b + 2, b + 3, b + 7));
    // Left (-x)
    tParts.push(t(b + 3, b + 4, b + 7), t(b + 3, b, b + 4));
    // Right (+x)
    tParts.push(t(b + 1, b + 2, b + 6), t(b + 1, b + 6, b + 5));
  }

  const totalSize = moduleCount * moduleSize;
  box(0, 0, 0, totalSize, totalSize, baseHeight);

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (moduleData[row * moduleCount + col]) {
        const x1 = col * moduleSize;
        const y1 = row * moduleSize;
        box(
          x1,
          y1,
          baseHeight,
          x1 + moduleSize,
          y1 + moduleSize,
          baseHeight + raiseHeight,
        );
      }
    }
  }

  return {
    verticesXml: vParts.join(''),
    trianglesXml: tParts.join(''),
  };
}

function v(x: number, y: number, z: number): string {
  return `<vertex x="${x.toFixed(4)}" y="${y.toFixed(4)}" z="${z.toFixed(4)}"/>`;
}

function t(v1: number, v2: number, v3: number): string {
  return `<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`;
}

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Minimal ZIP generator using STORE (no compression) — sufficient for 3MF.
interface ZipEntry {
  name: string;
  data: Uint8Array;
}

// DOS date for 1980-01-01: ((year-1980)<<9) | (month<<5) | day = 0<<9 | 1<<5 | 1
const DOS_DATE = (1 << 5) | 1;

function createZip(files: ZipEntry[]): ArrayBuffer {
  const enc = new TextEncoder();
  const localParts: Uint8Array[] = [];
  type CDE = { nameBytes: Uint8Array; crc: number; size: number; offset: number };
  const cdEntries: CDE[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // local file header signature
    lv.setUint16(4, 20, true); // version needed to extract
    lv.setUint16(6, 0, true); // general purpose flags
    lv.setUint16(8, 0, true); // compression: STORE
    lv.setUint16(10, 0, true); // last mod file time
    lv.setUint16(12, DOS_DATE, true); // last mod file date (valid: 1980-01-01)
    lv.setUint32(14, crc, true); // CRC-32
    lv.setUint32(18, size, true); // compressed size
    lv.setUint32(22, size, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true); // file name length
    lv.setUint16(28, 0, true); // extra field length
    local.set(nameBytes, 30);

    cdEntries.push({ nameBytes, crc, size, offset });
    localParts.push(local, file.data);
    offset += local.length + size;
  }

  const cdParts: Uint8Array[] = [];
  const cdStart = offset;

  for (const entry of cdEntries) {
    const cd = new Uint8Array(46 + entry.nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true); // central directory signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed to extract
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, DOS_DATE, true); // mod date (valid: 1980-01-01)
    cv.setUint32(16, entry.crc, true); // CRC-32
    cv.setUint32(20, entry.size, true); // compressed size
    cv.setUint32(24, entry.size, true); // uncompressed size
    cv.setUint16(28, entry.nameBytes.length, true); // file name length
    cv.setUint16(30, 0, true); // extra field length
    cv.setUint16(32, 0, true); // file comment length
    cv.setUint16(34, 0, true); // disk number start
    cv.setUint16(36, 0, true); // internal file attributes
    cv.setUint32(38, 0, true); // external file attributes
    cv.setUint32(42, entry.offset, true); // offset of local header
    cd.set(entry.nameBytes, 46);
    cdParts.push(cd);
    offset += cd.length;
  }

  const cdSize = offset - cdStart;
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // end of central directory signature
  ev.setUint16(4, 0, true); // disk number
  ev.setUint16(6, 0, true); // disk with start of central directory
  ev.setUint16(8, files.length, true); // entries on this disk
  ev.setUint16(10, files.length, true); // total entries
  ev.setUint32(12, cdSize, true); // size of central directory
  ev.setUint32(16, cdStart, true); // offset of central directory
  ev.setUint16(20, 0, true); // comment length

  const all = [...localParts, ...cdParts, eocd];
  const total = all.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(new ArrayBuffer(total));
  let pos = 0;
  for (const p of all) {
    result.set(p, pos);
    pos += p.length;
  }
  return result.buffer;
}

// CRC-32 with standard polynomial 0xEDB88320
function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of data) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
