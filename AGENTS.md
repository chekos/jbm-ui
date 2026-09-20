<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project

This is a reusable React / Remotion component library and shadcn registry with a Next.js gallery. Use pnpm.

- `registry/jbm/` owns published code; `registry.json` owns the inventory and dependencies. `public/r/` is generated: run `pnpm registry:build` after registry edits and commit the output.
- Keep `ui/` pure React with inline styles from `lib/tokens.ts`; never import Remotion there. Timeline-dependent code belongs in `motion/`.
- `components/gallery/` owns browser demos. Add a working preview, usage example, and explicit category in `components/gallery/categories.ts` for every new registry item. Categories describe behavior, not source folders or runtime dependencies. Motion demos need a Remotion Player context; keep client boundaries in the gallery.
- Follow `docs/surface-depth.md` for raised surfaces; use the shared shadow and border tokens rather than duplicating recipes.
- Preserve the cream, ink, and vermilion palette and Geist font stacks. Check narrow screens and keyboard interaction; motion must not autoplay.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm registry:check`, and `pnpm build` before merging. For gallery changes, also inspect desktop/mobile previews and exercise filters and playback.
- Track changes with GitHub issues and linked PRs on `codex/` branches. Vercel deploys from GitHub; verify deployment checks before merging and the deployed result afterward. Never commit secrets.
