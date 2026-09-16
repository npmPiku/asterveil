import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, submitCallTx, type DeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type EnvironmentConfiguration, waitForFunds } from '@midnight-ntwrk/testkit-js';
import pino from 'pino';

import { getConfig } from '../config.js';
import { MidnightWalletProvider, syncWallet, type WalletSecret } from '../wallet.js';
import { buildProviders, type AsterveilProviders } from '../providers.js';
import {
  CompiledAsterveilContract,
  Contract,
  ledger,
  pureCircuits,
  zkConfigPath,
} from '../../contracts/index.js';

// Required by the GraphQL subscription client in Node.js.
// @ts-expect-error Midnight's Apollo client expects a browser global.
globalThis.WebSocket = WebSocket;

const LOCAL_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
const PRIVATE_STATE_ID = 'AsterveilIntegrationState';
const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});
const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';

function resolveSecret(net: string): WalletSecret {
  if (net === 'local') return { kind: 'seed', value: LOCAL_SEED };

  const upper = net.toUpperCase();
  const mnemonic = process.env[`MIDNIGHT_${upper}_MNEMONIC`]?.trim().replace(/\s+/g, ' ');
  const seed = process.env[`MIDNIGHT_${upper}_SEED`]?.trim();
  if (mnemonic && seed) throw new Error(`Set only one Midnight ${net} wallet secret.`);
  if (mnemonic) return { kind: 'mnemonic', value: mnemonic };
  if (seed) return { kind: 'seed', value: seed };
  throw new Error(`Set MIDNIGHT_${upper}_MNEMONIC or MIDNIGHT_${upper}_SEED for ${net}.`);
}

describe(`Asterveil gate (${network})`, () => {
  let wallet: MidnightWalletProvider;
  let providers: AsterveilProviders;
  let contractAddress: ContractAddress;

  const config = getConfig();
  const secret = resolveSecret(network);
  const environment: EnvironmentConfiguration = {
    walletNetworkId: config.networkId,
    networkId: config.networkId,
    indexer: config.indexer,
    indexerWS: config.indexerWS,
    node: config.node,
    nodeWS: config.nodeWS,
    faucet: config.faucet,
    proofServer: config.proofServer,
  };

  const memberSecret = new Uint8Array(32).fill(3);
  const adminSecret = new Uint8Array(32).fill(7);
  const allowlistRoot = pureCircuits.derive_member_key(memberSecret);
  const adminPublicKey = pureCircuits.derive_admin_key(adminSecret);
  const gateName = new Uint8Array(32);
  gateName.set(new TextEncoder().encode('Night Archive'));

  async function readLedger() {
    const state = await providers.publicDataProvider.queryContractState(contractAddress);
    expect(state).not.toBeNull();
    return ledger(state!.data);
  }

  beforeAll(async () => {
    setNetworkId(config.networkId);
    wallet = await MidnightWalletProvider.build(logger, environment, secret);
    await wallet.start();
    await syncWallet(logger, wallet.wallet, network === 'local' ? 10 * 60_000 : 60 * 60_000);

    if (config.faucet) {
      const balance = await waitForFunds(wallet.wallet, environment, true, wallet.unshieldedKeystore);
      logger.info(`Wallet balance ready: ${balance}`);
    }

    providers = buildProviders(wallet, zkConfigPath, config);
  });

  afterAll(async () => {
    if (wallet) await wallet.stop();
  });

  it('deploys a gate with only public policy state', async () => {
    const deployed: DeployedContract<Contract> = await deployContract(providers, {
      compiledContract: CompiledAsterveilContract,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
      args: [gateName, allowlistRoot, 2n, 250n, adminPublicKey],
    });

    contractAddress = deployed.deployTxData.public.contractAddress;
    expect(contractAddress).toBeDefined();

    const state = await readLedger();
    expect(new TextDecoder().decode(state.gate_name).replaceAll('\0', '')).toContain('Night Archive');
    expect(state.minimum_clearance).toBe(2n);
    expect(state.verified_entries).toBe(0n);
    expect(state.is_open).toBe(true);
  });

  it('proves private membership and records a public badge commitment', async () => {
    const badgeCommitment = new Uint8Array(32).fill(55);
    await submitCallTx<Contract, 'prove_access'>(providers, {
      compiledContract: CompiledAsterveilContract,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID,
      circuitId: 'prove_access',
      args: [memberSecret, 3n, badgeCommitment],
    });

    const state = await readLedger();
    expect(state.verified_entries).toBe(1n);
    expect(state.badge_registry.member(badgeCommitment)).toBe(true);
  });

  it('rejects an unknown member secret and prevents replay', async () => {
    const unknownSecret = new Uint8Array(32).fill(4);
    await expect(
      submitCallTx<Contract, 'prove_access'>(providers, {
        compiledContract: CompiledAsterveilContract,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID,
        circuitId: 'prove_access',
        args: [unknownSecret, 3n, new Uint8Array(32).fill(56)],
      }),
    ).rejects.toThrow();

    await expect(
      submitCallTx<Contract, 'prove_access'>(providers, {
        compiledContract: CompiledAsterveilContract,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID,
        circuitId: 'prove_access',
        args: [memberSecret, 3n, new Uint8Array(32).fill(57)],
      }),
    ).rejects.toThrow();
  });

  it('keeps private inputs out of the public ledger representation', async () => {
    const rawState = await providers.publicDataProvider.queryContractState(contractAddress);
    expect(rawState).not.toBeNull();
    const publicState = ledger(rawState!.data);
    const stateKeys = Object.keys(publicState);

    expect(stateKeys).toContain('allowlist_root');
    expect(stateKeys).toContain('verified_entries');
    expect(stateKeys).not.toContain('member_secret');
    expect(stateKeys).not.toContain('member_clearance');
    const serializedState = JSON.stringify(rawState);
    expect(serializedState).not.toContain('member_secret');
    expect(serializedState).not.toContain('member_clearance');
  });
});
