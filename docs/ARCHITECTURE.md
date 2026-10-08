# SenimScope — architecture and implementation path

## Current prototype

The Next.js client UI loads one demo project through a local Route Handler. The handler persists state atomically in `.local-data/senimscope-demo.json`, which is ignored by Git. Checklist changes, milestone acceptance, dismissed suggestions, incoming sample text, change-request drafts, and a short activity history survive refresh. Mutations require a locally verified wallet-signature session. Sessions are stored in server memory for up to eight hours and are lost when the development server restarts. This proves control of an address but does not assign or check project roles. Route Handlers are disabled in production; this remains a single-machine development adapter, not shared storage or production authentication.

The scope checker is a deterministic rules demo (`rules-demo-v1`) that returns `possible_change`, `likely_in_scope`, or `uncertain`, with excerpts and references to matching scope items. It is not an LLM, and its result cannot change scope or approve a milestone by itself. The wallet connects to devnet, but the UI submits no transactions. There is no shared database, role-based project authorization, deployed program, or escrow.

## Target MVP

```text
Next.js web app
  ├─ Wallet Standard + @solana/kit: connect and sign explicit consent actions
  ├─ API routes: auth, projects, versions, change requests, milestone state
  ├─ Postgres: project data, encrypted/private brief content, activity history
  ├─ AI service: structured extraction + scope comparison + evidence references
  └─ Solana devnet: project/milestone state and content hashes (not private text)
```

### Web app

- Next.js App Router + TypeScript.
- Wallet Standard connection through the official Solana Kit/React template.
- Project workspace UI for scope versioning, review comments, milestone submissions, and approvals.
- Wallet actions happen only after a clear user action with a preview of the transaction.

### Local persistence adapter (implemented)

- `GET /api/project` initializes and returns the seed project.
- `PUT /api/project` validates and atomically replaces the local JSON snapshot.
- `POST /api/auth/challenge` issues a short-lived, one-time sign-in message; `POST /api/auth/verify` checks its wallet signature and sets an HttpOnly session cookie; `GET/DELETE /api/auth/session` reads or clears the session.
- `/api/scope-check` runs the deterministic demo classifier with request excerpts and scope-item evidence.
- Local routes return no-store responses and are disabled in production. Project mutations require a valid session, but the app does not yet associate wallet addresses with client/freelancer roles. Do not use this adapter for multiple users or sensitive customer data.

### Shared API and storage (next)

- Replace the in-memory development session store with production-grade session storage and bind each authenticated wallet to an explicit client/freelancer project role; a public address alone is not proof of authorization.
- PostgreSQL stores project, participants, scope versions, checklist items, change requests, approvals, and an append-only activity record.
- Keep original briefs and client messages private off-chain. Encrypt sensitive fields at rest and define retention/deletion behavior.
- Store every accepted version separately. Never overwrite the source version when creating a change request.

### AI scope assistant

1. Input: approved scope version plus a new message supplied by an authorized project participant. The current rule demo accepts local sample/development data; address sign-in exists, but role checks do not.
2. Extract: requested deliverable, constraints, effort/timing/price claims only when explicitly stated.
3. Compare: return `possible_change`, `likely_in_scope`, or `uncertain` with cited scope items and quoted request evidence. The rule demo currently returns this shape; next, evaluate an LLM against a reviewed sample set before relying on it.
4. Present: show the comparison and let participants decide. For uncertain cases, ask a clarification question instead of raising confidence.
5. Persist: save model/version, evidence references, and human decision for later evaluation.

Never use an LLM result as authorization to change funds, scope, or acceptance state.

### Solana boundary

For the hackathon, use devnet only. A future small Anchor program could track a project PDA, participant roles, the current accepted scope hash, milestone state, and change-request hashes/approval bits. Keep full text, personal details, and private correspondence off-chain. Emit events for state changes. Build and test the state machine before connecting the UI; no funds should be locked in the demo program.

Potential instructions: `create_project`, `propose_scope`, `approve_scope`, `propose_change`, `approve_change`, `submit_milestone`, `accept_milestone`, `request_revision`. Each instruction must validate signer role, expected current version, and legal transition.

## Data model (initial)

- `Project(id, title, client_wallet, freelancer_wallet, status, current_scope_version)`
- `ScopeVersion(project_id, version, structured_scope, content_hash, created_by, approvals)`
- `Milestone(project_id, sequence, title, due_at, status)`
- `Criterion(milestone_id, description, status, evidence_url?)`
- `ChangeRequest(project_id, base_scope_version, proposed_delta, price_delta?, deadline_delta?, status, approvals)`
- `Activity(project_id, actor, event_type, entity_id, created_at, tx_signature?, evidence_refs)`

## Build order

1. Validate the workflow with 5–8 freelancer/client interviews and a clickable prototype.
2. Replace the local JSON adapter with shared project/scope/change-request persistence and bind verified wallet addresses to project participant roles.
3. Evaluate an LLM-backed structured extraction/comparison against a small reviewed dataset; retain the rules demo as a transparent fallback.
4. Add explicit approval transitions and an immutable off-chain activity log.
5. Add a devnet Anchor state machine that stores only hashes and lifecycle state.
6. Record a short end-to-end demo showing the source brief, AI evidence, human approvals, and confirmed devnet state.

## Risks and controls

- **False scope flags:** keep the exact evidence visible, allow dismiss/clarify, measure false positive rate.
- **Prompt injection in client messages:** treat all imported content as data; constrain output schema; no tools or transaction privileges for the model.
- **Wrong party approval:** bind approval to wallet identity and current version hash; reject stale signatures.
- **Privacy leakage:** no briefs or messages in public account data, logs, or emitted events.
- **Escrow/regulatory complexity:** do not add real-value custody until jurisdiction, dispute, refund, and operational requirements have been reviewed.
