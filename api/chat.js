export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST requests only."
    });
  }

  const token = process.env.HF_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "HF_TOKEN is missing in Vercel."
    });
  }

  try {
    const body = req.body || {};

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-7B-Instruct",
          messages: body.messages || [
            {
              role: "user",
              content: "Hello"
            }
          ],
          max_tokens: 256
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "HF_ERROR",
        hf_status: response.status,
        hf_response: result
      });
    }

    return res.status(200).json({
      success: true,
      reply:
        result.choices?.[0]?.message?.content ||
        "Empty response",
      raw: result
    });

  } catch (error) {
    return res.status(500).json({
      error: "SERVER_ERROR",
      details: error.message
    });
  }
}
