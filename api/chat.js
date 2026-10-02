export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://dhairya-gpt.vercel.app"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST requests only."
    });
  }

  if (!process.env.HF_TOKEN) {
    return res.status(500).json({
      error: "HF_TOKEN is missing in Vercel."
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "messages must be an array."
      });
    }

    const cleanMessages = messages
      .filter(
        m =>
          m &&
          ["system", "user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
      )
      .slice(-20);

    const hfResponse = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-7B-Instruct",
          messages: cleanMessages,
          max_tokens: 1024,
          temperature: 0.7,
          stream: true
        })
      }
    );

    if (!hfResponse.ok) {
      const details = await hfResponse.text();

      return res.status(hfResponse.status).json({
        error: `Hugging Face error ${hfResponse.status}`,
        details
      });
    }

    res.setHeader(
      "Content-Type",
      "text/event-stream; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    const reader = hfResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      res.write(
        decoder.decode(value, {
          stream: true
        })
      );
    }

    res.end();

  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Server error",
        details: error.message
      });
    }

    res.end();
  }
}
