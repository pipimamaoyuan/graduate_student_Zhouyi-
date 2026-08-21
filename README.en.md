# Graduate Yijing Divination · Zhouyi Casting

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

Welcome!

A *Zhouyi* (I Ching / Book of Changes) divination reference for **master's and doctoral (graduate) students**. Cast a hexagram with coins, time, or numbers to obtain the original · nuclear · transformed hexagrams, then receive a gentle, measured interpretation tailored to everyday graduate life — research, advisors, career choices, and mindset (offline plain-language reading + optional AI interpretation).

> For traditional-culture study and emotional support only. This is not professional advice (medical, psychological, legal, or career). Please interpret results rationally.

## ✨ Features

- **Three casting methods**: coin casting (toss six times), time casting (Meihua Yishu), number casting (report two numbers)
- **Three hexagrams at once**: original (present) → nuclear (process) → transformed (outcome)
- **Graduate scenarios**: choose from "research / advisor / career / daily life / relationships / mindset", or auto-detect
- **AI interpretation**: OpenAI-compatible models with multi-key failover; works offline without a key
- **History**: saves the last 50 readings locally (view / delete)
- **Zero dependencies**: vanilla HTML/CSS/JS + Node.js built-ins; no `npm install` needed

## 🚀 Quick Start

Requires Node.js ≥ 18.

```bash
# 1. Download / clone
git clone <your-repo-url>

# 2. (Optional) Configure AI: copy the template and fill in your key
cp .env.example .env

# 3. Start
npm start        # or: node server.js
```

Open <http://localhost:3000> in a browser.

> You can fully use the three casting methods, the original/nuclear/transformed hexagrams, and the offline reading without configuring `.env`; only "AI interpretation" needs a model key.

## 🎯 Three Casting Methods

| Method | Description |
| --- | --- |
| Coin casting | Toss three coins six times, building the hexagram from bottom to top (traditional) |
| Time casting | Derive the trigrams and moving line from the current Gregorian date + Earthly Branch hour (Meihua Yishu) |
| Number casting | Enter two positive integers: the first gives the upper trigram, the second the lower, and their sum the moving line |

## 🧭 Original · Nuclear · Transformed Hexagrams

- **Original hexagram (本卦)**: the present situation
- **Nuclear hexagram (互卦)**: formed from lines 2/3/4 (lower) and 3/4/5 (upper) of the original; reveals the inner dynamics of the process
- **Transformed hexagram (之卦)**: derived from the moving lines; reveals the direction of change

## 🎓 Graduate Scenarios

Pick a scenario next to your question (defaults to "Auto"). Once selected, the backend frames the reading in the language of graduate life:

- **Research**: reframes "success/failure" as "timing and preparation", with concrete, actionable steps
- **Advisor relationship**: integrity, self-protection, rational communication, clear boundaries
- **Career**: offers decision dimensions rather than making the choice for you
- **Daily life / Relationships / Mindset**: light, gentle, stress-relieving

## 📁 Project Structure

```text
index.html               Page structure
styles.css               Styles (wooden table, coins, responsive)
app.js                   Casting interaction, three casting algorithms, scenarios, history
hexagrams.js             64 hexagrams, judgments, keywords, line texts, trigram mapping
grad-context.js          Graduate-scenario knowledge base (injected into the AI prompt)
server.js                Node static server + /api/interpret proxy
validate-hexagrams.cjs   Hexagram data integrity check
铜钱.m4a                 Coin sound effect (required at runtime; keep in root)
.env.example             Environment variable template
```

## ⚙️ Model Configuration

Multiple OpenAI-compatible endpoints with automatic failover by index (`_1` → `_2` → … up to `_20`):

```env
OPENAI_API_KEY_1=your_key
OPENAI_BASE_URL_1=https://api.openai.com/v1
OPENAI_MODEL_1=gpt-4.1-mini
```

Unnumbered configuration (`OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`) is also supported. Changes to keys or models take effect on the next request — no restart needed.

## 🔒 Security

When deploying publicly, keep keys only in the server-side `.env` — never in any front-end file. The backend includes rate limiting, request-body and question-length limits, and prompt-injection protection:

```env
AI_TIMEOUT_MS=30000
MAX_REQUEST_BYTES=32768
MAX_QUESTION_CHARS=300
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=6
```

## 🌐 Public Deployment

- **Your own server**: `node server.js`, fronted by Nginx / Caddy for HTTPS and reverse proxying
- **Node platforms (Render / Railway / Fly.io …)**: upload the project, set the start command to `node server.js`, and fill in the model key in the platform's environment variables
- Only these files are needed to deploy: `index.html`, `styles.css`, `app.js`, `hexagrams.js`, `grad-context.js`, `server.js`, `铜钱.m4a`

## 🧪 Data Validation

After editing `hexagrams.js`, verify that all 64 hexagrams and the trigram mapping are intact:

```bash
npm run validate
```

## ❓ FAQ

- **AI interpretation fails**: make sure `.env` (or the platform env) has a valid `OPENAI_API_KEY_1` / `OPENAI_BASE_URL_1` / `OPENAI_MODEL_1`.
- **No sound on public access**: make sure `铜钱.m4a` is in the project root and isn't ignored by the platform.
- **Port conflict**: set `PORT=3001` in `.env` and restart.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
