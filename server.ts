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
    res.json({ status: "ok" });
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
