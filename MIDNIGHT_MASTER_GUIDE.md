# Asterveil Midnight build guide

This guide is the project-local source of truth for the Asterveil build. It distills the Midnight development rules used by this repository into an implementation and verification checklist.

## 1. Product contract

Asterveil is a **Private Allowlist Access** dApp. The product proves that a member holds an approved secret and meets a minimum clearance without publishing the secret, exact clearance, or identity.

The public/private boundary is:

| Value | Domain | Why |
| --- | --- | --- |
| `gate_name` | Public ledger | The gate needs a readable label. |
| `allowlist_root` | Public ledger | The allowlist commitment is auditable without exposing its preimage. |
| `minimum_clearance` | Public ledger | A verifier must know the rule being enforced. |
| `max_entries`, `verified_entries` | Public ledger | Capacity and usage are intentionally visible. |
| `badge_registry`, `nullifiers` | Public ledger | Verifiers need a lookup set and replay protection. |
| `member_secret` | Private circuit input | The secret is the membership proof. |
| `member_clearance` | Private circuit input | The exact value should not be disclosed. |
| `admin_secret` | Private circuit input | Policy authority must not be stored as raw key material. |

`disclose()` is used only for values intentionally entering public ledger state. Private inputs are compared or hashed inside the circuit and are not written to public state.

## 2. Supported toolchain

Use the tested compatibility set:

- Node.js 22 or newer
- Yarn 1.22
- Docker Desktop
- Compact devtools 0.5.1
- Compact compiler 0.31.1, language 0.23.0
- Compact runtime 0.16.0
- Midnight.js 4.1.1
- DApp Connector API 4.0.1
- Proof server 8.1.0

Native Windows development is not supported by the Compact toolchain. Use WSL. The local compile script defaults to Ubuntu and the `deep_saha` WSL user; set `MIDNIGHT_WSL_DISTRO` and `MIDNIGHT_WSL_USER` for another installation.

Official references:

- https://docs.midnight.network/getting-started/installation
- https://docs.midnight.network/relnotes/support-matrix
- https://docs.midnight.network/guides/react-wallet-connect
- https://docs.midnight.network/guides/local-proving
- https://github.com/midnightntwrk/midnight-dapp-connector-api
- https://github.com/midnightntwrk/midnight-js

## 3. Repository layout

```text
contracts/asterveil.compact       # hand-written Compact source
contracts/index.ts                # generated binding entry point
contracts/managed/asterveil/      # generated; never hand-edit
frontend/src/managed/              # generated copy imported by React
frontend/public/managed/           # generated copy served by Vite
frontend/src/lib/midnight.ts      # browser provider/session factory
frontend/src/contexts/             # wallet and theme state
frontend/src/pages/                # product screens
src/providers.ts                  # Node provider composition
src/test/asterveil.test.ts         # integration tests
scripts/compile.js                # compiler + artifact sync
scripts/deploy.ts                 # command-line deploy helper
.github/workflows/ci.yaml          # compile/test/frontend build
```

Managed artifacts are part of the deployable application. After every compile, both frontend copies must be synchronized.

## 4. Compact rules used by this project

Every Compact source starts with:

```compact
pragma language_version >= 0.22.0;
import CompactStandardLibrary;
```

Public state is explicit:

```compact
export ledger allowlist_root: Bytes<32>;
export ledger minimum_clearance: Uint<8>;
export ledger badge_registry: Set<Bytes<32>>;
```

Private inputs are circuit parameters:

```compact
export circuit prove_access(
    member_secret: Bytes<32>,
    member_clearance: Uint<8>,
    badge_commitment: Bytes<32>
): [] {
    assert(derive_member_key(member_secret) == allowlist_root);
    assert(member_clearance >= minimum_clearance);
    badge_registry.insert(disclose(badge_commitment));
}
```

Hash every purpose with a domain separator:

```compact
export pure circuit derive_member_key(member_secret: Bytes<32>): Bytes<32> {
    return persistentHash<Vector<2, Bytes<32>>>([
        pad(32, "asterveil:member:v1"), member_secret
    ]);
}
```

Arithmetic widens Compact integer types. Cast the result before writing it back:

```compact
verified_entries = disclose((verified_entries + 1) as Uint<32>);
```

Generated bindings map:

- `Uint<N>` → `bigint`
- `Bytes<32>` → `Uint8Array` of exactly 32 bytes
- `Boolean` → `boolean`

Do not pass JavaScript numbers or variable-length text buffers where generated bindings require `bigint` or exactly 32 bytes.

## 5. Compilation

Run:

```bash
yarn compile
```

The script runs:

```bash
compact compile contracts/asterveil.compact contracts/managed/asterveil
```

