export const DEFAULT_NETWORK = (import.meta.env.VITE_NETWORK || 'preprod') as 'preview' | 'preprod';

export const DEFAULT_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

export function cleanContractAddress(value: string): string {
  return value.trim().replace(/^0x/i, '');
}

export function isValidContractAddress(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(cleanContractAddress(value));
}

export function getContractAddressStatus(value: string): { isValid: boolean; message: string } {
  const cleaned = cleanContractAddress(value);
  if (!cleaned) return { isValid: false, message: 'Deploy a gate or paste a contract address.' };
  if (cleaned.length !== 64) return { isValid: false, message: 'A Midnight contract address is 64 hexadecimal characters.' };
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return { isValid: false, message: 'Use hexadecimal characters only.' };
  return { isValid: true, message: 'Contract address looks valid.' };
}

export function getStoredContractAddress(): string {
  if (typeof window === 'undefined') return DEFAULT_CONTRACT_ADDRESS;
  try {
    const stored = window.localStorage.getItem('DEPLOYED_CONTRACT_ADDRESS');
    if (stored && isValidContractAddress(stored)) return cleanContractAddress(stored);
  } catch {
    // Some privacy modes block localStorage. The build-time value remains usable.
  }
  return cleanContractAddress(DEFAULT_CONTRACT_ADDRESS);
}

export function setStoredContractAddress(value: string): boolean {
  const cleaned = cleanContractAddress(value);
  if (!isValidContractAddress(cleaned) || typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem('DEPLOYED_CONTRACT_ADDRESS', cleaned);
    window.dispatchEvent(new CustomEvent('asterveil-contract-changed', { detail: cleaned }));
    return true;
  } catch {
    return false;
  }
}

export function resetContractAddress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('DEPLOYED_CONTRACT_ADDRESS');
    window.dispatchEvent(new CustomEvent('asterveil-contract-changed', { detail: DEFAULT_CONTRACT_ADDRESS }));
  } catch {
    // Ignore restricted storage.
  }
}

export const CONTRACT_ADDRESS = getStoredContractAddress();
export const MINIMUM_CLEARANCE = 2;
export const MAX_GATE_ENTRIES = 250;
export const EXPLORER_URLS = {
  preview: 'https://preview.midnightexplorer.com/contracts/',
  preprod: 'https://preprod.midnightexplorer.com/contracts/',
} as const;
