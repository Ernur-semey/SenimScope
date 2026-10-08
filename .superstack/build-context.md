# SenimScope build context

- **Product:** AI helper for aligning project scope, changes, and milestone acceptance for freelance projects.
- **Users:** independent designers/developers and their small-business clients, starting in Kazakhstan.
- **Hackathon angle:** consumer app + AI assistant + transparent project lifecycle on Solana devnet.
- **MVP loop:** brief → proposed milestones/acceptance criteria → mutual scope approval → message-to-scope suggestion → mutually approved change request → milestone review.
- **AI boundary:** advisory only; show evidence and uncertainty; never decide acceptance or move funds.
- **On-chain boundary:** devnet demonstration only; record state transitions and content hashes, keep private briefs off-chain.
- **Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, official Solana Kit/React and Wallet Standard starter.
- **Brand:** Ivory Linen, warm paper, Inter + JetBrains Mono; minimalist and calm.
- **Current status:** Local development uses ignored JSON persistence and a local wallet-signature session. Production is prepared as a public Vercel demo: it serves a fixed seed project, runs stateless rules-based scope comparison, and keeps UI edits in browser memory only. No external LLM, shared database, project roles, Anchor program, or transaction flow is connected.
- **Next useful milestone:** configure shared persistence and production wallet sessions, bind authenticated wallets to client/freelancer roles, then evaluate an LLM-backed structured comparison with evidence references, then build the devnet state machine.
