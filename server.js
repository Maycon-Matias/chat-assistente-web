const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, model: GEMINI_MODEL });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY nao configurada no arquivo .env"
      });
    }

    const { messages, systemPrompt, maxTokens } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages deve ser um array com itens" });
    }

    const promptPieces = [];
    if (systemPrompt) {
      promptPieces.push(`INSTRUCOES:\n${String(systemPrompt)}`);
    }

    const conversation = messages
      .map((m) => {
        const role = m && m.role === "assistant" ? "BOT" : "USUARIO";
        const content = m && typeof m.content === "string" ? m.content : "";
        return `${role}: ${content}`;
      })
      .join("\n");

    promptPieces.push(`CONVERSA:\n${conversation}`);
    promptPieces.push("Responda como BOT em portugues brasileiro.");
    const finalPrompt = promptPieces.join("\n\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        GEMINI_MODEL
      )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: {
            maxOutputTokens: Number(maxTokens || 1000),
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const err = data && data.error && data.error.message ? data.error.message : "Erro na API Gemini";
      return res.status(response.status).json({ error: err });
    }

    const reply =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
        ? data.candidates[0].content.parts[0].text
        : "";

    if (!reply) {
      return res.status(502).json({ error: "Gemini retornou resposta vazia" });
    }

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erro interno no servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`BotZao API online em http://localhost:${PORT}`);
});
