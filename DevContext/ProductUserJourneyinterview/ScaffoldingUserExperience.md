# The User Experience of "Scaffolding"

The "social journaling" angle is a brilliant way to solve the isolation of single-player games. By treating the journal not just as a private diary, but as a "signpost" in a shared world (like Dark Souls or Persona), you're turning a solitary act of documentation into a collaborative act of discovery. The idea of "triangulating" a user's position in a game to prevent spoilers or suggest topics is technically ambitious but aligns perfectly with your goal of scaffolded engagement.

As for the "discourse tracker"—it's not as pie-in-the-sky as you might think. While building a real-time scraper is a massive undertaking, using an LLM to analyze "Current Sentiment" for a specific game ID once a week could give your Topic prompts that "in the know" feeling without the technical overhead of a live engine.

## 🟡 Stakeholder Summary: UX Scaffolding & Content Hierarchy

### The Scaffolding Strategy: Evolution over Automation
The platform will not force users into a rigid review-writing funnel at launch. Instead, it will leverage existing user activity to inspire deeper reflection.
* **V1 Approach:** Draw from a user's existing journals, posts, and topics to prompt for "further thoughts."
* **Long-term Vision:** Integrate game-specific metadata and "discourse tracking" to provide contextually relevant prompts (e.g., "The internet is talking about the difficulty spike in Boss X; how did you handle it?").

### The Journal as a "Social Anchor"
Journaling is repositioned from a "chore" to a "connected experience," drawing inspiration from asynchronous social mechanics in games like Dark Souls and Persona.
* **Intrinsic Motivation:** Enthusiasts are already journaling on ill-suited platforms; Cartridge provides a dedicated "base-of-operations."
* **Progress Triangulation:** Future iterations could analyze journal notes to determine a user's progress and offer:
  * *Contextual Topics:* Prompts about content the user has just experienced.
  * *Hint/Warning System:* Alerts about obscure or missable content based on community data.

### Content Weighting & Feed Logic
To ensure the platform remains a space for "meaningful conversation," the feed will prioritize quality over quantity.

| Content Type | Priority | Purpose |
| :--- | :--- | :--- |
| **Reviews** | Highest | The ultimate expression of critical engagement. |
| **Topics** | High | Generates unique POVs and interesting community discourse. |
| **Cartridges** | Medium | High-fidelity, shareable visual summaries ("The Trophy"). |
| **Posts** | Low | Low-effort brand-building and "Twitter-like" personality. |

### Spoiler Governance
The spoiler architecture is designed to be suggestive, not restrictive.
* **Inheritance:** Cartridges will respect spoiler tags from source content (Journals/Posts) by default.
* **User Agency:** Users maintain "Creative Director" rights over their Cartridges, allowing them to toggle spoiler markings or edit text specifically for the generated "Postcard."

## 🏁 Final Alignment: The Journal-to-Feed Pipeline

### Privacy & Promotion Logic
The journal serves as a user's private workshop. While the act of playing is celebrated, the "work" of documenting it remains personal until the user decides it has social value.
* **Private by Default:** Journal entries and session notes are hidden from the social feed to prevent clutter and encourage honest, unpolished reflection.
* **The "Promotion" Mechanic:** Users have the agency to "promote" specific, high-value journal entries directly to their feed as Posts.
* **Scaffolding Integration:** These promoted entries can later serve as the foundation for Topics, Reviews, or the final Cartridge snapshot.

### Summary of Content Visibility
* **Journals:** Private (unless promoted)
* **Posts:** Public Feed
* **Topics:** Public Feed / Game Pages
* **Reviews:** Public Feed / Game Pages
* **Cartridges:** Public Feed / External Socials
