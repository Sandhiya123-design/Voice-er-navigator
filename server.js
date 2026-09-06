const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { generateSpeech } = require("./services/rimeService");
const {
  STATES,
  analyzeEmergency,
} = require("./emergency/emergencyEngine");

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Voice ER Navigator",
    rime: process.env.RIME_API_KEY
      ? "configured"
      : "not configured",
  });
});

// --------------------------------------------------
// RIME TEXT-TO-SPEECH
// --------------------------------------------------

app.post("/api/speak", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Text is required",
      });
    }

    const audioBuffer = await generateSpeech(text);

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", audioBuffer.length);

    res.send(audioBuffer);
  } catch (error) {
    console.error("Rime TTS error:", error);

    res.status(500).json({
      error: "Failed to generate speech",
      details: error.message,
    });
  }
});

// --------------------------------------------------
// EMERGENCY ANALYSIS
// --------------------------------------------------

app.post("/api/emergency/analyze", (req, res) => {
  try {
    const { message, currentState } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const result = analyzeEmergency(
      message,
      currentState || STATES.IDLE
    );

    res.json(result);
  } catch (error) {
    console.error("Emergency engine error:", error);

    res.status(500).json({
      error: "Emergency analysis failed",
      details: error.message,
    });
  }
});

// --------------------------------------------------
// RESET EMERGENCY SESSION
// --------------------------------------------------

app.post("/api/emergency/reset", (req, res) => {
  res.json({
    state: STATES.IDLE,
    priority: "normal",
    response: "Emergency session reset.",
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `Voice ER Navigator backend running on http://localhost:${PORT}`
  );

  console.log(
    `Rime API: ${
      process.env.RIME_API_KEY
        ? "Configured"
        : "NOT CONFIGURED"
    }`
  );
});