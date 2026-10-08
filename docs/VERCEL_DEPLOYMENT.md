# Vercel deployment

## Current deployment mode

SenimScope is prepared for a public, interactive demo deployment. In production mode:

- `GET /api/project` returns the bundled sample project. It never reads or writes `.local-data`.
- `POST /api/scope-check` runs the deterministic rules demo. It does not call an external LLM or persist the submitted message.
- Wallet sign-in, session routes, and project writes remain disabled.
- Checklist, acceptance, and change-request interactions update only the page's in-memory state. A refresh restores the sample project.

The public scope-check route accepts a message and scope items for deterministic comparison. Do not submit private client correspondence or personal data to a public deployment.

## Import the GitHub repository

1. In Vercel, choose **New Project** and import `Ernur-semey/SenimScope`.
2. Keep the repository root as the project root and let Vercel detect **Next.js**.
3. Select Node.js **24.x** in **Settings → Build and Deployment → Node.js Version**.
4. Use the lockfile-based install command `pnpm install --frozen-lockfile` and build command `pnpm build` if Vercel does not fill these automatically.
5. Add no environment variables for the current demo, then deploy.

The repository pins Node.js 24.x and pnpm 11.25.0. Vercel can create production deploys from `main` and preview deploys from other Git branches when Git integration is enabled.

## Before enabling real users or persistent edits

Do not turn the local JSON store into a Vercel write path. Serverless instances do not share a durable writable local project file. Before adding real project data, build and configure:

- a shared database and migrations for projects, scope versions, approvals, and activity;
- persistent session storage and wallet authentication suitable for a public host;
- explicit client/freelancer project roles and authorization checks on every write;
- production cookie settings, same-origin/CSRF protections, and request rate limits;
- privacy, retention, and deletion rules for client briefs and messages.

Only then should the preview be replaced with a multi-user production mode. Store provider credentials in Vercel Environment Variables, not in Git or `NEXT_PUBLIC_*` variables.
