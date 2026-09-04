import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Pencil, RotateCcw, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import {
  EXPLORER_URLS,
  getContractAddressStatus,
  getStoredContractAddress,
  resetContractAddress,
  setStoredContractAddress,
} from '../config';
import { shorten } from '../lib/bytes';

export default function ContractAddressBar() {
  const [address, setAddress] = useState(getStoredContractAddress());
  const [draft, setDraft] = useState(address);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const validation = getContractAddressStatus(draft);

  useEffect(() => {
    const sync = (event: Event) => {
      const next = (event as CustomEvent<string>).detail || getStoredContractAddress();
      setAddress(next);
      setDraft(next);
    };
    window.addEventListener('asterveil-contract-changed', sync);
    return () => window.removeEventListener('asterveil-contract-changed', sync);
  }, []);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    if (validation.isValid && setStoredContractAddress(draft)) {
      setAddress(draft.replace(/^0x/i, ''));
      setEditing(false);
    }
  };

  const reset = () => {
    resetContractAddress();
    setAddress(getStoredContractAddress());
    setDraft(getStoredContractAddress());
    setEditing(false);
  };

  return (
    <div className="contract-bar">
      <div className="contract-bar-inner">
        <span className="network-dot" aria-hidden="true" />
        <span className="contract-label">Active Midnight gate</span>
        {editing ? (
          <form className="contract-edit" onSubmit={apply}>
            <label className="sr-only" htmlFor="contract-address">Contract address</label>
            <input
              id="contract-address"
              className="input input-inline mono"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Paste a 64-character address"
              spellCheck={false}
              autoFocus
            />
            <button className="button button-primary button-tiny" type="submit" disabled={!validation.isValid}>Apply</button>
            <button className="icon-button icon-button-small" type="button" onClick={() => setEditing(false)} aria-label="Cancel address editing"><X size={15} /></button>
          </form>
        ) : address ? (
          <>
            <code className="contract-value" title={address}>{shorten(address, 12, 10)}</code>
            <button className="icon-button icon-button-small" type="button" onClick={() => void copyAddress()} aria-label="Copy contract address">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
            <a className="icon-button icon-button-small" href={`${EXPLORER_URLS.preprod}${address}`} target="_blank" rel="noreferrer" aria-label="Open contract in Midnight Explorer">
              <ExternalLink size={15} />
            </a>
          </>
        ) : (
          <span className="contract-empty">Deploy a gate to activate this workspace</span>
        )}
        <div className="contract-actions">
          {address && <span className="validity"><ShieldCheck size={14} aria-hidden="true" /> Verified format</span>}
          {editing ? null : (
            <button className="text-button" type="button" onClick={() => { setDraft(address); setEditing(true); }}>
              <Pencil size={13} aria-hidden="true" /> Change
            </button>
          )}
          {address && <button className="text-button" type="button" onClick={reset}><RotateCcw size={13} aria-hidden="true" /> Reset</button>}
        </div>
      </div>
      {editing && !validation.isValid && draft && (
        <div className="contract-error" role="status"><ShieldAlert size={13} aria-hidden="true" /> {validation.message}</div>
      )}
    </div>
  );
}
