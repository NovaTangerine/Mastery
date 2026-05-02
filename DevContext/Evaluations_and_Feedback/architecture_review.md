# Architecture Review - QuestLog & Overall Health
*By: Principal Software Engineer*
*Date: 2026-05-01*

Hey team, 

I've taken some time this week to dive deep into our codebase, specifically looking at the architectural health leading up to our closed alpha. I focused heavily on our `QuestLog` experience (mostly housed in `SessionView`, context hooks, and Firebase layers) as it's the core loop of the product.

Overall, the foundation is solid and there’s a lot working in our favor. However, a few scaling risks and code-hygiene issues have started to pile up simply out of sheer iteration velocity. Here is my breakdown.

## 🟢 What's Working Better Than Expected

* **Drag-and-Drop + Data Integrity:** 
  I was very pleasantly surprised to see `fractional-indexing` used for sorting notes and session items! Relying exclusively on arrays or integers in Firebase for custom sorting usually ends in a race-condition nightmare. Handling `order` fields this way is a fantastic, robust engineering choice. 
* **Optimistic / Abstracted State Layers:**
  The `useNotes` custom hook paired with `GameContext` sets up a great facade pattern. Rather than tying UI components directly to Firebase reads/writes, you've consolidated data fetching (via `onSnapshot` listeners).
* **Virtualization in the Feed:**
  Bringing in `@tanstack/react-virtual` early on was incredibly smart. It proves we’re already thinking about the reality of long-running sessions with hundreds of notes, saving our users' browser memory.
* **Animations and Polish:** The `framer-motion` (via `motion/react`) injections make the UI feel snappy without bogging down the render cycles.

## 🟡 Hiccups & Inefficiencies (The "Tech Debt" to pay down)

* **The God Component (`SessionView.tsx`):**
  Coming in at over 1,200 lines, this file is doing way too much. It handles session routing, inline editing, drag-and-drop contexts, note taking, groups, trackers, and popup menus. 
  * *Pain Point:* Every time this component re-renders (and due to all the primitive `useState` hooks, it’s constantly re-rendering), V8 has to reconcile huge DOM trees.
  * *Action Item:* We need to strictly modularize this before closed alpha. E.g., `SessionSidebar`, `NotesFeed`, `SessionHeader`, etc.
* **Component-Level Menu States:** 
  You're tracking `activeMenuId` and `activeMenuType` globally within `SessionView`. While functional, if this menu logic is needed elsewhere, it’s not reusable. Moving these to small, smart `<DropdownMenu>` components using headless UI or simple prop-based open states would drastically reduce inline clutter.
* **Unnecessary Inline Functions:**
  There's a hefty amount of `onClick={async (e) => { ... }}` inside our jsx returns. Aside from making the file unreadable, this creates new function references on every render, which can defeat `React.memo` (if we plan on adding it).

## 🔴 Red Flags (Immediate Security & Scale Risks)

* **The Pagination Antipattern (Denial of Wallet Risk):** 
  In `useNotes.ts` and `GameContext.tsx`, we handle pagination by simply doing `setNotesLimit(prev => prev + 50)`. 
  While this protects the *initial* load, bumping the limit to 150 means our `onSnapshot` query will now watch 150 documents. If the user edits *one* document, Firebase charges us 1 read... unless we are modifying global lists, which can re-trigger bigger syncs. More importantly, as lists grow, reloading the entire list rather than using `startAfter()` cursor pagination means our network payload and Firebase costs grow *linearly* per user session. For a closed alpha this won’t break us, but past 1,000 active users, it will burn money. 
* **Error Boundaries vs. Context Failures:**
  Because `GameContext` powers nearly the entire app, if a runtime exception hits inside one of those nested map functions (say, an incomplete group document lacking an `id`), the entire layout crashes white. We desperately need `React.ErrorBoundary` wrapping major routes to ensure a single corrupted Draft or Note doesn’t crash the UI.
* **Global Context Re-Renders:**
  Everything listens to `GameContext`. Every time a session is updated, any component hooked into `useGameContext()` might re-render. As we scale, we should investigate breaking `GameContext` via atomic state (like Zustand or Jotai) or splitting contexts (e.g. `GameListContext` vs `ActiveSessionContext`) to isolate updates.

### Next Steps for Closed Alpha

Before we launch to users, let's prioritize isolating the Notes Feed and Sidebar into smaller components, wrapping the core views in standard Error Boundaries, and replacing our `.limit(N + 50)` Firebase queries with standard infinite query cursors.

Great work getting it this far! Let's tighten up and scale.
