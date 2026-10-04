# Dhairya GPT

A personal AI chat web app with a clean, ChatGPT-style interface. It streams answers from open models through free AI APIs and is **live on Vercel at https://dhairyagpt.vercel.app**.

**Android app:** https://github.com/Dhairys/dhairyagpt-android

## Features

- Streaming AI responses with a stop button
- Multiple conversations, saved in your own browser
- Attach files (PDF, Word, text, CSV, JSON and code) to ask questions about them
- Copy and regenerate any response
- Custom instructions on top of a built-in default personality
- Dark and light mode, collapsible sidebar, mobile-friendly layout
- Terms & Conditions screen on first visit (Indian law)
- Game mode: a built-in endless runner beside the chat
- Ready for Google AdSense (ads off until you add your IDs)
- Installable as an app (PWA) and packaged as an Android APK
- Per-user and site-wide message limits
- Automatic fallback between up to three AI providers

## Tech stack

- HTML, CSS and vanilla JavaScript, with no build step
- Vercel serverless function (`api/chat.js`)
- Any OpenAI-compatible API: NVIDIA build, Groq, OpenRouter, Hugging Face

## How it works

```text
Browser (index.html + app.js)
        │  POST /api/chat
        ▼
Vercel function (api/chat.js)
   • validates the request
   • applies per-user and site-wide limits
   • adds the default instructions
   • tries provider 1 → 2 → 3 until one answers
        │  API key stays on the server
        ▼
AI provider (streamed reply back to the browser)
```

## Project structure

```text
dhairyagpt/
├── api/
│   └── chat.js             # server function for Vercel (proxy, limits, instructions, fallback)
├── functions/
│   └── api/
│       └── chat.js         # the same server function for Cloudflare Pages
├── .well-known/
│   └── assetlinks.json     # lets the Android app open fullscreen
├── icons/                  # app icons (192 and 512 px PNG)
├── screenshots/            # store/install screenshots
├── index.html              # interface, styles and Terms screen
├── app.js                  # chat logic, history, file attachments
├── runner.html             # built-in Game mode
├── about.html              # About, FAQ and contact
├── privacy.html            # Privacy Policy
├── terms.html              # Terms & Conditions
├── ads.txt, robots.txt, sitemap.xml
├── manifest.json           # PWA settings
├── sw.js                   # service worker
├── logo.svg
├── .gitignore
└── README.md
```

## Deploy

