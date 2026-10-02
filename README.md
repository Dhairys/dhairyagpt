# Dhairya GPT

Dhairya GPT is a personal AI chat application with a clean, ChatGPT-style interface.

## Features

- AI chat
- Streaming responses
- Multiple conversations
- Local chat history
- Dark and light mode
- Custom instructions
- Copy responses
- Regenerate responses
- Responsive design
- Hugging Face AI models
- Cloudflare Worker API backend

## Tech Stack

- HTML
- CSS
- JavaScript
- Vercel
- Cloudflare Workers
- Hugging Face
- Qwen 2.5 7B Instruct

## Architecture

```text
User
  │
  ▼
Vercel
  │
  │
  ▼
Dhairya GPT Frontend
  │
  ▼
Cloudflare Worker
  │
  │ Secure HF_TOKEN
  ▼
Hugging Face
  │
  ▼
Qwen 2.5 7B Instruct
Project Structure
dhairya-gpt/
│
├── index.html
├── app.js
└── README.md
Setup
1. Frontend

Upload the following files to Vercel:

index.html
app.js
README.md
2. Cloudflare Worker

The Cloudflare Worker acts as a secure API proxy between Dhairya GPT and Hugging Face.

The Hugging Face API token is stored as a Cloudflare Worker Secret.

3. Hugging Face Token

The Hugging Face token should be stored in Cloudflare as:

HF_TOKEN

Never place the token inside:

index.html
app.js
README.md
4. Configure the Worker URL

In app.js, configure:

const CONFIG = {
  WORKER_URL: "https://YOUR-WORKER.workers.dev",
  MODEL: "Qwen/Qwen2.5-7B-Instruct",
  MAX_MESSAGES: 20
};

Replace the Worker URL with your actual Cloudflare Worker URL.

Deployment

The frontend is hosted on Vercel.

The API proxy is hosted on Cloudflare Workers.

Hugging Face provides the AI inference.

Security

The Hugging Face API token is never included in the frontend code.

It is stored as a Cloudflare Worker Secret.

Do not commit API keys, tokens, passwords, or other private credentials to the repository.

Disclaimer

Dhairya GPT is a personal AI project.

AI-generated responses can contain mistakes. Important information should be independently verified.

Author

Built by Dhairya.


That's all you need for the README. **No API key or Hugging Face token goes inside it.**