# Asterveil product proposal

## 1. Product and user

Asterveil is a privacy-preserving private allowlist gate for small, high-trust circles: research collectives, private events, contributor rooms, and invitation-only releases. A member receives a 32-byte secret. When they need access, they prove that the secret belongs to the gate's allowlist commitment and that their private clearance meets the gate's public minimum. The verifier sees a public badge commitment and can check that it is registered; they do not receive the member's name, secret, exact clearance, or reusable identity profile.

The initial product is intentionally narrow. It replaces repeated document or identity collection with one compact proof flow: configure a gate, prove access, and inspect the public registry.

## 2. Why Midnight

A conventional transparent chain would expose the circuit arguments needed to make an access decision. A centralized database would make the member secret and access history valuable breach targets. Midnight provides the dual-state model Asterveil needs:

- public ledger variables make the gate policy and registry auditable;
- private circuit inputs remain inside the proof boundary;
- Compact lets the product state its constraints directly;
- browser-compatible Midnight.js providers connect the proof to Lace or 1AM;
- a nullifier prevents the same private member secret from replaying the entry flow.

The circuit does not pretend to reveal identity. It proves a relationship between a private secret and a public commitment, then selectively discloses only the minimum registry data needed by the product.

## 3. Data model

### Public ledger

- `gate_name`: a human-readable 32-byte label.
- `allowlist_root`: a domain-separated commitment derived from the accepted member secret.
- `minimum_clearance`: the public lower bound for entry.
- `max_entries` and `verified_entries`: public capacity accounting.
- `nullifiers`: one-way values that prevent replay.
- `badge_registry`: pseudonymous commitments that verifiers can look up.
- `admin_public_key`: a hash of the private administrator secret.
- `is_open`: a public emergency gate state.

### Private circuit inputs

- `member_secret`: the member's 32-byte secret.
- `member_clearance`: the member's exact clearance, used only in the comparison.
- `admin_secret`: the administrator's private key for policy changes.

### Selective disclosure

The constructor discloses public policy because a gate must be auditable. `prove_access` never discloses `member_secret` or `member_clearance`. It discloses only the derived nullifier and the user-supplied badge commitment. The nullifier provides replay protection; it is not an identity reveal.

## 4. Product flow

1. An administrator opens `/admin`, selects Preview or Preprod, and connects Lace/1AM.
2. The browser derives the allowlist and admin public hashes from private seed values.
3. The wallet balances and submits the deploy transaction; the application stores the new contract address locally.
4. A member opens `/prove`, enters their private values, and calls `prove_access`.
5. A verifier opens `/registry`, queries the indexer, and checks the public badge commitment.

## 5. Feasibility and scope

The first MVP does not attempt to become a general identity layer. Its circuit surface is small enough to test locally and explain clearly. Before mainnet, the project should add:

- an external Compact and threat-model review;
- a real allowlist issuance and rotation process;
- wallet/API version monitoring;
- key custody and recovery procedures for administrators;
- a controlled proving deployment with a documented trust boundary;
- rate limits and operational monitoring for registry queries.

The Level 1–4 milestone is complete when the code path, generated artifacts, documentation, CI build, and Preprod deployment are independently verifiable. Wallet approvals, public hosting, screenshots, external profile creation, and commit history remain release operations rather than claims made by this document.