and copies the result to both frontend managed directories. Expected generated files include:

```text
contract/index.d.ts
contract/index.js
contract/contract-info.json
keys/*.prover
keys/*.verifier
zkir/*.zkir
zkir/*.bzkir
```

The current circuits are:

- pure `derive_member_key`
- pure `derive_member_nullifier`
- pure `derive_admin_key`
- `prove_access`
- `update_gate`
- `set_gate_open`

## 6. Browser provider pattern

A browser transaction needs all of these provider responsibilities:

1. private state provider — in-memory browser state;
2. public data provider — patched Midnight GraphQL indexer reader;
3. ZK config provider — fetches `/managed` assets;
4. proof provider — asks the connected wallet proving provider to prove;
5. wallet provider — balances the unsealed transaction;
6. Midnight provider — submits the serialized transaction.

Wallet discovery should enumerate the injected `window.midnight` values and select an API exposing `connect`. Do not depend on one hard-coded injection key when multiple wallets can be installed. Always connect with the explicit target network (`preview` or `preprod`) and verify the returned configuration before building a transaction.

The browser Admin page uses:

```ts
const deployTxData = await createUnprovenDeployTx(session.providers, {
  compiledContract,
  args: [gateNameBytes, allowlistRoot, minimum, capacity, adminPublicKey],
  initialPrivateState: {},
  signingKey: sampleSigningKey(),
});

await submitTxAsync(session.providers, {
  unprovenTx: deployTxData.private.unprovenTx,
});
```

`privateStateId` belongs to the finalized `submitDeployTx`/`deployContract` option shape. It is not needed by `createUnprovenDeployTx` when the page is constructing an unproven transaction for manual submission.

`submitTxAsync` confirms submission to the provider; it is not a finality watcher. A production release should add transaction finality polling and indexer confirmation before presenting a deployment as finalized. The current UI labels the address as locally active after wallet submission and links to the explorer for independent verification.

## 7. Local network and tests

Start services:

```bash
yarn env:up
yarn wait:dust
```

Run tests serially:

```bash
yarn test:local
yarn env:down
```

The test suite verifies:

- five constructor arguments initialize public policy correctly;
- a valid member proof increments `verified_entries` and inserts a badge commitment;
- an unknown secret is rejected;
- replaying a member secret is rejected by the nullifier set;
- raw member inputs are absent from the public ledger representation.

Remote tests require one of `MIDNIGHT_PREPROD_MNEMONIC` / `MIDNIGHT_PREPROD_SEED` or the matching Preview variables. Never commit those files.

## 8. Frontend behavior

The frontend must provide:

- visible labels and helper text for every input;
- keyboard-visible focus states;
- loading, success, and error feedback for wallet and proof operations;
- explicit local preflight language when no wallet is connected;
- copyable contract and badge values with accessible names;
- responsive layouts at small phone, tablet, and desktop widths;
- night and day themes with readable contrast;
- reduced-motion support;
- no emoji used as structural icons.

Routes:

- `/` — product overview and public/private model
- `/prove` — member proof terminal
- `/registry` — public badge lookup
- `/admin` — browser deployment page
- `/docs` — architecture, setup, and level checklist

## 9. Level 1–4 acceptance matrix

### Level 1 — New Moon

Code deliverables: toolchain instructions, Compact source, successful generated `managed/` directory, tests, README idea paragraph, public/private explanation, compile and deployment UI.

Manual release deliverables: deploy to Preview/Preprod, record the visible address, add compile/deployment/test screenshots, make five meaningful commits, and publish the repository.

### Level 2 — Crescent

Code deliverables: Lace/1AM connect/disconnect, `prove_access` call, registry query, observable behavior that only a commitment/nullifier is public.

Manual release deliverables: hosted demo, verifiable Preprod address, wallet + circuit demo video, eight meaningful commits.

### Level 3 — First Quarter

Code deliverables: selected Private Allowlist Access proposal, four tests, CI workflow, responsive interface, and complete privacy model.

Manual release deliverables: passing workflow badge/run, one-minute demo, approval submission, ten meaningful commits.

### Level 4 — Waxing Gibbous

Code deliverables: browser Admin deployer, Preview/Preprod selector, localStorage address persistence, setup/usage/privacy documentation, CI build path.

Manual release deliverables: live Preprod MVP, final contract address, demo video, product X profile link, fifteen meaningful commits.

## 10. Security boundaries

The default member and admin seeds in the demo UI are public examples. They do not provide security. Replace them before any real deployment. Do not place private seed values in frontend build variables. Use a controlled proving endpoint or local proof server because a proof server receives private witnesses even though it cannot sign wallet transactions.
