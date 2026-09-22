export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(value: string): Uint8Array {
  const normalized = value.trim().replace(/^0x/i, '');
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error('Enter exactly 64 hexadecimal characters for a private 32-byte value.');
  }
  const bytes = new Uint8Array(32);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }
  return bytes;
}

export function textToBytes32(value: string): Uint8Array {
  const encoded = new TextEncoder().encode(value.trim());
  if (!encoded.length || encoded.length > 32) {
    throw new Error('Gate label must contain between 1 and 32 UTF-8 bytes.');
  }
  const bytes = new Uint8Array(32);
  bytes.set(encoded);
  return bytes;
}

export function randomBytes32(): Uint8Array {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function shorten(value: string, start = 10, end = 8): string {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}
