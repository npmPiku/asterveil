import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import OrbitMark from './OrbitMark';
import { EXPLORER_URLS, getStoredContractAddress } from '../config';
import { shorten } from '../lib/bytes';

export default function Footer() {
  const address = getStoredContractAddress();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand-block">
          <div className="brand footer-brand">
            <OrbitMark size={30} />
            <span className="brand-wordmark">Asterveil</span>
          </div>
          <p>Private access proofs for circles that value belonging without exposure.</p>
        </div>
        <div>
          <p className="footer-label">Explore</p>
          <Link to="/prove">Prove access</Link>
          <Link to="/registry">Registry</Link>
          <Link to="/docs">Privacy model</Link>
        </div>
        <div>
          <p className="footer-label">Network</p>
          {address ? (
            <a href={`${EXPLORER_URLS.preprod}${address}`} target="_blank" rel="noreferrer" aria-label={`View gate ${shorten(address)} on Midnight Explorer`}>
              <ExternalLink size={14} aria-hidden="true" /> View {shorten(address)}
            </a>
          ) : (
            <span className="footer-muted">No gate deployed yet</span>
          )}
          <span className="footer-status"><ShieldCheck size={14} aria-hidden="true" /> Midnight Preprod</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Asterveil</span>
        <span>Proofs reveal access, not identity.</span>
      </div>
    </footer>
  );
}
