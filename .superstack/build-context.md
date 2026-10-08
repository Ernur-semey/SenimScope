# SenimScope build context

- **Product:** AI helper for aligning project scope, changes, and milestone acceptance for freelance projects.
- **Users:** independent designers/developers and their small-business clients, starting in Kazakhstan.
- **Hackathon angle:** consumer app + AI assistant + transparent project lifecycle on Solana devnet.
- **MVP loop:** brief → proposed milestones/acceptance criteria → mutual scope approval → message-to-scope suggestion → mutually approved change request → milestone review.
- **AI boundary:** advisory only; show evidence and uncertainty; never decide acceptance or move funds.
- **On-chain boundary:** devnet demonstration only; record state transitions and content hashes, keep private briefs off-chain.
- **Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, official Solana Kit/React and Wallet Standard starter.
- **Brand:** Ivory Linen, warm paper, Inter + JetBrains Mono; minimalist and calm.
- **Current status:** Local-only Next.js API persists one demo project to an ignored JSON file; mutations require a local wallet-signature session, and a transparent rules-based scope comparison returns a classification and scope references. The session proves control of a wallet address but does not assign project roles. No external LLM, shared database, Anchor program, or transaction flow is connected.
- **Next useful milestone:** replace the JSON adapter with shared persistence and bind authenticated wallets to client/freelancer project roles, then evaluate an LLM-backed structured comparison with evidence references, then build the devnet state machine.
