# Repository Structure Strategy: Cartridge Ecosystem
*By: Principal Software Engineer*
*Date: 2026-05-02*

Hey team,

As we expand the "Cartridge" umbrella beyond just QuestLog into a multi-pronged ecosystem (e.g., companion apps, marketing sites, backend services, maybe a public API), we need to make a foundational decision about our source code management: **Monorepo** (one repository for everything) vs. **Polyrepo** (multiple dedicated repositories). 

This is a one-way door decision that significantly impacts developer experience, deployment pipelines, and how we share code. Here’s a high-level breakdown of the trade-offs to help us chart the right path.

---

## 1. The Monorepo Strategy (Everything in One Place)

All projects (QuestLog web app, Cartridge landing page, shared UI components, shared backend types) live in a single GitHub repository. Tools like Turborepo, Nx, or standard npm/yarn workspaces manage dependencies between the internal projects.

### Pros:
*   **Unified Versioning & Code Sharing:** Sharing code (like a Cartridge-themed UI library, or our Firebase data types) is trivial. You change the TypeScript interface for a "User" in the shared folder, and the compiler instantly tells you if you broke QuestLog or the marketing site.
*   **Atomic Commits:** You can implement a feature that spans the backend, the shared UI, and the QuestLog frontend in a single pull request. This makes rollbacks and git history much easier to understand.
*   **Single Source of Truth:** Onboarding a new engineer is as simple as `git clone cartridge-monorepo`. They have the entire context of the company on their machine.

### Cons:
*   **Tooling Complexity:** As the repo grows, standard Git and npm commands can get slow. You *must* invest in monorepo tooling (like Turborepo) to only build and test the parts of the app that actually changed.
*   **Noisy CI/CD:** Without careful configuration, a typo in the Cartridge marketing site's README might trigger a 20-minute test suite for the QuestLog web app.
*   **Access Control:** Everyone who has read-access to the repository sees everything. If we eventually hire contractors just to build a minigame, they'll be able to see the core QuestLog backend code.

---

## 2. The Polyrepo Strategy (Multiple Repositories)

Each logical boundary gets its own repository: `cartridge-web`, `questlog-app`, `cartridge-shared-ui`, `cartridge-backend`.

### Pros:
*   **Strict Autonomy:** Projects are completely decoupled. The QuestLog team can iterate rapidly without worrying about breaking the Cartridge marketing site. 
*   **Simple CI/CD:** GitHub Actions are inherently scoped to the individual project. Deployments are straightforward and lightweight.
*   **Granular Access:** We can gate access easily. Junior devs or contractors can be given access strictly to the `cartridge-landing-page` repo without ever seeing our core IP.

### Cons:
*   **The Dependency Nightmare:** If you update a shared UI component or a database schema, you have to publish it (e.g., to an internal npm registry or via git submodules), then open PRs in `questlog-app` and `cartridge-web` to bump the version. This drastically slows down cross-cutting feature development.
*   **Fragmented Tooling:** You often end up with drifted configurations. QuestLog might be on React 18 / Vite, while the Cartridge web repo is on Next.js 13, and their ESLint rules no longer match.
*   **Blind Refactoring:** If you delete a function in `cartridge-shared-ui`, you won't know if it breaks `questlog-app` until you publish the package and try to integrate it.

---

## Short-Term vs. Long-Term Implications

### The Short Term (0 - 12 Months)
Right now, our team is small, and our iteration speed is our biggest asset. A **Polyrepo** setup will immediately create friction because we are rapidly changing core data structures (like our Firebase schemas). Having to publish versioned packages just to share the `GameSession` type between Cartridge and QuestLog will feel excruciatingly slow. A **Monorepo** is heavily favored here to maintain velocity and keep the mental model unified.

### The Long Term (1 - 3+ Years)
As Cartridge expands, a Monorepo will require dedicated engineering time just to manage the build system (caching, CI matrices). If we envision Cartridge acquiring other small products or spinning out standalone apps that have completely different tech stacks, a Polyrepo (or a hybrid approach where completely disconnected apps get their own repos) becomes more attractive. 

## My Engineering Recommendation

Given we are a lean team building a heavily integrated ecosystem, **I strongly recommend a Monorepo approach using a tool like Turborepo or npm workspaces.** 

We should create a structure like this:
```text
cartridge-monorepo/
├─ apps/
│  ├─ questlog-web/      (The React SPA we just built)
│  ├─ cartridge-www/     (The marketing / ecosystem hub)
│  └─ api-services/      (If we ever move off pure Firebase serverless)
└─ packages/
   ├─ shared-ui/         (Our Cartridge design system, Tailwind config)
   ├─ shared-types/      (TypeScript interfaces, DB schemas)
   └─ eslint-config/     (Unified code standards)
```

This ensures we don't duplicate our `GameContext` or our UI components, keeps our data models strictly in sync, and allows us to move fast while the product is still finding its shape. Once a specific project (like an isolated mobile client) proves it doesn't need to share code, we can easily eject it into its own repo later.

Let me know what you think about this direction!