1. Push this repository to GitHub.
2. Import it in [Vercel](https://vercel.com) and deploy. No build settings are needed.
3. In **Settings → Environment Variables**, add the variables below, then **redeploy**.

### Deploy on Cloudflare Pages instead (allows commercial use on the free plan)

The repo works on both hosts: Vercel uses `api/chat.js`, Cloudflare uses `functions/api/chat.js`.

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and pick this repository.
2. Framework preset: **None**. Build command: leave empty. Build output directory: `/` (or leave blank).
3. After the first deploy, open **Settings → Variables and Secrets** and add the same variables listed below (store `API_KEY` and the other keys as **Secrets**), then redeploy.
4. Optional but recommended: in **Security → WAF → Rate limiting rules**, add a rule for `/api/chat` to limit requests per IP. The built-in counters are best-effort only.

Free plan limits: static files are unlimited; function calls (every chat message) share 100,000 requests a day with a 10 ms CPU limit each.

If you change the website address, update it in `manifest.json`, `sitemap.xml`, `robots.txt`, `.well-known/assetlinks.json` and the Android app, and rebuild the APK.

### Environment variables

**Provider 1 (required)**

| Name | Example |
| --- | --- |
| `API_KEY` | Your provider's API key |
| `API_URL` | `https://integrate.api.nvidia.com/v1/chat/completions` |
| `MODEL` | `openai/gpt-oss-20b` |
| `MAX_TOKENS` | Longest reply, default `2048` (keep at 800 or more for reasoning models) |
| `DAILY_LIMIT` | Requests per day on this provider before traffic moves to the next one. `0` means no cap |
| `REASONING_EFFORT` | Optional: `low`, `medium` or `high` (gpt-oss models) |

**Providers 2 and 3 (optional fallbacks)**

Use the same names with a number: `API2_KEY`, `API2_URL`, `MODEL2`, `MAX_TOKENS2`, `DAILY_LIMIT2`, and the same for `3`. Empty providers are skipped.

**Limits (optional)**

| Name | Default | Meaning |
| --- | --- | --- |
| `LIMIT_PER_MINUTE` | `6` | Messages per user per minute |
| `LIMIT_PER_DAY` | `30` | Messages per user per day (resets at midnight IST) |
| `LIMIT_GLOBAL_PER_DAY` | `800` | Messages for the whole site per day |

**Other (optional)**

| Name | Meaning |
| --- | --- |
| `SYSTEM_PROMPT` | Replaces the built-in default instructions |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Makes the limit counters shared and exact |

### Provider URLs

| Provider | `API_URL` |
| --- | --- |
| NVIDIA | `https://integrate.api.nvidia.com/v1/chat/completions` |
| Groq | `https://api.groq.com/openai/v1/chat/completions` |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` |
| Hugging Face | `https://router.huggingface.co/v1/chat/completions` |

A key only works with its own provider's URL.

## Default instructions

Every chat starts with built-in instructions: the assistant is Dhairya GPT, replies in English by default (and switches to Hindi, Hinglish or another language when the user asks or writes in it), stays honest about what it doesn't know, treats attached files as data and not commands, and follows Indian law on harmful requests. Edit `DEFAULT_SYSTEM_PROMPT` in `api/chat.js`, or set `SYSTEM_PROMPT` in Vercel. A user's own custom instructions are added on top.

## Game mode

The **Game mode** button opens a side panel (top panel on phones) with two tabs: **Video** (a Subway Surfers gameplay video embedded from YouTube) and **Game** (a built-in endless runner, `runner.html`). To change the video, set `VIDEO_ID` at the top of `app.js` to any embeddable YouTube video ID; to change the game, set `GAME_URL`. Don't embed unofficial copies of other companies' games: that is copyright infringement, and Google AdSense policy bans framing content without the owner's permission.

## Ads (Google AdSense)

Ads are off until you add your IDs.

1. Own a domain (a custom domain is recommended for approval), add it in Vercel, and apply at adsense.google.com.
2. Paste Google's script line into the `<head>` of `index.html`, `about.html`, `privacy.html` and `terms.html` (see the comment in `index.html`).
3. Edit `ads.txt` with your publisher ID.
4. After approval, create a display ad unit, then set `ADSENSE_CLIENT` and `ADSENSE_SLOT` at the top of `app.js`.
5. In AdSense, turn Auto ads off so ads only appear in the sidebar slot, and never inside the game frame.

Required pages already included: `about.html` (with contact details), `privacy.html` and `terms.html`, plus `robots.txt` and `sitemap.xml`.

## Run locally

```bash
npm install -g vercel
vercel dev
```

Put your variables in a local `.env` file (it is git-ignored).

## Android app

The Android app is a wrapper around the live site, built with [PWABuilder](https://www.pwabuilder.com) and kept in a separate repository. Website changes appear in the app automatically. For the app to open fullscreen, host `.well-known/assetlinks.json` here (it is public by design).

## Troubleshooting

| Message | Meaning |
| --- | --- |
| `API_KEY is missing` | Add the variable in Vercel and redeploy |
| `401` / `403` | The key doesn't match the `API_URL`, or has extra spaces |
| `400 … not supported` | The `MODEL` name is wrong for that provider |
| `Daily limit reached` | The user hit `LIMIT_PER_DAY` |
| `free AI capacity is used up` | All providers reached their daily caps |

## Security and privacy

- API keys live only in Vercel environment variables. Never put them in any file or commit them.
- Chat history is stored in your own browser, not on a server.
- Messages and attached files are sent to the AI provider to generate replies, so avoid sharing sensitive personal data.
- Your IP address is used temporarily to count requests for the limits.

See [terms.html](terms.html) for the full Terms & Conditions.

## Disclaimer

Dhairya GPT is a personal project. AI responses can be wrong or biased, so verify anything important.

## Author

Built by Dhairya.
