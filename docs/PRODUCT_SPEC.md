# SenimScope — product brief

## Product

**SenimScope** helps freelance clients and independent workers agree on what a project includes, discuss new requests, and accept work one milestone at a time. It makes project communication easier to verify without asking AI to arbitrate disagreements.

## Primary user and job

- **Primary:** independent designer or developer working with a small-business client.
- **Job:** “When requirements shift during a project, help both of us see what was agreed, discuss the extra work, and keep a clear record of the decision.”

## Core loop

1. Create a project from a plain-language brief.
2. AI proposes milestones, deliverables, exclusions, and acceptance criteria.
3. Both participants edit and approve the initial scope.
4. A new client message can be compared with the approved scope; uncertain matches are shown as suggestions with the relevant evidence.
5. Participants create a change request with description, effort/price/deadline changes, and explicit approvals.
6. The freelancer submits a milestone; the client accepts it or requests changes against the agreed checklist.
7. Decisions and document hashes are recorded for an auditable project history.

## Non-goals for the first demo

- AI decides whether a request is “in scope”.
- AI accepts work, negotiates a price, or resolves a dispute.
- Mainnet payments, fiat settlement, or custody of real customer funds.
- Complex marketplace discovery, ratings, or automated legal advice.

## Prototype scenarios

- Seed project: “Лендинг Senim Studio”, with a fixed milestone and four acceptance criteria.
- Sample client asks to add a separate pricing page; the assistant highlights that it is absent from the fixed scope.
- Freelancer can dismiss the suggestion or save a change-request draft.
- Acceptance control only activates after every criterion is marked complete.

## Product principles

- The approved scope is visible and versioned.
- Each AI suggestion points to the exact request and scope item it compared.
- Both parties control decisions; no silent changes.
- Never imply a payment or on-chain action happened unless its transaction is confirmed.
- Keep sensitive briefs off-chain; use Solana only for consent, event, or document-hash proofs when appropriate.

## Success signals to validate

- Freelancers can explain the difference between original scope and a new request after one use.
- Both sides can find the latest approved scope without searching chat history.
- Participants trust the change-request trail enough to use it on the next project.
- Interview users report fewer unpriced or disputed “small extras”.
