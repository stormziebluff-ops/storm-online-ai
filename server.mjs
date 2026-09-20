import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages)
      ? req.body.messages
      : [];

    const clean = messages
      .filter(
        m =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-30);

    if (!clean.length) {
      return res.status(400).json({
        error: "No message supplied."
      });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",

      instructions:
        "You are Storm, a highly capable personal AI assistant. " +
        "Be accurate, helpful, conversational and clear. " +
        "Adapt explanations to the user's level. " +
        "Do not pretend to have performed actions you did not perform. " +
        "When writing code, provide complete runnable code and explain where it goes.",

      input: clean.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    res.json({
      text: response.output_text || "I couldn't generate a response."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error?.message || "AI request failed."
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    storm: "online"
  });
});

app.listen(port, () => {
  console.log(`Storm is running on port ${port}`);
});
