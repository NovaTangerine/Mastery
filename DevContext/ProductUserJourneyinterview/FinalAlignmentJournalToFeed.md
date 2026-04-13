# Final Alignment: The Journal-to-Feed Pipeline

### Privacy & Promotion Logic

The journal serves as a user's private workshop. While the act of playing is celebrated, the "work" of documenting it remains personal until the user decides it has social value.

- **Private by Default:** Journal entries and session notes are hidden from the social feed to prevent clutter and encourage honest, unpolished reflection.
- **The "Promotion" Mechanic:** Users have the agency to "promote" specific, high-value journal entries directly to their feed as **Posts**.
- **Scaffolding Integration:** These promoted entries can later serve as the foundation for **Topics**, **Reviews**, or the final **Cartridge** snapshot.

### Summary of Content Visibility

| **Content Type** | **Default Visibility** | **Social Feed Weight** | **Purpose** |
| --- | --- | --- | --- |
| **Journal / Notes** | **Private** | N/A (Hidden) | Intrinsic tracking & raw data collection. |
| **Promoted Note** | **Public** | Low (as a 'Post') | Sharing "in-the-moment" highlights. |
| **Review** | **Public** | **Highest** | Definitive critical perspective. |
| **Cartridge** | **Public** | **Medium/High** | The viral, shareable "trophy" of the journey. |

### Technical & Strategic Synthesis

We now have a comprehensive view of the **Cartridge** ecosystem:

1. **Philosophy:** Anti-backlog, celebration-focused, and "Social Journaling" (the *Dark Souls* signpost model).
2. **Architecture:** Hardcoded IGDB snapshots for immutability and hybrid Vector Embeddings (Text + Metadata) for discovery.
3. **UX Loop:** A transition from low-friction "Currently Playing" states to high-effort "Review" generation via a scaffold of private journals and public topics.

> "The goal is to help people engage with video games critically and help them create meaningful conversations."
