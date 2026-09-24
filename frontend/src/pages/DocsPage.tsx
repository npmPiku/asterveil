import { BookOpen, Eye, EyeOff, FileCode2, Lock, Network, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const contractSnippet = `pragma language_version >= 0.22.0;
import CompactStandardLibrary;

export ledger allowlist_root: Bytes<32>;
export ledger minimum_clearance: Uint<8>;
export ledger badge_registry: Set<Bytes<32>>;

export circuit prove_access(
    member_secret: Bytes<32>,
    member_clearance: Uint<8>,
    badge_commitment: Bytes<32>
): [] {
    assert(derive_member_key(member_secret) == allowlist_root);
    assert(member_clearance >= minimum_clearance);
    badge_registry.insert(disclose(badge_commitment));
}`;

export default function DocsPage() {
  return (
    <div className="page-shell">
      <header className="page-heading">
        <div className="eyebrow">Architecture notes</div>
        <h1>The shape of a selective reveal.</h1>
        <p>Asterveil is a small Compact contract with one job: make a private allowlist decision verifiable without turning the member into public data.</p>
      </header>

      <div className="docs-grid page-section-tight">
        <aside className="surface panel docs-nav" aria-label="Documentation navigation">
          <a href="#idea">The idea</a><a href="#model">Privacy model</a><a href="#contract">Compact contract</a><a href="#run">Run locally</a><a href="#levels">Level checklist</a>
        </aside>

        <div className="docs-content">
          <section id="idea" className="surface panel">
            <BookOpen size={21} color="var(--primary)" aria-hidden="true" />
            <h2>Private allowlist access</h2>
            <p>Asterveil is for groups that need to recognize an approved member without collecting a new identity dossier every time they open a door. The member holds a secret. The gate holds a commitment. A Compact circuit proves the relationship and records a one-time, pseudonymous badge.</p>
            <p>The product is intentionally narrow: an access proof, a public registry, and a browser-based deployer. It is not an identity provider and it does not claim that a badge identifies a person.</p>
          </section>

          <section id="model" className="surface panel">
            <Lock size={21} color="var(--accent)" aria-hidden="true" />
            <h2>Privacy model</h2>
            <p><strong>Public ledger state</strong> contains the gate label, allowlist root, minimum clearance, capacity, entry count, nullifiers, badge commitments, admin public key, and open/closed state. Those values are deliberately disclosed so an observer can audit the gate rules and count.</p>
            <p><strong>Private circuit inputs</strong> are the member secret, the member's clearance level, and the admin secret when policy changes. The circuit uses them to satisfy assertions; it does not write them to a ledger field.</p>
            <div className="feature-grid" style={{ marginTop: 20 }}>
              <div className="feature-card"><Eye size={19} color="var(--primary)" aria-hidden="true" /><h3>Observers can learn</h3><p>The policy, whether the gate is open, the number of registered entries, and whether a supplied badge commitment is present.</p></div>
              <div className="feature-card"><EyeOff size={19} color="var(--success)" aria-hidden="true" /><h3>Observers cannot learn</h3><p>The member secret, exact clearance, the preimage of the nullifier, or a real-world identity from the proof itself.</p></div>
            </div>
          </section>

          <section id="contract" className="surface panel">
            <FileCode2 size={21} color="var(--primary)" aria-hidden="true" />
            <h2>Compact contract</h2>
            <p>The generated `managed/` directory is committed as an application build artifact. It contains the contract wrapper, three circuit keys, and ZKIR files served from `/managed` for the browser proving provider.</p>
            <pre className="code-block"><code>{contractSnippet}</code></pre>
            <p className="helper">`disclose()` is an explicit boundary. Asterveil calls it for public policy and public registry values, never for the private member secret or clearance.</p>
          </section>

          <section id="run" className="surface panel">
            <Network size={21} color="var(--primary)" aria-hidden="true" />
            <h2>Run locally</h2>
            <h3>Prerequisites</h3>
            <ul><li>Node.js 22 or newer, Yarn 1.22, Docker Desktop, and Git.</li><li>Compact toolchain 0.31.1 through the official installer. Windows development uses WSL.</li><li>Lace or 1AM on Preview/Preprod for a browser deployment.</li></ul>
            <h3>Commands</h3>
            <pre className="code-block"><code>{`yarn install
yarn compile
yarn env:up
yarn wait:dust
yarn test:local
cd frontend && npm install && npm run dev`}</code></pre>
            <p>After `yarn compile`, the script synchronizes `contracts/managed/asterveil` into both `frontend/src/managed` and `frontend/public/managed`. Never hand-edit generated files.</p>
          </section>

          <section id="levels" className="surface panel">
            <ShieldCheck size={21} color="var(--success)" aria-hidden="true" />
            <h2>Level 1–4 readiness</h2>
            <ul>
              <li><strong>Level 1:</strong> Compact source, generated circuits and keys, local tests, deployment page, setup docs, and privacy model are included. A real deployment address and screenshots still require your wallet.</li>
              <li><strong>Level 2:</strong> Lace/1AM connect and disconnect, a live `prove_access` call, a public badge registry, and a network-aware explorer link are wired into the UI.</li>
              <li><strong>Level 3:</strong> The contract test suite covers deployment, valid proof, rejection/replay, and private-state boundaries. CI compiles, tests, and builds the frontend.</li>
              <li><strong>Level 4:</strong> Browser admin deployment supports Preview and Preprod, saves the active address locally, and documents the MVP. Add your public demo, X profile, screenshots, and finalized Preprod address before submission.</li>
            </ul>
            <Link className="button button-secondary" to="/admin">Open the deployment page</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
