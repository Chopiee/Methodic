import express from "express";
import path from "path";

import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API route for AI Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const systemInstruction = `You are Smart Planning, an intelligent AI ERP & Business Assistant built into this enterprise software application.
You have access to the complete real-time application data context (Products, Sales Invoices, Purchase Invoices, Costs/Expenses, Partners/Customers/Distributors, Chart of Accounts, General Ledger, Warehouses, and Document Activity Logs).
Always answer user queries accurately, professionally, concisely, and helpfully in Indonesian (or the language the user speaks in their prompt).
Use clear markdown formatting (bolding, bullet points, headers) and exact figures from the provided context.
When asked about any metric, product, transaction, partner, warehouse, financial standing, or feature, extract and summarize the exact information from the context.`;

      const contents = `[USER QUESTION]: ${prompt}\n\n[LIVE APPLICATION DATA CONTEXT]:\n${context || 'No context provided'}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3
        }
      });

      const responseText = response.text || "Mohon maaf, tidak dapat menghasilkan jawaban saat ini.";
      return res.json({ text: responseText });
    } catch (err: any) {
      console.error("Error in /api/chat:", err);
      return res.status(500).json({ error: err?.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
