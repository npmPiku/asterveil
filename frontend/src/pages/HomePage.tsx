import { ArrowRight, Check, EyeOff, KeyRound, LockKeyhole, Orbit, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroModel from '../components/HeroModel';

const modelRows = [
  ['Gate policy', 'Public', 'The rule that defines who can enter.'],
  ['Member secret', 'Private', 'A 32-byte value held by the member.'],
  ['Clearance level', 'Private', 'Proven against the public minimum, never disclosed.'],
  ['Badge commitment', 'Public', 'A pseudonymous receipt that can be checked later.'],
];

export default function HomePage() {
  return (
    <>
      <section className="hero home-hero">
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="page-shell hero-grid">
          <div className="hero-copy-column">
            <div className="eyebrow"><span className="eyebrow-mark" /> Private access layer · Midnight Preprod</div>
            <h1>Belong without<br /><em>being exposed.</em></h1>
            <p className="hero-copy">
              Asterveil turns membership into a quiet, verifiable signal. Your secret stays behind the veil; only the answer travels.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/prove"><LockKeyhole size={17} aria-hidden="true" /> Prove access <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link className="button button-secondary" to="/docs"><EyeOff size={17} aria-hidden="true" /> How it works</Link>
            </div>
            <div className="hero-meta" aria-label="Protocol guarantees">
              <span><strong>0</strong> identity fields</span>
              <span><strong>1</strong> minimal proof</span>
              <span><ShieldCheck size={14} aria-hidden="true" /> sealed by design</span>
            </div>
          </div>

          <div className="hero-aside">
            <HeroModel />
          </div>
        </div>
        <div className="hero-footer-note page-shell"><span>01 / 04</span><span>Scroll to explore the boundary</span><span className="scroll-line" /></div>
      </section>

      <div className="page-shell proof-strip" aria-label="Protocol facts">
        <div className="proof-stat"><strong>0</strong><span>identity fields on-chain</span></div>
        <div className="proof-stat"><strong>32 bytes</strong><span>private member secret</span></div>
        <div className="proof-stat"><strong>1 proof</strong><span>replay-resistant receipt</span></div>
        <div className="proof-stat"><strong>Preprod</strong><span>Midnight network target</span></div>
      </div>

      <section className="page-shell page-section experience-section">
        <div className="section-heading section-heading-split">
          <div>
            <div className="eyebrow">The experience</div>
            <h2>A gate with no appetite for your identity.</h2>
          </div>
          <p>Made for private events, research circles, and communities that need a yes or no — not a dossier.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card featured">
            <div className="feature-visual feature-visual-one" aria-hidden="true"><span>01</span></div>
            <div className="feature-content"><KeyRound size={19} aria-hidden="true" /><h3>Bring a secret</h3><p>Inputs live in your session, never on the ledger.</p></div>
          </article>
          <article className="feature-card">
            <div className="feature-visual feature-visual-two" aria-hidden="true"><span>02</span></div>
            <div className="feature-content"><Orbit size={19} aria-hidden="true" /><h3>Prove the threshold</h3><p>A Compact circuit checks the claim in private.</p></div>
          </article>
          <article className="feature-card">
            <div className="feature-visual feature-visual-three" aria-hidden="true"><span>03</span></div>
            <div className="feature-content"><Check size={19} aria-hidden="true" /><h3>Leave less behind</h3><p>Only a pseudonymous receipt becomes public.</p></div>
          </article>
        </div>
      </section>

      <section className="page-shell page-section-tight boundary-section">
        <div className="split-section">
          <div className="section-heading">
            <div className="eyebrow">Public / private by design</div>
            <h2>The veil has a deliberate edge.</h2>
            <p>Auditable policy on one side. Sovereign inputs on the other.</p>
            <Link className="button button-ghost" to="/docs">Inspect the contract model <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="model-list">
            {modelRows.map(([name, visibility, description]) => (
              <div className="model-row" key={name}>
                <strong>{name}</strong>
                <span className={visibility === 'Public' ? 'public' : 'private'}><b>{visibility}</b>{description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell page-section-tight">
        <div className="cta-band">
          <div><div className="eyebrow">Your next move</div><h2>Step through the quiet gate.</h2><p>Run a local preflight or connect a wallet to register your proof on Preprod.</p></div>
          <Link className="button button-primary" to="/prove"><Sparkles size={17} aria-hidden="true" /> Open proof terminal</Link>
        </div>
      </section>
    </>
  );
}
