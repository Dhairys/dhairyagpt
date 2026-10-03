# Dhairya GPT

A personal ChatGPT-style web app: static frontend + one Vercel serverless function that talks to Hugging Face (Qwen 2.5 7B Instruct).

## Structure

```text
dhairya-gpt/
├── api/chat.js     # serverless proxy (keeps HF_TOKEN secret)
├── index.html
├── app.js
├── logo.svg
└── .gitignore
```

## Deploy

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel (no build settings needed).
3. In Vercel → Settings → Environment Variables, add `HF_TOKEN` (your Hugging Face token with Inference Providers access).
4. Redeploy.

Never put the token in any frontend file or commit it to the repo.

AI responses can contain mistakes; verify anything important.
