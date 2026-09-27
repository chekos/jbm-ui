<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

This is a reusable React / Remotion component library and shadcn registry with a Next.js gallery. Use pnpm.

- `registry/jbm/` owns published code; `registry.json` owns the inventory and dependencies. `public/r/` is generated: run `pnpm registry:build` after registry edits and commit the output.
- Each item's agent contract (`contracts/items/<name>.ts`) owns its title, description, category, props docs, stage size, examples, and QA notes; follow [the agent contract](docs/agent-contract.md) and run `pnpm contracts:build`.
- Keep `ui/` pure React with inline styles from `lib/tokens.ts`; never import Remotion there. Timeline-dependent code belongs in `motion/`.
- `components/gallery/` owns browser demos. Add a working preview, usage example, and explicit category in `components/gallery/categories.ts` for every new registry item. Categories describe behavior, not source folders or runtime dependencies. Only components that call Remotion hooks need a Player context. Controlled React illustrations use direct controls without video/player chrome; keep client boundaries in the gallery.
- For video composition, follow `docs/scene-spec.md`. Portrait needs deliberate subject sizing and layout, not just a taller canvas. Inspect beginning, middle, and end frames in both orientations; keep safe-area guides out of final renders.
- Follow `docs/surface-depth.md` for raised surfaces; use the shared shadow and border tokens rather than duplicating recipes.
- Preserve the cream, ink, and vermilion palette and Geist font stacks. Check narrow screens and keyboard interaction; motion must not autoplay.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm registry:check`, `pnpm consumer:check`, `node --test scripts/*.test.mjs`, and `pnpm build` before merging (the GitHub `check` workflow runs all of them). For gallery changes, also inspect desktop/mobile previews and exercise filters and playback.
- Track changes with GitHub issues and linked PRs on `codex/` branches. Vercel deploys from GitHub; verify deployment checks before merging and the deployed result afterward. Never commit secrets.

## Illustration acceptance

- Read [the illustration workflow](docs/illustration-workflow.md) before reference-based component work. It captures the reference, composition, physicality, and visual acceptance requirements.
- Audit existing components before implementing a reference: reuse primitives, and expose independent objects separately from composites and transforms.
- Match the reference and existing library with simple geometric line art. Use minimal contours and flat fills; avoid realistic anatomy and incidental scene props.
- Perform adversarial visual QA before delivery: compare against the source image and existing gallery, inspect intermediate states and extremes, check complete hidden object geometry and occlusion, and exercise each control independently on desktop and mobile. Passing builds alone is insufficient.
