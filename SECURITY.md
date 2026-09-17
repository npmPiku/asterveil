# Asterveil security policy

Asterveil is an experimental privacy-preserving access prototype. Do not use production credentials or sensitive member data until the Compact circuit, wallet integration, proving boundary, and deployment operations have been independently reviewed.

## Private material

Never commit:

- wallet mnemonics or seed phrases;
- admin secrets;
- member secrets for a real gate;
- `.env.preprod`, `.env.preview`, or frontend local environment files;
- unreviewed proving-server credentials.

The demo seeds shown in the UI are public examples and must be rotated for any real deployment.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose private witnesses, admin authorization, wallet keys, or deployment access. Contact the repository owner through the private security channel configured for the eventual public repository. Include reproduction steps, affected paths, network, toolchain versions, and whether the issue affects public ledger state or private proving inputs.

## Threat-model reminders

- A proof server receives private witness data. Use a local or controlled encrypted proving endpoint.
- A badge commitment is pseudonymous, not an identity guarantee.
- A nullifier prevents replay but can still be a public correlation signal.
- Browser localStorage is not a secure secret vault.
