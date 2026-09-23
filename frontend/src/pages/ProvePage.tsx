import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { AlertCircle, CheckCircle2, Clipboard, ExternalLink, FileDown, KeyRound, LoaderCircle, LockKeyhole, Terminal, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Contract } from '../managed/contract/index.js';
import { getStoredContractAddress, isValidContractAddress, EXPLORER_URLS, MINIMUM_CLEARANCE } from '../config';
import { useWallet } from '../contexts/WalletContext';
import { bytesToHex, hexToBytes, randomBytes32, shorten } from '../lib/bytes';

type ProofStatus = 'idle' | 'preview' | 'proving' | 'success' | 'error';

type LogLine = { text: string; tone: 'dim' | 'info' | 'ok' | 'warn' };

function getCompiledContract() {
  return CompiledContract.make('AsterveilGate', Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(new URL('/managed', window.location.origin).toString()),
  ) as any;
}

const defaultSecret = '03'.repeat(32);

export default function ProvePage() {
  const { session, isConnected, isConnecting, connect, error: walletError } = useWallet();
  const [address, setAddress] = useState(getStoredContractAddress());
  const [memberSecret, setMemberSecret] = useState(defaultSecret);
  const [clearance, setClearance] = useState('3');
  const [status, setStatus] = useState<ProofStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [badgeCommitment, setBadgeCommitment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([
    { text: '[ready] proof boundary initialized', tone: 'dim' },
    { text: '[private] member inputs remain in the client session', tone: 'info' },
  ]);

  useEffect(() => {
    const sync = (event: Event) => setAddress((event as CustomEvent<string>).detail || getStoredContractAddress());
    window.addEventListener('asterveil-contract-changed', sync);
    return () => window.removeEventListener('asterveil-contract-changed', sync);
  }, []);

  const addLog = (text: string, tone: LogLine['tone'] = 'info') => setLogs((current) => [...current, { text, tone }]);

  const handleSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setTransactionId(null);
    setBadgeCommitment(null);

    if (!isValidContractAddress(address)) {
      setError('No valid gate is active. Deploy a contract from the Admin page, then return here.');
      setStatus('error');
      return;
    }

    let secret: Uint8Array;
    try {
      secret = hexToBytes(memberSecret);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setStatus('error');
      return;
    }

    const clearanceValue = Number.parseInt(clearance, 10);
    if (!Number.isInteger(clearanceValue) || clearanceValue < 0 || clearanceValue > 255) {
      setError('Clearance must be a whole number from 0 to 255.');
      setStatus('error');
      return;
    }

    const commitment = randomBytes32();
    const commitmentHex = `0x${bytesToHex(commitment)}`;
    setStatus('proving');
    setProgress(12);
    setLogs([
      { text: '[start] constructing prove_access transaction', tone: 'info' },
      { text: `[target] gate ${shorten(address, 12, 10)}`, tone: 'dim' },
      { text: '[private] secret and clearance passed as circuit inputs', tone: 'info' },
      { text: '[public] fresh badge commitment prepared', tone: 'dim' },
    ]);

    if (!isConnected || !session) {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      setProgress(100);
      setStatus('preview');
      addLog('[preview] connect Lace or 1AM to submit this proof on Preprod', 'warn');
      return;
    }

    try {
      session.providers.privateStateProvider.setContractAddress?.(address);
      setProgress(35);
      addLog('[zk] asking the connected wallet proving provider to synthesize the proof', 'info');
      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract: getCompiledContract(),
        contractAddress: address,
        circuitId: 'prove_access',
        args: [secret, BigInt(clearanceValue), commitment],
      });
      setProgress(72);
      addLog('[wallet] transaction balanced; approve the request in your wallet', 'info');
      const result = await submitTxAsync(session.providers as any, {
        unprovenTx: callTxData.private.unprovenTx,
        circuitId: 'prove_access',
      });
      const tx = typeof result === 'string' ? result : String(result);
      setProgress(100);
      setTransactionId(tx);
      setBadgeCommitment(commitmentHex);
      setStatus('success');
      addLog('[done] proof accepted and badge commitment registered', 'ok');
      addLog('[privacy] member secret and clearance were not disclosed', 'ok');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      setStatus('error');
      setProgress(100);
      addLog(`[error] ${message}`, 'warn');
    }
  }, [address, clearance, isConnected, memberSecret, session]);

  const copyCommitment = async () => {
    if (!badgeCommitment) return;
    await navigator.clipboard.writeText(badgeCommitment);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadReceipt = () => {
    if (!badgeCommitment) return;
    const receipt = {
      product: 'Asterveil',
      network: session?.config?.networkId ?? 'preprod',
      contractAddress: address,
      transactionId,
      badgeCommitment,
      claim: 'Member access proven without publishing member secret or clearance.',
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `asterveil-access-${badgeCommitment.slice(2, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const explorer = `${EXPLORER_URLS[(session?.config?.networkId === 'preview' ? 'preview' : 'preprod')]}${address}`;

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div className="eyebrow">Proof terminal</div>
        <h1>Prove access privately.</h1>
        <p>Use a member secret and clearance level. The proof reveals access, not either input.</p>
      </header>

      {walletError && <div className="alert alert-error" role="alert"><AlertCircle size={16} aria-hidden="true" /> {walletError}</div>}

      <div className="two-column page-section-tight">
        <form className="surface panel stack" onSubmit={handleSubmit}>
          <div>
            <div className="status-line"><span className={isConnected ? 'status-dot ok' : 'status-dot'} /> <strong>{isConnected ? 'Wallet connected' : 'Wallet not connected'}</strong><span className="muted">{isConnected ? 'Ready for Preprod' : 'Preview mode available'}</span></div>
            <h2 style={{ marginTop: 19 }}>Private member inputs</h2>
            <p className="helper">These values are passed directly into the Compact circuit. They are not sent to Asterveil as form data.</p>
          </div>

          <div className="field">
            <label htmlFor="member-secret">Member secret</label>
            <input id="member-secret" className="input mono" value={memberSecret} onChange={(event) => setMemberSecret(event.target.value)} autoComplete="off" spellCheck={false} aria-describedby="secret-help" />
            <span id="secret-help" className="helper">32 bytes, written as 64 hexadecimal characters. The prefilled value matches a fresh demo gate deployment.</span>
          </div>
          <div className="field">
            <label htmlFor="clearance">Clearance level</label>
            <input id="clearance" className="input mono" type="number" min="0" max="255" value={clearance} onChange={(event) => setClearance(event.target.value)} aria-describedby="clearance-help" />
            <span id="clearance-help" className="helper">The gate default is level {MINIMUM_CLEARANCE}; your exact level remains private.</span>
          </div>

          {!isConnected && (
            <div className="alert alert-info"><Wallet size={17} aria-hidden="true" /><span>Connect Lace or 1AM to broadcast. Without a wallet, the action runs as a clearly marked local preflight.</span></div>
          )}
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={status === 'proving'}>
              {status === 'proving' ? <LoaderCircle className="spin" size={17} aria-hidden="true" /> : <LockKeyhole size={17} aria-hidden="true" />}
              {status === 'proving' ? 'Synthesizing proof' : isConnected ? 'Prove and register' : 'Run local preflight'}
            </button>
            {!isConnected && <button className="button button-secondary" type="button" onClick={() => void connect('preprod')} disabled={isConnecting}><Wallet size={17} aria-hidden="true" /> {isConnecting ? 'Connecting' : 'Connect wallet'}</button>}
          </div>
          {error && <div className="alert alert-error" role="alert"><AlertCircle size={16} aria-hidden="true" /><span>{error}</span></div>}
          {status === 'preview' && <div className="alert alert-info" role="status"><CheckCircle2 size={16} aria-hidden="true" /><span>Preflight complete. No transaction was broadcast because no wallet was connected.</span></div>}
        </form>

        <div className="stack">
          <div className="console" aria-live="polite">
            <div className="console-head"><span className="console-title"><Terminal size={15} aria-hidden="true" /> prove_access telemetry</span><span className="console-badge">{status === 'proving' ? 'RUNNING' : status === 'success' ? 'FINALIZED' : 'READY'}</span></div>
            <div className="console-progress"><span style={{ width: `${progress}%` }} /></div>
            <div className="console-body">
              {logs.map((line, index) => <div className={`console-line ${line.tone}`} key={`${line.text}-${index}`}>{line.text}</div>)}
            </div>
          </div>

          {status === 'success' && badgeCommitment && (
            <section className="result-panel" aria-labelledby="proof-result-title">
              <div className="result-heading"><span className="result-icon"><CheckCircle2 size={21} aria-hidden="true" /></span><div><h2 id="proof-result-title">Access proven</h2><p>Only the claim was recorded on Midnight.</p></div></div>
              <div className="hash-box"><label htmlFor="badge-commitment">Public badge commitment</label><code id="badge-commitment">{badgeCommitment}</code></div>
              {transactionId && <div className="hash-box"><label htmlFor="transaction-id">Transaction id</label><code id="transaction-id">{transactionId}</code></div>}
              <div className="inline-actions">
                <button className="button button-secondary button-compact" type="button" onClick={() => void copyCommitment()}><Clipboard size={15} aria-hidden="true" /> {copied ? 'Copied' : 'Copy badge'}</button>
                <button className="button button-secondary button-compact" type="button" onClick={downloadReceipt}><FileDown size={15} aria-hidden="true" /> Download receipt</button>
                <a className="button button-ghost button-compact" href={explorer} target="_blank" rel="noreferrer"><ExternalLink size={15} aria-hidden="true" /> Explorer</a>
              </div>
              <p className="helper">A verifier can paste this commitment into the <Link to="/registry" className="text-soft"><u>registry</u></Link>. Your member secret is not needed to inspect the public receipt.</p>
            </section>
          )}

          {status !== 'success' && (
            <div className="surface panel">
              <div className="status-line"><KeyRound size={16} aria-hidden="true" /><strong>What becomes visible?</strong></div>
              <p className="helper" style={{ marginTop: 10 }}>The gate stores its policy, a one-time nullifier, and your badge commitment. The secret and clearance are used to satisfy constraints, then stay behind the proof boundary.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
