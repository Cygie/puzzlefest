// Generates the PWA PNG icons without external dependencies.
// Design: purple background with a 4×4 letter-grid motif and a highlighted diagonal "word".
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [91, 60, 196];
const CELL = [255, 255, 255];
const HIGHLIGHT = [255, 196, 61];

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (const byte of buf) {
    c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const i = y * (size * 3 + 1) + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** @param {number} size @param {number} padding fraction of size kept free around the grid */
function icon(size, padding) {
  const n = 4;
  const area = size * (1 - 2 * padding);
  const start = size * padding;
  const step = area / n;
  const gap = step * 0.14;
  return png(size, (x, y) => {
    const gx = Math.floor((x - start) / step);
    const gy = Math.floor((y - start) / step);
    if (gx < 0 || gy < 0 || gx >= n || gy >= n) return BG;
    const lx = x - start - gx * step;
    const ly = y - start - gy * step;
    if (lx < gap / 2 || ly < gap / 2 || lx > step - gap / 2 || ly > step - gap / 2) return BG;
    return gx === gy ? HIGHLIGHT : CELL;
  });
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', icon(192, 0.16));
writeFileSync('public/icons/icon-512.png', icon(512, 0.16));
writeFileSync('public/icons/icon-maskable-512.png', icon(512, 0.26));
console.log('Icons written to public/icons/');
