# SenimScope

**SenimScope — AI-помощник для согласования объёма, изменений и приёмки этапов фриланс-проектов.**

The prototype helps a client and freelancer keep the agreed scope, acceptance checklist, and proposed scope changes together. AI is an assistant: it can flag a possible mismatch, but it does not decide what is in scope or release money.

## Run locally

Requires Node.js 24 or newer.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The wallet controls use the Solana Foundation Kit + Wallet Standard starter and default to devnet. Sign in with the connected wallet before changing the demo project. Sign-in verifies a one-time message signature and does not submit a transaction.

## Current demo flow

1. Review the agreed milestone and its acceptance checklist.
2. Sign in with the connected wallet, then toggle checklist items; acceptance becomes available once all criteria are complete.
3. Review an AI-style scope-change suggestion based on a client message.
4. Save a change request draft. It remains unapproved until both parties agree.

The workspace saves one demo project to `.local-data/senimscope-demo.json` through local-only Next.js route handlers. Checklist changes, milestone acceptance, dismissed suggestions, and change-request drafts survive a page refresh. This file is ignored by Git. Mutations require a wallet-signature session: the server verifies an expiring, one-time challenge and sets an HttpOnly cookie. The session lasts up to eight hours and is held in server memory, so restarting the dev server signs the user out. This proves control of the wallet address only; project roles are not assigned or checked yet. The app uses a transparent deterministic rules demo to compare the sample message with scope items; no external LLM or database is connected.

Local API routes are disabled in production builds. The JSON store is a development adapter for this single-machine prototype, not a multi-user database or a production persistence layer.

## Product and architecture

- [Product brief](docs/PRODUCT_SPEC.md)
- [Architecture and next steps](docs/ARCHITECTURE.md)
- [Brand guide](brand.md)

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS v4
- Official Solana Foundation Kit/Next.js starter, updated to Kit v8, for wallet discovery and devnet selection
- `@solana/kit` + `@solana/react` for future on-chain interactions
- Ivory Linen brand palette, Inter + JetBrains Mono

## Safety boundary for the hackathon MVP

Keep the demo on devnet. Local wallet sign-in authenticates control of an address, but does not establish a client/freelancer role or authorize party-specific approvals. Do not present UI acceptance as an on-chain escrow action. Before handling real funds, define a legal and operational model for the project jurisdictions, obtain an independent program review, and specify dispute and refund paths.
