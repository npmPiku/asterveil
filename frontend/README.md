# Asterveil web client

The browser application for Asterveil, a private allowlist gate on Midnight.

## Development

From the repository root:

```bash
yarn compile
cd frontend
npm install
npm run dev
```

`yarn compile` must run before the frontend build so `src/managed` and `public/managed` contain the generated Asterveil bindings and ZK assets.

## Routes

- `/` — product overview
- `/prove` — private access proof terminal
- `/registry` — public badge lookup
- `/admin` — browser-based Preview/Preprod deployment
- `/docs` — architecture and setup notes

The client supports Lace and 1AM through the Midnight DApp Connector API. Connect to the same network as the active contract before approving a transaction. See the root [`README.md`](../README.md) for the complete toolchain, privacy model, and level checklist.
