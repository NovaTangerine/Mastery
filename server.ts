import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import admin from "firebase-admin";
import rateLimit from "express-rate-limit";
import fs from "fs";

// Initialize Firebase Admin
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    admin.initializeApp({
      projectId: config.projectId,
    });
  } else {
    admin.initializeApp();
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

let twitchAccessToken: string | null = null;
let twitchTokenExpiry: number = 0;

async function getTwitchAccessToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("Missing Twitch API credentials. Using mock data.");
    return null;
  }

  if (twitchAccessToken && Date.now() < twitchTokenExpiry) {
    return twitchAccessToken;
  }

  try {
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
      method: 'POST'
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Twitch token error response:", errText);
      throw new Error(`Failed to fetch Twitch access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    twitchAccessToken = data.access_token;
    // Expire 5 minutes early to be safe
    twitchTokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return twitchAccessToken;
  } catch (error) {
    console.error("Error getting Twitch token:", error);
    return null;
  }
}

// Mock data for when IGDB is unavailable
const MOCK_GAMES = [
  { id: 1, name: "The Legend of Zelda: Breath of the Wild", cover: { image_id: "co3p2d" }, first_release_date: 1488499200 },
  { id: 2, name: "Elden Ring", cover: { image_id: "co4jni" }, first_release_date: 1645747200 },
  { id: 3, name: "Hollow Knight", cover: { image_id: "co1r7f" }, first_release_date: 1487894400 },
  { id: 4, name: "Outer Wilds", cover: { image_id: "co1q1f" }, first_release_date: 1559001600 },
  { id: 5, name: "Bloodborne", cover: { image_id: "co1r77" }, first_release_date: 1427155200 },
  { id: 6, name: "Disco Elysium", cover: { image_id: "co1syk" }, first_release_date: 1571097600 },
  { id: 7, name: "Hades", cover: { image_id: "co39vc" }, first_release_date: 1600214400 },
  { id: 8, name: "Persona 5 Royal", cover: { image_id: "co1nic" }, first_release_date: 1572480000 },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Rate limiter for the AI endpoint
  // 50 requests per hour per IP (or we can use user ID if we extract it first, but IP is simpler for middleware)
  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 requests per `window` (here, per hour)
    message: { error: "Too many requests from this IP, please try again after an hour" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.0.1", timestamp: "2026-05-08T05:44:00Z" });
  });

  app.post("/api/tags/suggest", aiLimiter, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      
      let uid: string;
      try {
        // Verify the Firebase Auth token and check if it was revoked
        const decodedToken = await admin.auth().verifyIdToken(idToken, true);
        uid = decodedToken.uid;
      } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      const { noteContent } = req.body;
      if (!noteContent || typeof noteContent !== "string") {
        return res.status(400).json({ error: "Bad Request: Missing noteContent" });
      }

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

      // Log API usage to Firestore
      if (response.usageMetadata) {
        try {
          await admin.firestore().collection('api_usage').add({
            uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            promptTokenCount: response.usageMetadata.promptTokenCount || 0,
            candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
            totalTokenCount: response.usageMetadata.totalTokenCount || 0,
          });
        } catch (dbError) {
          console.error("Failed to log API usage to Firestore:", dbError);
        }
      }

      const result = JSON.parse(response.text || '{"tags": [], "isGlobal": false}');
      res.json(result);
    } catch (error) {
      console.error("Error suggesting tags:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/games/search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Bad Request: Missing query" });
      }

      const clientId = process.env.TWITCH_CLIENT_ID;
      const token = await getTwitchAccessToken();

      // Fallback to mock data if no credentials or token fetching failed
      if (!clientId || !token) {
        console.log("Using mock IGDB data for query:", query);
        const lowercaseQuery = query.toLowerCase();
        const results = MOCK_GAMES.filter(game => 
          game.name.toLowerCase().includes(lowercaseQuery)
        );
        return res.json(results);
      }

      const response = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "text/plain",
        },
        body: `search "${query}"; fields name, cover.image_id, first_release_date; limit 10;`
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("IGDB API error:", errText);
        return res.status(500).json({ error: "Failed to fetch games from IGDB" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error searching games:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Bad Request: Missing game ID" });
      }

      const clientId = process.env.TWITCH_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: "Server missing Twitch credentials" });
      }

      const token = await getTwitchAccessToken();

      const response = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "text/plain",
        },
        body: `fields name, cover.image_id, first_release_date, summary, genres.name, platforms.name, screenshots.image_id, involved_companies.company.name, involved_companies.developer, aggregated_rating; where id = ${id};`
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("IGDB API error:", errText);
        return res.status(500).json({ error: "Failed to fetch game details from IGDB" });
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      res.json(data[0]);
    } catch (error) {
      console.error("Error fetching game details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
