import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TagSuggestion {
  tags: string[];
  isGlobal: boolean;
  summary?: string;
}

export async function suggestTags(noteContent: string): Promise<TagSuggestion> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following video game note and suggest 1-3 short tags (e.g., 'Combat', 'Story', 'Upgrade', 'Bug', 'Exploration'). Also determine if this note is a general thought about the game as a whole (isGlobal: true) or a specific moment (isGlobal: false).

Note: "${noteContent}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1-3 short tags describing the note content.",
            },
            isGlobal: {
              type: Type.BOOLEAN,
              description: "True if the note is a general observation about the game as a whole.",
            },
            summary: {
              type: Type.STRING,
              description: "A very brief 1-sentence summary of the note.",
            },
          },
          required: ["tags", "isGlobal"],
        },
      },
    });

    const result = JSON.parse(response.text || '{"tags": [], "isGlobal": false}');
    return result;
  } catch (error) {
    console.error("Error suggesting tags:", error);
    return { tags: ["General"], isGlobal: false };
  }
}
