export default async function handler(req, res) {
  // CORS
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
      error: "HF_TOKEN is not configured in Vercel."
    });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "messages must be an array."
      });
    }

    const cleanMessages = messages
      .filter(message =>
        message &&
        ["system", "user", "assistant"].includes(
          message.role
        ) &&
        typeof message.content === "string"
      )
      .slice(-20);

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${process.env.HF_TOKEN}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          model:
            "Qwen/Qwen2.5-7B-Instruct",

          messages: cleanMessages,

          stream: true,

          max_tokens: 1024,

          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      return res.status(response.status).json({
        error:
          `Hugging Face error (${response.status})`,
        details: errorText
      });
    }

    // Forward Hugging Face stream
    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder();

    while (true) {
      const {
        value,
        done
      } = await reader.read();

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
        error:
          error.message ||
          "Server error."
      });
    }

    res.end();
  }
}