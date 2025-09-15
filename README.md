# Luminet — The Idea Universe for Cofounder Matching

> Turn sparks into startups. Capture ideas, discover like‑minded builders, and form teams fast.

## Why Luminet
- Build faster: Transform raw insights into public or private ideas with one click.
- Find partners: Discover similar thinkers by content and tags; reach out with a friendly intro.
- Ship the MVP: A lean, privacy‑aware flow with production‑oriented RLS policies and a simple inbox.

## Core Features
- Idea capture: Public/private toggle, keywords, mood, quick creation.
- Discovery: Search by content and filter by tags for public ideas.
- Matching: Lightweight similarity (Jaccard over keywords/tokens) with ranked suggestions.
- Say Hi: Custom message composer; requests deliver to an inbox.
- Inbox: Received/Sent views with Accept/Decline/Mark read; unread badge in title.
- Onboarding: First‑time guide (Profile → Spark → Discover) to improve match quality.
- Incubator (optional): Minimal project view to nurture validated ideas.
- Feature flags: Enable capabilities gradually for safe pilots.

## Architecture Overview
- Frontend: React 18 + TypeScript + Vite, shadcn/ui, Tailwind.
- State/Data: TanStack Query for server state, custom hooks for domain logic.
- Backend: Supabase (Postgres, Auth, RLS, Functions optional later).
- Security & Privacy: Row‑Level Security for ideas/embeds; public ideas are cross‑user read‑only.
- Performance: GIN index on `ideas.keywords` for fast tag contains; created_at/visibility indices used by queries.

### Visuals
<p align="center">
  <img src="docs/images/architecture.svg" alt="Luminet Architecture" width="720" />
</p>

<p align="center">
  <img src="docs/images/user-flow.svg" alt="User Flow" width="760" />
</p>

## Quick Start
See README.md for detailed instructions.

## License
Copyright © 2025. All rights reserved.

---
Luminet is where sparks find partners — capture, explore, and launch.
