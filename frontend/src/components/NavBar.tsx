import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, Menu, Wallet, X, LogOut } from 'lucide-react';
import OrbitMark from './OrbitMark';
import ContractAddressBar from './ContractAddressBar';
import { useWallet } from '../contexts/WalletContext';
import { shorten } from '../lib/bytes';

const links = [
  { label: 'Home', path: '/' },
  { label: 'Prove access', path: '/prove' },
  { label: 'Registry', path: '/registry' },
  { label: 'Docs', path: '/docs' },
];

export default function NavBar() {
  const location = useLocation();
  const { address, isConnected, isConnecting, connect, disconnect, error: walletError } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {location.pathname !== '/' && <ContractAddressBar />}
      <header className="site-header">
        <div className="nav-shell">
          <Link className="brand" to="/" onClick={() => setMobileOpen(false)}>
            <OrbitMark size={34} />
            <span className="brand-lockup"><span className="brand-wordmark">Asterveil</span><small>private access</small></span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {links.map((link) => (
              <Link
                key={link.path}
                className={isActive(link.path) ? 'nav-link active' : 'nav-link'}
                to={link.path}
                aria-current={isActive(link.path) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            <Link className={isActive('/admin') ? 'nav-link nav-link-admin active' : 'nav-link nav-link-admin'} to="/admin" aria-current={isActive('/admin') ? 'page' : undefined}>
              Deploy gate
            </Link>
          </nav>

          <div className="nav-actions">
            {isConnected && address ? (
              <button className="wallet-chip" type="button" onClick={disconnect} title="Disconnect wallet">
                <Wallet size={15} aria-hidden="true" />
                <span>{shorten(address, 5, 4)}</span>
                <LogOut size={14} aria-hidden="true" />
              </button>
            ) : (
              <button className="button button-primary button-compact" type="button" onClick={() => void connect('preprod')} disabled={isConnecting}>
                <Wallet size={16} aria-hidden="true" />
                {isConnecting ? 'Connecting' : 'Connect wallet'}
              </button>
            )}
            <button
              className="icon-button mobile-menu-toggle"
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {walletError && (
          <div className="contract-error" role="alert" aria-live="assertive">
            <AlertCircle size={13} aria-hidden="true" />
            <span>Wallet connection failed: {walletError}</span>
          </div>
        )}
        {mobileOpen && (
          <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                key={link.path}
                className={isActive(link.path) ? 'mobile-nav-link active' : 'mobile-nav-link'}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link.path) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            <Link className={isActive('/admin') ? 'mobile-nav-link active' : 'mobile-nav-link'} to="/admin" onClick={() => setMobileOpen(false)} aria-current={isActive('/admin') ? 'page' : undefined}>
              Deploy gate
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
