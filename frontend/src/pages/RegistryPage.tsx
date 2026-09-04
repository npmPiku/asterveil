import { useEffect, useState, type FormEvent } from 'react';
import { Search, ShieldAlert, ShieldCheck, Activity, Database, ExternalLink, RefreshCw } from 'lucide-react';
import { ledger } from '../managed/contract/index.js';
import { EXPLORER_URLS, getStoredContractAddress, isValidContractAddress } from '../config';
import { useWallet } from '../contexts/WalletContext';
import { hexToBytes, shorten } from '../lib/bytes';

type RegistryResult = { found: boolean; commitment: string; checkedAt: string } | null;

type PublicStats = { verified: string; capacity: string; minimum: string; status: string };

export default function RegistryPage() {
  const { session, isConnected } = useWallet();
  const [address, setAddress] = useState(getStoredContractAddress());
  const [commitment, setCommitment] = useState('');
  const [result, setResult] = useState<RegistryResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [querying, setQuerying] = useState(false);
  const [stats, setStats] = useState<PublicStats>({ verified: '—', capacity: '—', minimum: '—', status: 'Awaiting indexer' });

  useEffect(() => {
    const sync = (event: Event) => setAddress((event as CustomEvent<string>).detail || getStoredContractAddress());
    window.addEventListener('asterveil-contract-changed', sync);
    return () => window.removeEventListener('asterveil-contract-changed', sync);
  }, []);

  useEffect(() => {
    const loadPublicState = async () => {
      if (!session?.providers.publicDataProvider || !isValidContractAddress(address)) return;
      try {
        const raw = await session.providers.publicDataProvider.queryContractState(address);
        if (!raw?.data) return;
        const state = ledger(raw.data);
        setStats({
          verified: state.verified_entries.toString(),
          capacity: state.max_entries.toString(),
          minimum: state.minimum_clearance.toString(),
          status: state.is_open ? 'Open for entries' : 'Closed',
        });
      } catch {
        setStats((current) => ({ ...current, status: 'Indexer unavailable' }));
      }
    };
    void loadPublicState();
  }, [address, isConnected, session]);

  const checkCommitment = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    if (!isValidContractAddress(address)) {
      setError('Deploy or select a valid Midnight contract address first.');
      return;
    }
    let bytes: Uint8Array;
    try {
      bytes = hexToBytes(commitment);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      return;
    }
    if (!session?.providers.publicDataProvider) {
      setError('Connect a Lace or 1AM wallet so the app can query the Midnight indexer.');
      return;
    }

    setQuerying(true);
    try {
      const raw = await session.providers.publicDataProvider.queryContractState(address);
      if (!raw?.data) throw new Error('The indexer has not returned state for this gate yet.');
      const state = ledger(raw.data);
      setStats({ verified: state.verified_entries.toString(), capacity: state.max_entries.toString(), minimum: state.minimum_clearance.toString(), status: state.is_open ? 'Open for entries' : 'Closed' });
      setResult({ found: state.badge_registry.member(bytes), commitment: `0x${commitment.replace(/^0x/i, '')}`, checkedAt: new Date().toLocaleString() });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div className="eyebrow">Public registry</div>
        <h1>Verify a public badge.</h1>
        <p>Check a badge commitment against the public Midnight registry. No secret or wallet identity is revealed.</p>
      </header>

      <div className="stats-grid page-section-tight" aria-label="Public gate statistics">
        <div className="stat-card"><div className="stat-label"><Activity size={14} aria-hidden="true" />Entries</div><strong>{stats.verified}</strong><span>registered proofs</span></div>
        <div className="stat-card"><div className="stat-label"><Database size={14} aria-hidden="true" />Capacity</div><strong>{stats.capacity}</strong><span>maximum entries</span></div>
        <div className="stat-card"><div className="stat-label"><ShieldCheck size={14} aria-hidden="true" />Policy</div><strong>{stats.minimum}</strong><span>minimum clearance</span></div>
        <div className="stat-card"><div className="stat-label"><Activity size={14} aria-hidden="true" />State</div><strong style={{ fontSize: 19 }}>{stats.status}</strong><span>{isConnected ? 'Live indexer read' : 'Connect to read state'}</span></div>
      </div>

      <div className="registry-layout page-section-tight">
        <form className="surface panel stack" onSubmit={checkCommitment}>
          <div><div className="status-line"><Search size={16} aria-hidden="true" /><strong>Verify a public commitment</strong></div><p className="helper" style={{ marginTop: 10 }}>This query reads only `badge_registry`. It cannot recover a member secret, clearance, or identity.</p></div>
          <div className="field"><label htmlFor="commitment">Badge commitment</label><input id="commitment" className="input mono" value={commitment} onChange={(event) => setCommitment(event.target.value)} placeholder="0x + 64 hexadecimal characters" spellCheck={false} /></div>
          {error && <div className="alert alert-error" role="alert"><ShieldAlert size={16} aria-hidden="true" /> <span>{error}</span></div>}
          <button className="button button-primary" type="submit" disabled={querying || !commitment}>{querying ? <RefreshCw className="spin" size={17} aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}{querying ? 'Reading Midnight' : 'Check commitment'}</button>
          {!isConnected && <p className="helper">A wallet connection is required for an indexer query. No transaction approval is needed.</p>}
        </form>

        {result ? (
          <section className={result.found ? 'surface panel certificate' : 'surface panel'} aria-live="polite">
            <div className="result-heading"><span className="result-icon" style={!result.found ? { color: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 10%, transparent)' } : undefined}>{result.found ? <ShieldCheck size={21} aria-hidden="true" /> : <ShieldAlert size={21} aria-hidden="true" />}</span><div><h2 style={{ color: result.found ? 'var(--success)' : 'var(--danger)' }}>{result.found ? 'Badge found' : 'No badge found'}</h2><p style={{ color: result.found ? 'var(--success)' : 'var(--danger)' }}>{result.found ? 'The commitment is registered in the public set.' : 'This exact commitment is not in the public set.'}</p></div></div>
            <dl className="detail-list"><div className="detail-row"><dt>Commitment</dt><dd className="mono">{result.commitment}</dd></div><div className="detail-row"><dt>Gate</dt><dd className="mono">{shorten(address)}</dd></div><div className="detail-row"><dt>Checked</dt><dd>{result.checkedAt}</dd></div></dl>
            <a className="button button-secondary button-compact" href={`${EXPLORER_URLS[session?.config?.networkId === 'preview' ? 'preview' : 'preprod']}${address}`} target="_blank" rel="noreferrer"><ExternalLink size={15} aria-hidden="true" /> View gate on Explorer</a>
          </section>
        ) : (
          <div className="surface empty-result"><div><Database size={28} aria-hidden="true" /><p>Public result will appear here after an indexer read.</p></div></div>
        )}
      </div>
    </div>
  );
}
