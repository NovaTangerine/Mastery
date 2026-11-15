# Capsule — prototype brief

This repo started as **Mastery**, a detailed game-journaling tool (sessions, notes, trackers). We are rebooting it as **Capsule**: a Letterboxd-style place to keep the games that made you, say what you thought of them, and share it as one link. Work on the `capsule-prototype` branch. Build the new experience alongside the old screens; don't delete Mastery code unless asked.

Low-fidelity wireframes for every screen live in `docs/capsule/screens/` as plain HTML (open them in a browser, or read the markup for layout, copy and spacing). The same screens exist in Paper ("Capsule — Lo-fi Set") and Figma, but the HTML here is the source of truth for this prototype.

## What already exists and should be reused

- **Google sign-in**: `src/firebase.ts` (`googleProvider`, `signInWithPopup`) and `src/contexts/AuthContext.tsx`.
- **Game search**: `POST /api/games/search` and `GET /api/games/:id` in `server.ts` (IGDB via Twitch credentials, falls back to `MOCK_GAMES` when there are none, so it works offline).
- **Tag suggestions**: `POST /api/tags/suggest` in `server.ts` (Gemini). Use it for "tags we're picking up" while the user writes.
- **Stack**: React 19, Vite, Tailwind v4, `motion` (Framer Motion), `react-router-dom`, `lucide-react`, Firebase/Firestore. Run with `npm run dev`; type-check with `npm run lint`.

## Product decisions (settled; don't re-litigate)

- **Web first**, mobile soon. Build responsive, but desktop is the reference.
- **A capsule** = one game's review card. **Your Capsule** = your profile page, which is also Home at launch.
- **Profile** shows bio, social links, stats, a manually set **Top 5**, and a **showcase** of 10/16/25 games (user setting). Everything beyond lives in **All games**.
- **Headline game** on the profile is auto-picked from recent activity, and the user can pin over it.
- **Rating is optional on every capsule.** Each user picks a **main scale** (Stars 1–5, 1–10, %, or "no scores, just words") at sign-up; they can also fill in other scales on any capsule.
- **Unrated capsules** use a **headline** (one-line verdict, shown big where a score would sit) plus an optional **verdict stamp** ("Flawed gem", "Comfort food", custom), and get a longer text limit. Rated and unrated look the same on the shelf.
- **Statuses**: Finished, Dropped, All-time favorite. Finishing auto-adds the game to your Capsule. Dropped capsules stay on your profile but will be left out of future discovery.
- **Extras** (all optional): highs and lows as separate draggable items, each with text and an icon; favorite moment (text + screenshot); tags (suggested + custom).
- **The reveal** after writing is the emotional high point: quiet and cinematic, not confetti. Letterbox bars, the card fades up, the words set line by line, icons settle, then actions fade in. Sound is undecided.
- **The collectible** (how a capsule looks as an object) will be a card or cartridge. Keep it a placeholder for now.
- **Social at launch**: likes only; follow plus mutual friends. Sharing is a link to a public capsule page, plus downloadable story/post images later. Treat comments, feeds and discovery as future work.
- **Edit after the reveal** is allowed, and the reveal can be replayed.

## Flows to build (in this order)

1. **First-time user** (`02-first-time-user.html`, screens S1–S6): landing with **Continue with Google** → Google popup → **Claim your Capsule** (photo and name prefilled from Google, handle `capsule.gg/<handle>`, pick a rating scale) → **Start your Capsule** (two doors: review a game I just finished, or build a Top 3/5/10) → **Fill your Top 5** (no ratings needed) → **"Your Capsule is live"** → profile.
2. **Review a game** (`03-review-flow.html`, screens R1–R6): stepped flow Game → Words → Score → Extras, with "Saved" autosave and a close button. Words is the only required step. Score uses the user's scale with a word label for each value ("4 out of 5 — Really good"), or goes down the no-score path (R3b). Extras, then **Reveal** (R5 storyboard), then **After the reveal** (R6: Share, Copy link, View my Capsule, Edit, Replay reveal). A first-ever capsule gets a "your first one!" moment.
3. **Profile and the rest** (`01-lofi-set.html`): Capsule page (A1 vs A2 is undecided; build A1 and make swapping easy), All games (B), public capsule page that a shared link opens (F, with "Make your own Capsule"), Share modal (G), Settings (H). Mobile references are M1–M3.

## Suggested build passes

1. Routes and gray-box screens for every flow, using mock data, matching the wireframes.
2. Real Google sign-in, the claim-your-Capsule step (unique handle), and saving the rating-scale choice to the user profile.
3. Review flow saving to Firestore, including the no-score path and extras.
4. The reveal with `motion`. Tune timing (about 3 seconds); this is the moment that matters most.
5. Capsule page (A1), public capsule page (F) and share link.

## Data sketch (adjust as needed)

- `users/{uid}`: displayName, photoURL, handle (unique), bio, socialLinks[], ratingScale (`stars|ten|percent|none`), showcaseSize, top5[] (gameIds), headlineGameId?, headlinePinned.
- `capsules/{id}`: uid, gameId, gameTitle, coverUrl, status (`finished|dropped|favorite`), text, rating? ({ stars?, ten?, percent? }), headline?, verdict?, highs[] / lows[] ({ text, icon, order }), favoriteMoment? ({ text, screenshotUrl? }), tags[], createdAt, updatedAt, likeCount.

## Style for now

Low fidelity on purpose: grayscale, Inter, placeholders for covers and the collectible. Visual direction comes later, so put effort into structure, flow and motion timing, not polish.
