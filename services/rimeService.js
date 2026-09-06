async function generateSpeech(text) {
  if (!text) {
    throw new Error("Text is required");
  }

  if (!process.env.RIME_API_KEY) {
    throw new Error("RIME_API_KEY is not configured");
  }

  const response = await fetch(
    "https://users.rime.ai/v1/rime-tts",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.RIME_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "audio/wav",
      },

      body: JSON.stringify({
        text: text,
        speaker: "celeste",
        modelId: "coda",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Rime API error: ${response.status} - ${errorText}`
    );
  }

  const audioBuffer = Buffer.from(
    await response.arrayBuffer()
  );

  return audioBuffer;
}

module.exports = {
  generateSpeech,
};