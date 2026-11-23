<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project notes

- Read `docs/martine-prototype.md` first (the brief), then `docs/MCP-CONTEXT.md` (what a study and a method are, and what Claude reads of them).
- Same stack and design as the R&R prototype, provided read-only in `reference/rr/` (git-ignored, never modify it). Components are copied from it and adapted, not reinvented. No new UI library.
- Feature-first architecture: each screen lives under `src/features/<feature>/`. `src/app/` route files stay thin and mount the matching view. Shared layout, state and lib live under `src/shared/`.
- All data is mocked (raw JSON in `/data`, read through `src/shared/lib/data.ts`). All AI answers are scripted. State that changes is kept in localStorage (`src/shared/hooks/useMartine.tsx`). This is a clickable prototype, not a technical PoC.
- Studies, phases and tasks are known by stable identifiers (`TR-2611-01`, `TR-2611-01/2.2`, `trend_report@1.2`). Anything that tells Claude about a study goes through `src/shared/lib/martineContext.ts`.
- Interface in English, typographic apostrophes (’). Fictional clients only (Maison Arlette, Lumen Café).
- The whole prototype sits behind an access code: `MARTINE_ACCESS_CODE` (environment variable, never committed), checked in `src/proxy.ts`. With no code set, it stays open in `next dev` and closed everywhere else.
