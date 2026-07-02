# Trackers Architecture: Multi-Dimensional Data Strategy

## Overview
Trackers are evolving from single-metric data points into in-depth, multi-dimensional "treasure troves" of data (e.g., tracking an NPC's lore, quest updates, location, and progress percentage all in one place). This document outlines the architectural plan and backend implications for implementing this safely and efficiently using Firestore and React.

## 1. Document Size & Structure (The 1MB Limit)
* **Concern:** Firestore has a 1MB limit per document. Could an in-depth tracker with lore, quest updates, and stats hit this limit?
* **Analysis:** A typical tracker with several paragraphs of text, booleans, and numbers will only consume a few kilobytes. 1MB is roughly equivalent to a 400-500 page book of raw text, so hitting the limit with standard manual entry is highly unlikely.
* **Resolution:** While a single document *could* hold all this data safely, best practices dictate we split it up to optimize payload size. We will use a **Sub-collection Pattern**. The main tracker document will hold metadata and primary stats, while detailed logs, historical updates, and discrete entries (like individual quest steps) will live in a `trackers/{trackerId}/entries` sub-collection.

## 2. Read Costs & Query Performance (Denormalization)
* **Concern:** Fetching massive, deeply-nested trackers just to display a list in the session view would result in bloated read payloads and higher costs.
* **Resolution (Denormalization):** 
  * The main `trackers` document will store a denormalized **Primary Data Point** (e.g., current progress %, or current location).
  * The Session UI will only query the main `trackers` collection, keeping reads lightweight, cheap, and fast.
  * The full "treasure trove" (the `entries` sub-collection) is lazy-loaded—it is only queried when a user explicitly clicks into that specific tracker's detail view/modal.

## 3. Front-End State Complexity
* **Concern:** Managing deeply nested tracker objects in global React state could cause performance bottlenecks, complex reducer logic, and unnecessary UI re-renders.
* **Resolution:** 
  * Front-end state will mirror the database architecture. The session-level state will only hold the lightweight, denormalized tracker objects.
  * When a user opens a tracker, a separate localized state (e.g., inside a `TrackerDetailModal` component) will fetch and manage the deep sub-collection data. 
  * This keeps the global state flat and prevents the main list UI from re-rendering when a single tracker's deep historical data is modified.

## 4. Indexing and Sorting
* **Concern:** How do we efficiently sort and filter trackers if their data is separated into sub-collections?
* **Resolution:** Because we are purposely denormalizing the *primary* category/metric (as well as `updatedAt` timestamps) onto the main tracker document, we avoid the need for complex cross-collection queries. We can leverage standard Firestore single-field and composite indexes directly on the top-level `trackers` collection to sort by progress, status, or recent activity.
