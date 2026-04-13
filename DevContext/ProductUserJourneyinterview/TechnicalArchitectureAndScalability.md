# Technical Architecture + Scalability

That answers the core architectural questions for Phase 1 beautifully. You’re prioritizing a "clean" launch by treating the Cartridge as a historical record rather than a living document that requires constant sync with external APIs.

Before I package the summary, let's look at your question regarding Vector Embeddings. This is where the "AI matching" magic happens.

## Text vs. Metadata: The Embedding Breakdown
Using Answer Text vs. Game Metadata (IGDB data) creates two very different "Social Graphs."

* **Embedding Answer Text (The "Soul"):** This analyzes the *how* and *why*. It captures sentiment, vocabulary, and specific critical themes (e.g., "pacing," "environmental storytelling," "combat flow").
  * *Result:* You find people who think like you, even if they play different games.
* **Embedding Metadata (The "Stats"):** This analyzes the *what*. It looks at genres, developers, and themes from IGDB (e.g., "RPG," "FromSoftware," "Cyberpunk").
  * *Result:* You find people who play what you play.

Can we do both? Absolutely. In fact, for a platform like Cartridge, you should.

**The Hybrid Approach:** You can create a "Joint Embedding" where the vector includes both the text representation and a weighted "category" vector from the metadata. This allows the system to realize: *"This user talks about Soulslikes (metadata) with a focus on level design (text)."*

Incorporating both prevents the "echo chamber" of just seeing people who play the same games, instead surfacing people who share your critical lens across the entire medium.

## 🔵 Stakeholder Summary: Technical Architecture & Data Strategy

### The "Snapshot" Architecture
To ensure system stability and prevent cascading database errors, the Cartridge is treated as an immutable record of a playthrough at a specific moment in time.
* **IGDB Integration:** Cartridges will "hardcode" metadata (Title, Developer, Release Date) from IGDB at the moment of generation.
* **Version Control:** While manual updates and DLC "linking" are supported, the primary Cartridge remains a historical "magazine-style" snapshot.
* **The "Backburner" Loop:** Returning to a previously "Backburnered" game to complete it is recognized as a valid journey but will be treated as a secondary priority for V1 UI/UX.

### AI & Connection Logic
The goal for launch is to prioritize positive discovery—connecting users with content and people they are likely to enjoy.
* **Vector Strategy:** Utilize hybrid embeddings that combine user-generated text (Topics/Reviews) with IGDB metadata.
* **Discovery Priority:** Focus on "Similarity Search" (People you'll like) for Phase 1, with "Challenging/Controversial POVs" reserved for later platform maturity.

### DLC & Content Expansion
* **Standalone DLC:** Treated as individual listings but can be linked back to the "Base Game" Cartridge to show a cohesive journey.
* **Manual Overrides:** Users will have limited ability to manually update or add "Notes" to a generated Cartridge to reflect post-launch updates or continued play.
