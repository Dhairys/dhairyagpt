export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST requests only." });
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "HF_TOKEN is missing in Vercel." });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages." });
  }

  try {
    const upstream = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-7B-Instruct",
          messages,
          max_tokens: 1024,
          temperature: 0.7,
          stream: true
        })
      }
    );

    if (!upstream.ok) {
      const details = await upstream.text();
      return res.status(upstream.status).json({
        error: "Hugging Face error",
        details
      });
    }

    // Stream the SSE response straight through to the browser
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of upstream.body) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ error: "Server error", details: error.message });
    }
    res.end();
  }
}
