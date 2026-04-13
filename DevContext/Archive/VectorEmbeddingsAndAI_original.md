# AI Strategy: Vector Embeddings vs. Generative AI

This document outlines the "Split Brain" approach to AI for the QuestLog platform, balancing the need for advanced social features with the realities of cost, latency, and scalability.

## 1. The Core Problem
The vision for QuestLog includes connecting users based on deep, semantic similarities (e.g., matching two users who both loved the *music* in *Persona 5*, even if they didn't use the exact same words). 

If we use a Generative LLM (like GPT-4 or Gemini Pro) to read every single post and try to match them, the platform will go bankrupt in a week, and the social feed will take 10 seconds to load.

## 2. The Solution: Vector Embeddings
**What are they?** 
Instead of asking an AI to *read and understand* text on the fly, we use a much cheaper, faster model (like `text-embedding-3-small`) to convert text into a **Vector**—a long list of numbers (e.g., `[0.012, -0.045, 0.892...]`). 

This list of numbers represents the "semantic meaning" of the text. 

**How we use it:**
1. User writes a post: *"The soundtrack during the final boss of P5 was incredible."*
2. We send this text to an Embedding API.
3. The API returns a Vector. We save this Vector in our database next to the post.
4. When we want to build a "For You" feed, we don't read the text. We just ask the database: *"Find me other vectors that are mathematically close to this vector."*

**The Benefits:**
* **Cost:** Embeddings are fractions of a cent per 1,000 tokens. Generative AI is significantly more expensive.
* **Latency:** Comparing vectors in a database takes milliseconds. Generating text takes seconds.
* **Scalability:** Vector search scales beautifully to millions of records.

## 3. The "Split Brain" Strategy
We will divide our AI usage into two distinct categories:

### A. The Subconscious (Vector Embeddings)
* **Use Case:** Background tasks, matchmaking, social feed aggregation, finding similar topics.
* **Execution:** Happens silently when a user saves a log or post. 
* **Tech:** OpenAI Embeddings API (or similar) + a Vector Database (like Pinecone, Weaviate, or `pgvector` in Postgres).

### B. The Conscious (Generative AI)
* **Use Case:** High-value, explicit user actions. Summarizing a 20-hour journal into a 3-paragraph review. Generating custom prompts based on past logs.
* **Execution:** Triggered by a specific button press by the user (e.g., "Generate Review Draft"). The user expects to wait a few seconds.
* **Tech:** Gemini Pro or GPT-4o.

## 4. Infrastructure Implications
Because we are starting with Firebase (NoSQL) for Phase 1, we do not have native Vector Search capabilities. 

**The Roadmap:**
* **Phase 1 (MVP):** We don't need embeddings yet. We focus on single-player utility.
* **Phase 2 (Early Social):** We can use a third-party service like **Pinecone** alongside Firebase. When a post is saved to Firebase, a Cloud Function generates the embedding and saves it to Pinecone with the `post_id`.
* **Phase 3 (Scale):** When we migrate to PostgreSQL, we will use the **`pgvector`** extension. This allows us to store the text and the vector in the exact same database row, drastically simplifying the architecture.
