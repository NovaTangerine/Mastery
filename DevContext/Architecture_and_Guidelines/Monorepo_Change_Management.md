# Monorepo Change Management & Boundary Enforcement
*By: Principal Software Engineer*
*Date: 2026-05-02*

Following up on the decision to adopt a monorepo, a very valid concern is how we ensure that developers (and AI agents like myself) can confidently target changes to specific products without causing unintended cross-product contamination or "spaghetti code."

Here is our strategy to enforce boundaries and target changes safely within a single repository:

## 1. Strict Path-Based Scoping
The most fundamental protection is the folder structure itself. By isolating products into their own independent directories under an `/apps` folder, we create hard physical boundaries.
*   **For humans & AI alike:** When you ask me to "Update the Questlog dashboard," I will specifically scope my file searches and edits to `/apps/questlog-web/`.
*   **The golden rule:** An app should **never** reach into another app's directory. `apps/cartridge-www` cannot import from `apps/questlog-web/src/...`. 

## 2. Enforcing Boundaries via Linting
We won't just rely on the honor system. We will configure our linter (ESLint) to strictly enforce these dependency rules.
*   Using plugins (like `eslint-plugin-boundaries` or native Next/Vite rules), the compiler will immediately throw a fatal error if someone tries to import internal QuestLog business logic directly into the Cartridge marketing site.
*   If both products need the same piece of logic or UI, it *must* be consciously extracted into `/packages/shared-ui/` or `/packages/shared-logic/` first.

## 3. Smart Build Tooling (Turborepo / Nx)
Monorepo orchestrators like Turborepo map out the dependency graph of the entire repository so that builds are surgical, not global.
*   If we push a commit that only modifies files inside `apps/questlog-web`, the build system mathematically knows that `apps/cartridge-www` is unaffected. 
*   It will only run tests, linting, and deployment steps for QuestLog. This prevents a localized typo in Cartridge from breaking the QuestLog deployment.

## 4. Code Ownership (CODEOWNERS)
While a monorepo means everyone can *read* everything, it doesn't mean everyone can *merge* everything. GitHub allows us to use a `CODEOWNERS` file to enforce review boundaries.
*   We can configure `CODEOWNERS` so that any modifications to `apps/questlog-web/**` automatically require review and approval from the QuestLog core developers.
*   Changes to `/packages/shared-ui/**` might require approval from the design systems lead. This prevents unilateral, silent changes to shared infrastructure.

## Summary for Our Day-to-Day Workflow
As we transition to this structure, the process is largely about explicit communication. You'll prompt me with: *"In the Cartridge companion app, update the navigation..."* and I will ensure my `grep` searches, view paths, and edits are strictly localized to that app's directory. Our linting and build tools will act as the safety net to catch any cross-boundary mistakes before they hit production.
