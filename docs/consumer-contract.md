# Registry consumer contract

Published components must compile using `fixtures/consumer/tsconfig.json`: `strict`, `noUnusedLocals`, automatic `react-jsx`, `module: Preserve`, Bundler resolution, ES2018 target, and `lib: ["es2015"]`. `allowJs` is deliberately absent. JavaScript helpers must ship declarations. The gallery's more permissive configuration is not the distribution contract.

Run `pnpm registry:build && pnpm consumer:check` to verify both distribution paths:

- Copy `registry/jbm` into a fresh consumer's `src/jbm`, as the explainer scaffold does.
- Serve the generated `public/r` artifacts locally and run the repository-installed shadcn CLI against `@jbm` items. This exercises real installation, file placement, and imports before compiling.

Both paths compile the same minimal video entry with the fixture settings. The fixture imports the explainer's required components and uses configurable code typing. Registry items have explicit `src/jbm` destinations so relative imports survive installation. Existing installs in other folders need migration or reinstalling; custom placement must preserve the directory structure.

Temporary consumers install pinned React, Remotion, and type packages independently of the gallery. They use the repository's locked TypeScript and shadcn executables. Network access is needed for npm dependencies and shadcn metadata. Temporary projects are removed after success or failure.

`registry:check` additionally rejects unpublished source files and stale generated output. The GitHub Actions Registry contract workflow runs these checks, lint, app typechecking, regression tests, and the production build on pull requests and main pushes. A passing local gallery build alone is insufficient.

When a supported consumer tightens compiler settings, update the fixture and keep the checks passing. Do not weaken the fixture to accommodate publisher-only assumptions.
