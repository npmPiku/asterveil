import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import type { MidnightProvider, WalletProvider } from '@midnight-ntwrk/midnight-js-types';

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.replace(/^0x/i, '');
  if (normalized.length % 2 !== 0) throw new Error('Wallet returned an invalid transaction payload.');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }
  return bytes;
}

export function createPrivateStateProvider() {
  let contractScope = '';
  const states = new Map<string, unknown>();
  const signingKeys = new Map<string, unknown>();
  const scoped = (id: string) => `${contractScope}:${id}`;

  return {
    setContractAddress(address: string) { contractScope = address; },
    async set(id: string, value: unknown) { states.set(scoped(id), value); },
    async get(id: string) { return states.get(scoped(id)) ?? null; },
    async remove(id: string) { states.delete(scoped(id)); },
    async clear() { states.clear(); },
    async setSigningKey(address: string, key: unknown) { signingKeys.set(address, key); },
    async getSigningKey(address: string) { return signingKeys.get(address) ?? null; },
    async removeSigningKey(address: string) { signingKeys.delete(address); },
    async clearSigningKeys() { signingKeys.clear(); },
    async exportPrivateStates(): Promise<never> { throw new Error('Private state export is not enabled in this browser session.'); },
    async importPrivateStates(): Promise<never> { throw new Error('Private state import is not enabled in this browser session.'); },
    async exportSigningKeys(): Promise<never> { throw new Error('Signing key export is not enabled in this browser session.'); },
    async importSigningKeys(): Promise<never> { throw new Error('Signing key import is not enabled in this browser session.'); },
  };
}

export function createPatchedPublicDataProvider(queryUrl: string, subscriptionUrl: string) {
  const base = indexerPublicDataProvider(queryUrl, subscriptionUrl);

  return {
    ...base,
    async queryContractState(contractAddress: string, config?: unknown) {
      if (config) return base.queryContractState(contractAddress, config as never);
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: 'query Latest($address: HexEncoded!) { contractAction(address: $address) { state } }',
          variables: { address: contractAddress },
        }),
      });
      if (!response.ok) throw new Error(`Indexer request failed with HTTP ${response.status}.`);
      const payload = await response.json();
      if (payload.errors?.length) throw new Error(payload.errors.map((error: { message: string }) => error.message).join('; '));
      const encodedState = payload.data?.contractAction?.state;
      return encodedState ? ContractState.deserialize(fromHex(encodedState)) : null;
    },
  };
}

export type ConnectedSession = {
  api: any;
  config: any;
  unshieldedAddress: string;
  shieldedAddress: any;
  providers: {
    privateStateProvider: ReturnType<typeof createPrivateStateProvider>;
    publicDataProvider: any;
    zkConfigProvider: FetchZkConfigProvider<string>;
    proofProvider: { proveTx: (unprovenTx: any, config: any) => Promise<any> };
    walletProvider: WalletProvider;
    midnightProvider: MidnightProvider;
  };
};

export async function createConnectedSession(api: any): Promise<ConnectedSession> {
  const [config, unshielded, shieldedAddress] = await Promise.all([
    api.getConfiguration(),
    api.getUnshieldedAddress(),
    api.getShieldedAddresses(),
  ]);

  setNetworkId(config.networkId);

  const zkConfigProvider = new FetchZkConfigProvider(
    new URL('/managed', window.location.origin).toString(),
    window.fetch.bind(window),
  );
  const provingProvider = await api.getProvingProvider(zkConfigProvider);

  const proofProvider = {
    async proveTx(unprovenTx: any, _config: any) {
      const { CostModel } = await import('@midnight-ntwrk/ledger-v8');
      return unprovenTx.prove(provingProvider, CostModel.initialCostModel());
    },
  };

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => shieldedAddress.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedAddress.shieldedEncryptionPublicKey,
    balanceTx: async (transaction: any) => {
      const balanced = await api.balanceUnsealedTransaction(toHex(transaction.serialize()));
      if (!balanced?.tx) throw new Error('Wallet could not balance the transaction.');
      const { Transaction } = await import('@midnight-ntwrk/ledger-v8');
      return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx));
    },
  };

  const midnightProvider: MidnightProvider = {
    submitTx: async (transaction: any) => {
      const result = await api.submitTransaction(toHex(transaction.serialize()));
      if (typeof result === 'string' && result) return result;
      if (result?.transactionId) return result.transactionId;
      if (result?.id) return result.id;
      return 'submitted';
    },
  };

  const publicDataProvider = config?.indexerUri && config?.indexerWsUri
    ? createPatchedPublicDataProvider(config.indexerUri, config.indexerWsUri)
    : await api.getPublicDataProvider?.();

  return {
    api,
    config,
    unshieldedAddress: typeof unshielded === 'string' ? unshielded : unshielded?.unshieldedAddress ?? '',
    shieldedAddress,
    providers: {
      privateStateProvider: createPrivateStateProvider(),
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    },
  };
}
