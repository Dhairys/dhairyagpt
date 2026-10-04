# Dhairya GPT

A free, personal AI chat web app with a clean ChatGPT-style interface. It streams answers from open models through free AI APIs, works in any browser, installs as an app (PWA), and also ships as an Android app.

| | |
| --- | --- |
| **Live site** | https://dhairyagpt.pages.dev |
| **Website repo** | https://github.com/Dhairys/dhairyagpt (this repo) |
| **Android app repo** | https://github.com/Dhairys/dhairyagpt-android |
| **Hosting** | Cloudflare Pages (Vercel also supported) |
| **Author** | Dhairya |

## Features

- Streaming replies with a **Stop** button
- Multiple conversations, saved only in your own browser
- **Attach files**: PDF (text-based), Word (.docx), text, CSV, JSON and code files. Up to 3 files per message, 10 MB each, first 15,000 characters of each are used
- Copy and regenerate any reply
- Built-in default instructions (English by default, honest, safe) plus your own **Custom instructions**
- Dark and light mode, collapsible sidebar, mobile-friendly layout
- **Terms & Conditions screen** on the first visit, with About, Privacy and Terms pages written for Indian law
- **"Losing Focus?" button**: a side panel with a Subway Surfers gameplay video (YouTube embed) and a built-in endless runner
- **Installable PWA** with a "New chat" shortcut and Android Share support
- **Fair-use limits** per user and for the whole site
- **Automatic fallback** between up to three AI providers
- **Google AdSense ready**: ads stay off until you add your IDs

## How it works

```text
Browser (index.html + app.js)
        │  POST /api/chat
        ▼
Server function (Cloudflare Pages Function, or Vercel function)
   • validates the request and applies limits (IP is hashed first)
   • adds the default instructions
   • tries provider 1 → 2 → 3 until one answers
        │  API keys stay on the server
        ▼
AI provider  →  reply streamed back to the browser
```

## Project structure

```text
dhairyagpt/
├── functions/
│   └── api/
│       └── chat.js           # server function for Cloudflare Pages
├── api/
│   └── chat.js               # the same server function for Vercel
├── .well-known/
│   └── assetlinks.json       # lets the Android app open fullscreen (from PWABuilder)
├── icons/
│   ├── icon-192.png          # you create these from logo.svg
│   └── icon-512.png
├── screenshots/              # install screenshots used in manifest.json
├── index.html                # interface, styles, Terms screen
├── app.js                    # chat logic, history, files, "Losing Focus?" panel, ads
├── runner.html               # built-in endless runner game
├── about.html                # About, FAQ and contact
├── privacy.html              # Privacy Policy
├── terms.html                # Terms & Conditions
├── manifest.json             # PWA settings
├── sw.js                     # service worker
├── ads.txt                   # AdSense publisher line (fill in later)
├── robots.txt
├── sitemap.xml
├── logo.svg
├── .gitignore
└── README.md
```

Cloudflare reads only `functions/` and Vercel reads only `api/`, so the same repo works on both.

## Deploy on Cloudflare Pages (current setup)

