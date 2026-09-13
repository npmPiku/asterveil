import { describe, expect, it } from 'vitest';
import { pureCircuits } from '../../contracts/index.js';

const bytes = (value: number) => new Uint8Array(32).fill(value);

function hex(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('Asterveil pure commitment circuits', () => {
  it('derives a stable 32-byte member key', () => {
    const first = pureCircuits.derive_member_key(bytes(3));
    const second = pureCircuits.derive_member_key(bytes(3));
    expect(first).toHaveLength(32);
    expect(hex(first)).toBe(hex(second));
  });

  it('changes the member commitment when the secret changes', () => {
    expect(hex(pureCircuits.derive_member_key(bytes(3)))).not.toBe(hex(pureCircuits.derive_member_key(bytes(4))));
  });

  it('uses a separate domain for the replay nullifier', () => {
    const secret = bytes(3);
    expect(hex(pureCircuits.derive_member_key(secret))).not.toBe(hex(pureCircuits.derive_member_nullifier(secret)));
    expect(pureCircuits.derive_member_nullifier(secret)).toHaveLength(32);
  });
});
