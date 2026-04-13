# QuestLog Architectural Review & Future Considerations

As we head toward our closed beta (<100 users), our philosophy is **"optimize for learning, stability, and iteration speed, not infinite scale."**

## 🏗️ Executive Summary
We have chosen a highly pragmatic, modern stack: **React + Vite + Tailwind** on the frontend, backed by an **Express BFF (Backend-for-Frontend)**, with **Firebase** handling auth and data persistence. This is an excellent, high-velocity stack. We are well-positioned for the beta, but there are a few UX and state-management corners we cut for speed that we need to be aware of.

## 💪 Architectural Strengths (What we did right)

1. **The BFF (Backend-for-Frontend) Pattern:**
   By routing our IGDB and Gemini API calls through our own Express `server.ts`, we successfully hid our API keys (Twitch, Gemini) from the client. This is a critical security win. It also allows us to enforce rate-limiting (`express-rate-limit`) before hitting paid/external APIs.
2. **Offline-First Data Layer:**
   Enabling `persistentLocalCache` in our Firestore initialization was a massive win. Users can log their game sessions even if their connection drops, and it will sync when they reconnect. For a journaling app, data loss is the ultimate sin, and this protects us.
3. **Component & Styling Architecture:**
   Tailwind combined with Framer Motion (`motion/react`) gives us a highly polished, "AAA" feel without the overhead of heavy component libraries. The UI is responsive, and the code is highly readable.
4. **Anonymous Auth for Onboarding:**
   Adding the "Demo" anonymous login removes friction. It allows users to experience the "aha!" moment of the app without committing their Google credentials immediately.

## ⚠️ Current Weaknesses (Technical Debt to watch)

1. **Custom State-Based Routing:**
   We are using a custom `UIContext` (`view` state) for navigation instead of a standard router (like `react-router-dom`). 
   * *The Impact:* The browser URL never changes. Users cannot use the browser's native "Back" button, and they cannot bookmark or share a link to a specific game or journal entry. 
   * *Beta Verdict:* Acceptable for a closed beta, but this will be our #1 architectural refactor post-beta.
2. **Global Context Bloat:**
   Our `GameContext` is doing a lot of heavy lifting (fetching games, sessions, drafts, handling imports). As the app grows, any change to this context will cause the entire app to re-render.
   * *Beta Verdict:* Fine for <100 users. Post-beta, we should look into a data-fetching library like React Query or SWR to handle caching and granular re-renders.
3. **In-Memory Server State:**
   Our Twitch IGDB token and our Express Rate Limiter are stored in the Node.js memory. If our hosting provider (Cloud Run) spins up a second server instance to handle traffic, they won't share this memory.
   * *Beta Verdict:* Completely fine for <100 users. We will likely only ever have 1 server instance running at a time during this phase.

## 🚨 Beta Launch Risks (What could bite us next week)

1. **Firestore Security Rules:**
   Because we are using Firebase directly from the client, our Firestore Security Rules are our *only* line of defense. We need to ensure that a user can absolutely only read/write documents where `uid === request.auth.uid`. If our rules are too permissive, one beta tester could accidentally (or maliciously) wipe another tester's journal.
2. **Gemini API Rate Limiting & Costs:**
   We have an IP-based rate limiter set to 50 requests/hour for the AI tagging. However, if multiple beta testers are on the same network (e.g., a college campus or office), they share an IP and might block each other. 
   * *Mitigation:* We are already extracting the Firebase `uid` in that route. We should switch the rate limiter to key off the `uid` rather than the IP address before launch.
3. **IGDB Search Edge Cases:**
   The IGDB search is debounced, but if a user searches for a highly generic term, the API might return unexpected results or timeout. We have basic error handling in the `GameSearchModal`, but we should monitor the server logs closely during the first few days to see what users are actually searching for.

## 🗺️ Principal's Recommendation for the Next 2 Weeks

**Freeze feature development.** 
For a beta of 100 users, the product is feature-rich enough. 
1. Spend an hour auditing the `firestore.rules` file.
2. Playtest the app on a physical mobile device (Safari/Chrome on iOS/Android) to ensure the Framer Motion animations and Tailwind layouts don't cause horizontal scrolling or jank.
3. Launch it.
