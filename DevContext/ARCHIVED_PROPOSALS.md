# Archived Architectural Proposals

## Basic Profile Page (2026-03-30)

**1. Strategic Alignment**
While full public profiles are technically "Phase 3" in our roadmap, building a *foundational* private profile now is essential for "Phase 1: The Single-Player Core." The user needs a home base to view their identity and access their logs. We will build this with future multiplayer scalability in mind, but focus purely on the single-player utility for now.

**2. Proposed Data Model (`User`)**
To support this UI, we need to establish the basic User schema:
```json
{
  "uid": "usr_123",
  "username": "gamer_tag",
  "displayName": "John Doe",
  "bio": "RPG enthusiast and completionist.",
  "avatarUrl": "https://...",
  "joinDate": "2026-03-30T00:00:00Z"
}
```

**3. UI/UX Layout & Components**
*   **Navigation:** A global navigation bar/layout to move back and forth between the QuestLog (Home/Feed) and the User Profile.
*   **Profile Header:** Avatar, Display Name, @username, and a short bio.
*   **Action Bar:** A primary Call-to-Action (CTA) to "Log a Game" and a secondary "Edit Profile" button.
*   **Tabbed Navigation (Future-Proofing):** We will use a tabbed layout. Right now, it will only have a "Logs" tab, but this perfectly sets up the architecture to add "Reviews," "Cards," and "Top 10 Lists" later.
*   **Logs Feed:** A list of the user's recent logs. 
    *   *Guideline Adherence:* Per the "Anti-Firehose" rule, this feed will be designed with pagination/limits in mind from day one.
    *   *Guideline Adherence:* Per the "Empty States" rule, we will design a beautiful empty state for when the user has zero logs, prompting them to start their journey.

**4. Tech Stack & Styling**
*   React (Vite) for the frontend.
*   React Router for navigation between QuestLog and Profile.
*   Tailwind CSS using the `zinc` dark-mode aesthetic (as mandated in the guidelines).
*   `lucide-react` for consistent iconography.
*   Mock data (based on our `LOG_SCHEMA_GUIDELINES.md`) to build the UI rapidly before wiring up a real database.

**5. Development Plan**
1.  Initialize the basic routing structure.
2.  Create the mock data for the User and a few sample Logs.
3.  Build the global Layout with navigation.
4.  Build the `ProfileHeader` and Tab navigation.
5.  Build the `LogFeed` (including the `LogCard` component and the Empty State).
6.  Apply Tailwind styling and ensure mobile responsiveness.
