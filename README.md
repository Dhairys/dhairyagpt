# Dhairya GPT

A personal AI chat web app with a clean, ChatGPT-style interface. It streams answers from open models on Hugging Face and is **live on Vercel at https://dhairyagpt.vercel.app**.

**Live site:** https://dhairyagpt.vercel.app

## Features

- Streaming AI responses
- Stop button to cancel a reply mid-way
- Multiple conversations with local chat history
- Copy and regenerate any response
- Custom instructions
- Dark and light mode
- Collapsible sidebar, mobile-friendly layout
- Starter prompts on the welcome screen
- Terms & Conditions page for Indian law

## Tech stack

- HTML, CSS and vanilla JavaScript (no build step)
- Vercel serverless function (`api/chat.js`)
- Hugging Face Inference Providers (OpenAI-compatible router)

## How it works

```text
Browser (index.html + app.js)
        │  POST /api/chat
        ▼
Vercel serverless function (api/chat.js)
        │  adds HF_TOKEN (kept secret on the server)
        ▼
Hugging Face router → model provider
        │
        ▼
Streamed reply back to the browser
```

## Project structure

```text
dhairyagpt/
├── api/
│   └── chat.js       # secure proxy to Hugging Face (streaming)
├── index.html        # interface and styles
├── app.js            # chat logic, history, settings
├── terms.html        # Terms & Conditions
├── logo.svg
├── .gitignore
└── README.md
```

## Deploy

1. Push this repository to GitHub.
2. Import it in [Vercel](https://vercel.com) and deploy. No build settings are needed.
3. In **Settings → Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `HF_TOKEN` | Your Hugging Face access token (needs Inference Providers permission) |
   | `HF_MODEL` | A chat model served by the router, e.g. `meta-llama/Llama-3.1-8B-Instruct` |

4. Redeploy so the variables take effect.

To pick another model, check the live list at https://router.huggingface.co/v1/models and set `HF_MODEL` to any model ID from it. If `HF_MODEL` is not set, the app falls back to `Qwen/Qwen2.5-7B-Instruct`, which may not currently be served.

## Run locally

```bash
npm install -g vercel
vercel dev
```

Put your token in a local `.env` file (it is git-ignored):

```text
HF_TOKEN=your_token_here
HF_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

## Troubleshooting

| Error | Meaning |
| --- | --- |
| `HF_TOKEN is missing` | Add the variable in Vercel and redeploy |
| `400 ... not supported by any provider` | The model has no provider. Choose another from the models list |
| `401` / `403` | Token is invalid or lacks Inference Providers permission |
| `402` or credits message | Free usage is used up for now |

## Security and privacy

- The Hugging Face token lives only in Vercel environment variables. Never put it in `index.html`, `app.js`, or any committed file.
- Chat history is stored in your own browser (local storage), not on a server.
- Messages are sent to Hugging Face and its providers to generate replies, so avoid sharing sensitive personal data.

See [terms.html](terms.html) for the full Terms & Conditions.

## Disclaimer

Dhairya GPT is a personal project. AI responses can be wrong or biased, so verify anything important.

## Author

Built by Dhairya.
