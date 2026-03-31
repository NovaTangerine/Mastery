import { auth } from "../firebase";

export interface TagSuggestion {
  tags: string[];
  isGlobal: boolean;
  summary?: string;
}

export async function suggestTags(noteContent: string): Promise<TagSuggestion> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch("/api/tags/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ noteContent }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error suggesting tags:", error);
    // Rethrow if it's a rate limit error so the UI can show a toast
    if (error instanceof Error && error.message.includes("Too many requests")) {
      throw error;
    }
    return { tags: ["General"], isGlobal: false };
  }
}