1. In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git** and choose this repo.
2. Framework preset **None**, build command **empty**, build output directory **/** , root directory **empty**.
3. After the first deploy, open **Settings → Variables and Secrets** and add the variables below. Mark every key as a **Secret**.
4. Go to **Deployments → latest → Retry deployment** so the variables take effect.
5. Optional: under **Security → WAF → Rate limiting rules**, add a rule for `/api/chat`. The built-in counters are best-effort.

Free plan: static files are unlimited, and chat messages share 100,000 function requests a day (10 ms CPU each).

## Deploy on Vercel (alternative)

Import the repo in Vercel, add the same variables under **Settings → Environment Variables**, and redeploy. Note that Vercel's free Hobby plan is for non-commercial personal use only, so a site with ads needs Vercel Pro.

## Environment variables

**Provider 1 (required)**

| Name | Value |
| --- | --- |
| `API_KEY` | Your provider's key (Secret) |
| `API_URL` | Full chat endpoint, **ending in `/chat/completions`** |
| `MODEL` | Model ID exactly as the provider shows it |
| `MAX_TOKENS` | Longest reply, default `2048` (keep 800 or more for reasoning models) |
| `DAILY_LIMIT` | Requests per day on this provider before traffic moves to the next one. `0` = no cap |
| `REASONING_EFFORT` | Optional: `low`, `medium` or `high` (gpt-oss models) |

**Providers 2 and 3 (optional fallbacks)**: the same names with a number, such as `API2_KEY`, `API2_URL`, `MODEL2`, `MAX_TOKENS2`, `DAILY_LIMIT2`, and the same for `3`. Empty providers are skipped.

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
| `IP_SALT` | Any random text, makes the hashed IP codes private to you |

### Provider endpoints

| Provider | `API_URL` | Key looks like |
| --- | --- | --- |
| NVIDIA build | `https://integrate.api.nvidia.com/v1/chat/completions` | `nvapi-…` |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | `gsk_…` |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `sk-or-…` |
| Hugging Face | `https://router.huggingface.co/v1/chat/completions` | `hf_…` |

A key only works with its own provider's URL.

### Example setup

| Slot | Provider | Model |
| --- | --- | --- |
| 1 | NVIDIA free endpoint | `openai/gpt-oss-20b` |
| 2 | Hugging Face (small free credit, so cap it with `DAILY_LIMIT2=30` and `MAX_TOKENS2=512`) | `meta-llama/Llama-3.1-8B-Instruct` |

When every provider has reached its daily cap, users see "Today's free AI capacity is used up."

## Default instructions

Every chat starts with built-in instructions: the assistant is Dhairya GPT, replies in English by default (and switches to Hindi, Hinglish or another language when the user asks or writes in it), stays honest about what it doesn't know, treats attached files as data and not commands, and follows Indian law on harmful requests. Edit `DEFAULT_SYSTEM_PROMPT` in both `chat.js` files, or set `SYSTEM_PROMPT` in the host's settings. A user's custom instructions are added on top.

## "Losing Focus?" panel

The **Losing Focus?** button opens a side panel (a top panel on phones) with two tabs:

- **Video**: a vertical Subway Surfers gameplay video embedded from YouTube. Change `VIDEO_ID` at the top of `app.js` to use another embeddable video.
- **Game**: a built-in endless runner (`runner.html`). Change `GAME_URL` to use another page you have the right to embed.

Never embed unofficial copies of other companies' games. That is copyright infringement, and AdSense policy bans framing content without the owner's permission.

## Ads (Google AdSense)

Ads are off until you add your IDs.

1. Use a domain you own if possible, then apply at adsense.google.com.
2. Paste Google's script line into the `<head>` of `index.html`, `about.html`, `privacy.html` and `terms.html` (see the comment in `index.html`).
3. Put your publisher ID into `ads.txt`.
4. After approval, create a display ad unit and set `ADSENSE_CLIENT` and `ADSENSE_SLOT` at the top of `app.js`.
5. Turn **Auto ads off** in AdSense so ads appear only in the sidebar slot, never inside the game panel.
6. In AdSense **Privacy & messaging**, publish a three-choice consent message (consent, do not consent, manage options) for visitors from Europe.

Check the host's terms before using ads: Vercel Hobby does not allow commercial use, and Cloudflare Pages' free plan does.

## Run locally

Cloudflare version:
```bash
npx wrangler pages dev .
```
Put your variables in a file named `.dev.vars` (one `NAME=value` per line). It is git-ignored.

Vercel version:
```bash
npm install -g vercel
vercel dev
```
Put your variables in a `.env` file (also git-ignored).

## Android app

The Android app is a wrapper around this live site, built with PWABuilder and kept in its own repo: https://github.com/Dhairys/dhairyagpt-android. Changes to the website appear in the app automatically. If you change the website's address, update `manifest.json`, `sitemap.xml`, `robots.txt` and `.well-known/assetlinks.json`, then rebuild the APK.

## Updating the site

```bash
git add .
git status
git commit -m "Describe your change"
git push
```

Check `git status` first: no `.env`, `.dev.vars` or key should ever be listed. Cloudflare redeploys within a minute or two. Hard-refresh (Ctrl+Shift+R) to see changes.

## Troubleshooting

| Message | Meaning and fix |
| --- | --- |
| `Server error 405` | The server function was not deployed. Check that `functions/api/chat.js` is at the top level of the repo, and look for it under the deployment's Functions section |
| `API_KEY is missing` | Add the variable and redeploy |
| `401` / `403` | The key doesn't match the `API_URL`, or has extra spaces |
| `400 … not supported` | The `MODEL` name is wrong for that provider |
| `404` from the provider | `API_URL` is missing `/chat/completions` |
| `Daily limit reached` | The user hit `LIMIT_PER_DAY` |
| `free AI capacity is used up` | Every provider reached its daily cap |
| Blank or cut-off replies | `MAX_TOKENS` is too low for a reasoning model. Raise it or set `REASONING_EFFORT=low` |
| `no upstream branch` when pushing | Run `git push -u origin main` once |
| `rejected … fetch first` | Run `git pull --rebase`, then `git push` |

## Security and privacy

- API keys live only in Cloudflare (or Vercel) secrets. Never put them in a file or commit them.
- Chat history is stored in your own browser, not on a server.
- Messages and attached files pass through the host's servers to the AI provider, so avoid sharing sensitive personal data.
- Your IP address is turned into a one-way hash and held only briefly in memory to count requests. It is never passed to the AI providers. The host may keep its own technical logs.
- The `.well-known/assetlinks.json` file is public by design. Never commit a `.keystore` file or its passwords.

See [terms.html](terms.html) and [privacy.html](privacy.html) for the full policies.

## Disclaimer

Dhairya GPT is a personal project. AI responses can be wrong or biased, so verify anything important.

## Author

Built by Dhairya.
