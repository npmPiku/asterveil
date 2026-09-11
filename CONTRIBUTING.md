# Contributing to Asterveil

Asterveil is a small privacy-first Midnight dApp. Contributions should preserve the product's central promise: prove an access claim without collecting the member's identity or private inputs.

## Before opening a change

1. Read `README.md`, `PROPOSAL.md`, and `MIDNIGHT_MASTER_GUIDE.md`.
2. Install Node.js 22, Yarn, Docker, and the Compact toolchain.
3. Run `yarn compile` after changing Compact source.
4. Run the relevant test or frontend build.

## Contract changes

Never hand-edit `contracts/managed/asterveil`, `frontend/src/managed`, or `frontend/public/managed`. They are compiler output. Update `contracts/asterveil.compact`, regenerate the artifacts, and include the generated files with the change.

For every new ledger field or circuit, document:

- whether it is public or private;
- why it is disclosed or kept inside the proof;
- how replay, authorization, and failure are handled;
- which integration test covers it.

## Frontend changes

Use the existing semantic tokens and Lucide icons. Keep visible focus states, associated form labels, keyboard operation, reduced-motion behavior, and mobile layouts. Do not present a local preflight as an on-chain transaction.

## Pull requests

Describe the user-visible change, the privacy boundary, commands run, and any manual Midnight wallet or deployment step that remains. Do not include wallet mnemonics, seeds, private admin values, or ignored environment files.
