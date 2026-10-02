# Dhairya GPT

A modern ChatGPT-style AI web application powered by **Hugging Face** and **Qwen 2.5 7B Instruct**.

Dhairya GPT provides a clean conversational interface with streaming AI responses, persistent chat history, custom instructions, and dark/light themes.

## Features

* AI chat with Qwen 2.5 7B Instruct
* Streaming responses
* Persistent chat history using LocalStorage
* Create and delete chats
* Regenerate AI responses
* Copy responses
* Custom instructions
* Dark and light themes
* Responsive interface
* Secure Hugging Face API token handling
* Vercel serverless API
* No API key exposed in frontend code

## Tech Stack

* HTML
* CSS
* JavaScript
* Vercel Serverless Functions
* Hugging Face Router API
* Qwen 2.5 7B Instruct

## Project Structure

```text
dhairya-gpt/
├── index.html
├── app.js
├── logo.svg
├── README.md
├── .gitignore
└── api/
    └── chat.js
```

## How It Works

```text
User
  ↓
Dhairya GPT Web Interface
  ↓
/api/chat
  ↓
Vercel Serverless Function
  ↓
Hugging Face Router
  ↓
Qwen 2.5 7B Instruct
  ↓
Streaming response
  ↓
Dhairya GPT
```

## Setup

### 1. Deploy to Vercel

Import the repository into Vercel and deploy it as a standard Vercel project.

No build command is required for the basic project.

### 2. Add Hugging Face Token

In your Vercel project, open:

**Settings → Environment Variables**

Add:

```text
Name: HF_TOKEN
Value: your_hugging_face_token
```

Redeploy the project after adding the variable.

### 3. Run Locally

You can run the project with Vercel's local development environment:

```bash
npm install -g vercel
vercel dev
```

Then open the local URL shown by Vercel.

## Security

The Hugging Face token is stored as a server-side environment variable.

**Never put the token inside:**

* `index.html`
* `app.js`
* GitHub source code
* `README.md`
* public JavaScript files

The frontend communicates with `/api/chat`, while the serverless function communicates with Hugging Face.

## Model

Dhairya GPT currently uses:

```text
Qwen/Qwen2.5-7B-Instruct
```

The model is accessed through the Hugging Face Router API.

## Customization

You can customize:

* App name
* Logo
* UI design
* Theme
* System instructions
* AI model
* Maximum conversation context
* Response generation settings

## License

This project is intended for personal and educational use. Check the licenses and terms of the third-party services and models used by the project before redistributing it.

---

**Dhairya GPT — Your personal AI workspace.**
