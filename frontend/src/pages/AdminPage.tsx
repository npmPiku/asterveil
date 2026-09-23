import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenDeployTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { AlertCircle, Clipboard, CloudCog, ExternalLink, KeyRound, LoaderCircle, Network, ShieldCheck, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Contract, pureCircuits } from '../managed/contract/index.js';
import { EXPLORER_URLS, getStoredContractAddress, isValidContractAddress, MAX_GATE_ENTRIES, MINIMUM_CLEARANCE, setStoredContractAddress } from '../config';
import { useWallet, type MidnightNetwork } from '../contexts/WalletContext';
import { hexToBytes, shorten, textToBytes32 } from '../lib/bytes';

function getCompiledContract() {
  return CompiledContract.make('AsterveilGate', Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(new URL('/managed', window.location.origin).toString()),
  ) as any;
}

const defaultMemberSecret = '03'.repeat(32);
const defaultAdminSecret = '07'.repeat(32);

type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

export default function AdminPage() {
  const { session, isConnected, isConnecting, connect, disconnect, walletType } = useWallet();
  const [network, setNetwork] = useState<MidnightNetwork>('preprod');
  const [gateName, setGateName] = useState('Night Archive');
  const [memberSecret, setMemberSecret] = useState(defaultMemberSecret);
  const [adminSecret, setAdminSecret] = useState(defaultAdminSecret);
  const [minimumClearance, setMinimumClearance] = useState(String(MINIMUM_CLEARANCE));
  const [maxEntries, setMaxEntries] = useState(String(MAX_GATE_ENTRIES));
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [address, setAddress] = useState<string | null>(getStoredContractAddress() || null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sync = (event: Event) => setAddress((event as CustomEvent<string>).detail || getStoredContractAddress() || null);
    window.addEventListener('asterveil-contract-changed', sync);
    return () => window.removeEventListener('asterveil-contract-changed', sync);
  }, []);

  const handleDeploy = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isConnected || !session) {
      setError(`Connect a wallet on ${network} before deploying.`);
      setStatus('error');
      return;
    }

    const min = Number.parseInt(minimumClearance, 10);
    const max = Number.parseInt(maxEntries, 10);
    if (!Number.isInteger(min) || min < 0 || min > 255) {
      setError('Minimum clearance must be a whole number from 0 to 255.');
      setStatus('error');
      return;
    }
    if (!Number.isInteger(max) || max < 1 || max > 4_294_967_295) {
      setError('Maximum entries must be a whole number greater than zero.');
      setStatus('error');
      return;
    }

    try {
      const nameBytes = textToBytes32(gateName);
      const memberBytes = hexToBytes(memberSecret);
      const adminBytes = hexToBytes(adminSecret);
      const allowlistRoot = pureCircuits.derive_member_key(memberBytes);
      const adminPublicKey = pureCircuits.derive_admin_key(adminBytes);

      setStatus('deploying');
      setProgress(15);
      setAddress(null);
      const compiledContract = getCompiledContract();
      setProgress(28);
      const deployTxData = await createUnprovenDeployTx(session.providers as any, {
        compiledContract,
        args: [nameBytes, allowlistRoot, BigInt(min), BigInt(max), adminPublicKey],
        initialPrivateState: {},
        signingKey: sampleSigningKey(),
      });
      setProgress(70);
      const deployedAddress = deployTxData.public.contractAddress;
      const result = await submitTxAsync(session.providers as any, { unprovenTx: deployTxData.private.unprovenTx });
      const cleanAddress = deployedAddress.replace(/^0x/i, '');
      setProgress(100);
      setAddress(cleanAddress);
      setStoredContractAddress(cleanAddress);
      setStatus('success');
      void result;
    } catch (reason) {
      setStatus('error');
      setProgress(100);
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, [adminSecret, gateName, isConnected, maxEntries, memberSecret, minimumClearance, network, session]);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const explorer = `${EXPLORER_URLS[network]}${address ?? ''}`;
  const connectedNetwork = session?.config?.networkId;
  const needsNetworkSwitch = isConnected && connectedNetwork && connectedNetwork !== network;

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div className="eyebrow">Admin deployment</div>
        <h1>Deploy an access gate.</h1>
        <p>Set the public policy, then authorize deployment on Midnight Preview or Preprod with Lace or 1AM.</p>
      </header>

      <div className="two-column page-section-tight">
        <form className="surface panel stack" onSubmit={handleDeploy}>
          <div>
            <div className="status-line"><Network size={16} aria-hidden="true" /><strong>Deployment network</strong><span className="muted">{network === 'preprod' ? 'Preprod' : 'Preview'}</span></div>
            <h2 style={{ marginTop: 19 }}>Gate configuration</h2>
            <p className="helper">The policy is public. The seed values below are used to derive commitments and are never written into the constructor as raw secrets.</p>
          </div>

          <div className="form-grid">
            <div className="field full">
              <label htmlFor="deploy-network">Target network</label>
              <select id="deploy-network" className="select" value={network} onChange={(event) => { setNetwork(event.target.value as MidnightNetwork); if (isConnected) disconnect(); }}>
                <option value="preprod">Midnight Preprod</option>
                <option value="preview">Midnight Preview</option>
              </select>
            </div>
            <div className="field full">
              <label htmlFor="gate-name">Gate label</label>
              <input id="gate-name" className="input" value={gateName} onChange={(event) => setGateName(event.target.value)} maxLength={32} />
              <span className="helper">Up to 32 UTF-8 bytes. This is visible on the public ledger.</span>
            </div>
            <div className="field">
              <label htmlFor="minimum-clearance">Minimum clearance</label>
              <input id="minimum-clearance" className="input mono" type="number" min="0" max="255" value={minimumClearance} onChange={(event) => setMinimumClearance(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="max-entries">Maximum entries</label>
              <input id="max-entries" className="input mono" type="number" min="1" value={maxEntries} onChange={(event) => setMaxEntries(event.target.value)} />
            </div>
            <div className="field full">
              <label htmlFor="member-seed">Demo member seed</label>
              <input id="member-seed" className="input mono" value={memberSecret} onChange={(event) => setMemberSecret(event.target.value)} autoComplete="off" spellCheck={false} />
              <span className="helper">The Prove page uses this same demo seed by default. Replace it before a real deployment.</span>
            </div>
            <div className="field full">
              <label htmlFor="admin-seed">Admin seed</label>
              <input id="admin-seed" className="input mono" value={adminSecret} onChange={(event) => setAdminSecret(event.target.value)} autoComplete="off" spellCheck={false} />
              <span className="helper">Only its domain-separated public hash is stored. Keep this seed offline.</span>
            </div>
          </div>

          {needsNetworkSwitch && <div className="alert alert-info"><Network size={17} aria-hidden="true" /><span>Your wallet is connected to <strong>{connectedNetwork}</strong>. Disconnect and reconnect to <strong>{network}</strong> before deploying.</span></div>}
          {error && <div className="alert alert-error" role="alert"><AlertCircle size={16} aria-hidden="true" /><span>{error}</span></div>}
          <div className="form-actions">
            {isConnected && !needsNetworkSwitch ? (
              <button className="button button-primary" type="submit" disabled={status === 'deploying'}>{status === 'deploying' ? <LoaderCircle className="spin" size={17} aria-hidden="true" /> : <CloudCog size={17} aria-hidden="true" />}{status === 'deploying' ? 'Deploying contract' : 'Deploy to network'}</button>
            ) : (
              <button className="button button-primary" type="button" onClick={() => void connect(network)} disabled={isConnecting || Boolean(needsNetworkSwitch)}><Wallet size={17} aria-hidden="true" />{isConnecting ? 'Connecting' : `Connect ${network}`}</button>
            )}
            {isConnected && <span className="helper">Connected with {walletType ?? 'Midnight wallet'}.</span>}
          </div>
        </form>

        <div className="stack">
          <div className="console" aria-live="polite">
            <div className="console-head"><span className="console-title"><CloudCog size={15} aria-hidden="true" /> deployment telemetry</span><span className="console-badge">{status === 'deploying' ? 'RUNNING' : status === 'success' ? 'DEPLOYED' : 'STANDBY'}</span></div>
            <div className="console-progress"><span style={{ width: `${progress}%` }} /></div>
            <div className="console-body">
              <div className="console-line dim">[assets] /managed proving keys available</div>
              <div className="console-line dim">[contract] AsterveilGate · 3 circuits</div>
              <div className="console-line info">[policy] {gateName || 'unnamed gate'} · minimum clearance {minimumClearance}</div>
              <div className="console-line info">[network] Midnight {network}</div>
              {status === 'deploying' && <div className="console-line info">[wallet] awaiting approval for balanced transaction...</div>}
              {status === 'success' && address && <div className="console-line ok">[done] instance active at {shorten(address, 13, 11)}</div>}
              {error && <div className="console-line warn">[error] {error}</div>}
            </div>
          </div>

          {address && isValidContractAddress(address) ? (
            <section className="result-panel" aria-labelledby="deployed-title">
              <div className="result-heading"><span className="result-icon"><ShieldCheck size={21} aria-hidden="true" /></span><div><h2 id="deployed-title">Gate deployed</h2><p>Saved locally as the active workspace contract.</p></div></div>
              <div className="hash-box"><label htmlFor="deployed-address">Contract address</label><code id="deployed-address">{address}</code></div>
              <div className="inline-actions">
                <button className="button button-secondary button-compact" type="button" onClick={() => void copyAddress()}><Clipboard size={15} aria-hidden="true" /> {copied ? 'Copied' : 'Copy address'}</button>
                <a className="button button-ghost button-compact" href={explorer} target="_blank" rel="noreferrer"><ExternalLink size={15} aria-hidden="true" /> Midnight Explorer</a>
              </div>
              <p className="helper">Use the demo member seed on <Link to="/prove" className="text-soft"><u>Prove access</u></Link> for a first circuit call. For a real gate, rotate both seeds before sharing the app.</p>
            </section>
          ) : (
            <div className="surface panel">
              <div className="status-line"><KeyRound size={16} aria-hidden="true" /><strong>Constructor alignment</strong></div>
              <p className="helper" style={{ marginTop: 10 }}>The five constructor arguments are: gate label, allowlist root, minimum clearance, maximum entries, and the domain-separated admin public key. The page derives the two public hashes before building the transaction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
