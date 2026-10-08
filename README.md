# SenimScope — Agreements Without the Guesswork

> An AI-assisted workspace for freelancers and clients to agree on project scope, review new requests, and accept milestones—with people in control of every decision.

[Product brief](docs/PRODUCT_SPEC.md) · [Architecture](docs/ARCHITECTURE.md) · [Brand guide](brand.md)

**Live deployment:** [senimscope.vercel.app](https://senimscope.vercel.app) · [View on Vercel](https://vercel.com/ernur5/senimscope/FCzBZCaUwKsZvKqvArrY5kJenrV6)

---

## The Problem

Freelance projects often begin with an informal brief and evolve in chat. A small request can quietly become extra work, while both sides remember the original agreement differently.

SenimScope keeps the agreed deliverables, acceptance criteria, and proposed changes together. It helps both participants see what changed and make the decision themselves.

## How It Works

1. **Agree on the scope** — capture deliverables and milestone acceptance criteria.
2. **Compare a new request** — SenimScope highlights the message and scope items that may be related.
3. **Discuss the change** — turn a possible scope change into a draft request for both sides to review.
4. **Review the milestone** — check work against the agreed criteria before recording acceptance.

AI is an assistant, not an arbiter. It cannot change scope, accept work, set a price, or move funds.

---

## Why Solana

Wallet identity gives participants a familiar way to prove control of an address. As the product develops, Solana can provide a verifiable record of agreed scope versions and milestone decisions, while briefs and private messages stay off-chain.

The current prototype connects to a devnet wallet and uses a signed message for local sign-in. It submits no Solana transactions and does not store project agreements on-chain.

---

## What Works Today

- Review a sample freelance project and its milestone checklist.
- Sign in by signing a one-time wallet message; no transaction is requested.
- Compare a sample client message with scope items using a transparent, deterministic rules demo.
- See the excerpts and scope references behind a suggestion.
- Save a change-request draft and update the local project state.

This is an early, single-machine prototype. The scope checker is not connected to an LLM. Wallet sign-in proves control of an address but does not assign client or freelancer roles. Local demo routes are disabled in production.

---

## Architecture

```text
┌─────────────────────────────┐
│ Next.js project workspace   │
│ scope · checklist · drafts  │
└──────────────┬──────────────┘
               │ local API routes
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌─────────────────────┐
│ Local JSON   │  │ Rules-based scope   │
│ project store│  │ comparison + evidence│
└──────────────┘  └─────────────────────┘

Wallet Standard + Solana Kit
  └─ devnet connection and signed-message sign-in
     (no transaction flow in this prototype)
```

The local project snapshot is stored in `.local-data/senimscope-demo.json`, which is ignored by Git. Sessions live in server memory and expire after eight hours or when the development server restarts. See the [architecture notes](docs/ARCHITECTURE.md) for the next implementation stages.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Web app | Next.js App Router · React · TypeScript |
| UI | Tailwind CSS v4 |
| Wallet | Solana Kit · Wallet Standard |
| Demo persistence | Local JSON through Next.js Route Handlers |
| Scope comparison | Deterministic rules demo with evidence references |
| Network | Solana devnet wallet connection; no on-chain writes yet |

---

## Run Locally

**Requirements:** Node.js 24.x and pnpm 11.25.0.

```bash
git clone https://github.com/Ernur-semey/SenimScope.git
cd SenimScope
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Connect a Wallet Standard-compatible wallet, then choose **Войти подписью** to enable local project changes. The sign-in message is not a transaction.

To create a production build locally:

```bash
pnpm build
```

### Vercel preview

The app can be deployed as a public, interactive demo without environment variables. In production preview mode it loads a fixed sample project; checklist, acceptance, and change-request edits stay in the current browser session and reset after a refresh. Scope-check messages are sent to the app's API for deterministic comparison and are not stored. Do not submit private client correspondence.

This preview has no production authentication, project roles, shared database, or on-chain transactions. It is suitable for a hackathon demo, not for real customer projects. See [Vercel deployment notes](docs/VERCEL_DEPLOYMENT.md).

---

## Roadmap

- [x] Local project workspace with milestone checklist and change-request drafts
- [x] Wallet-signed local session for project mutations
- [x] Explainable, deterministic scope comparison demo
- [ ] Shared project storage and explicit client/freelancer roles
- [ ] Evaluate an LLM scope assistant against a reviewed dataset
- [ ] Add mutual approval and version history
- [ ] Prototype a devnet program for scope hashes and project lifecycle events

See the [product brief](docs/PRODUCT_SPEC.md) and [architecture plan](docs/ARCHITECTURE.md) for details.

---

## Safety Boundaries

- Keep the prototype on devnet.
- Keep private briefs and messages off-chain.
- Treat scope suggestions as advisory and show the evidence behind them.
- Do not present UI acceptance as an on-chain approval or escrow action.
- Do not handle real funds until the product has a reviewed security, dispute, refund, and operating model.
