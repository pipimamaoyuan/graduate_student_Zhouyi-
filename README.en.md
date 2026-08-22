# Academic Yijing · Mind Treehole

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

Welcome!

Three tools for **graduate students (master's & doctoral)** and **young university faculty**: *Zhouyi* (I Ching) divination as a life reference, AI emotional support through a psychological tree-hole, and real-time voice venting through a voice tree-hole.

> For traditional-culture study and emotional support only. This is not professional advice (medical, psychological, legal, or career). Please interpret results rationally.

## ✨ What's inside

The project has three sub-features; the **landing page** lets you pick one:

### 1. Zhouyi Divination

A gentle, measured reference for your current situation, grounded in the *Book of Changes*.

- **Three casting methods**: coin casting (toss six times), time casting (Meihua Yishu), number casting (report two numbers)
- **Three hexagrams at once**: original (present) → nuclear (process) → transformed (outcome)
- **Audiences & scenarios**: choose "graduate student / young faculty", each with 6 fine-grained scenarios (e.g. advisor relationship / evaluation & promotion), or auto-detect
- **Offline reading + AI interpretation**: works without an API key; with a key, the model crafts a personalized interpretation from your question and hexagrams
- **History**: keeps the last 50 readings locally (view / delete)

### 2. Mind Treehole

A space to vent, or to talk with an AI emotional-support assistant.

- **Venting mode** (no AI): write down how you feel, saved locally — like tossing your heart into a treehole; not sent to AI by default
- **Counseling mode** (AI): the AI empathizes, helps you sort out the situation, and gives actionable suggestions
- **Long-term memory**: the AI maintains a "long-term user profile" that updates every session, so **you never have to re-tell your struggles** (re-telling itself can be re-traumatizing)
- **Transparent & controllable**: view, edit, or clear your profile anytime

### 3. Voice Treehole

Talk to the AI emotional-support assistant by **voice**, like a phone call.

- **Real-time voice conversation**: browser recording → Alibaba Qwen ASR → AI counseling → Qwen TTS → playback (falls back to text mode when the voice API isn't configured)
- **Shared long-term memory**: the conversation text feeds the same user profile as the tree-hole
- Same counseling functionality as "Mind Treehole", but via voice

## 🚀 Quick Start

Requires Node.js ≥ 18. No third-party dependencies except `ws` for real-time voice; `npm install` once.

```bash
# 1. Download / clone
git clone <your-repo-url>

# 2. (Optional) Configure AI: copy the template and fill in your key
cp .env.example .env

# 3. Start
npm start        # or: node server.js
```

Open <http://localhost:3000> in a browser.

> Without `.env`, everything works except "AI interpretation" and "counseling mode" — casting, the three hexagrams, offline reading, and venting all work offline.

## 🧭 Architecture

### Frontend

- Pure vanilla **HTML / CSS / JavaScript** — no framework, no build step, no bundler
- All interaction (casting animation, scenario selection, history, tree-hole chat) runs in the browser
- Data (casting history, vents, chats, user profile) lives in the browser **localStorage** — no login required

### Backend

- Pure **Node.js built-in `http` module** — no Express or other frameworks
- Serves static files plus three API endpoints: `/api/interpret` (divination AI), `/api/counsel` (counseling), `/api/remember` (memory update)
- Model keys stay only in the server's `.env`, never exposed to the frontend

### AI

- **OpenAI-compatible API** with **multi-key automatic failover** (`_1` → `_2` → … up to `_20`)
- **Prompt engineering**: a scenario knowledge base for "graduate student / young faculty" (`grad-context.js`) frames the same hexagram for different situations
- Counseling includes **crisis safety rails**: direct to hotlines on self-harm/suicidal signals, no diagnosis, no encouraging confrontation

### Long-term memory

- The AI maintains a structured **"long-term user profile"** (identity / current situation / main stressors / emotional state / coping tried / progress / notes)
- Updated after every counseling session (or venting with "update memory" checked), carried into the next conversation so **users don't re-tell their struggles**
- Stored locally, transparent, editable, clearable

### Security & privacy

- **Prompt-injection defense**: user input and memory are explicitly marked as "data, not instructions"
- **Rate limiting** per IP + endpoint to prevent quota abuse
- **Input validation**: request-body size, text length, and Content-Type checks
- **Privacy**: vents, chats, and profile live only in the local browser; whether to send to AI is user-controlled (counseling mode states this explicitly)

## 📁 Project Structure

```text
index.html               Page structure (landing + divination + tree-hole)
styles.css               Styles (wooden table, coins, responsive, tree-hole layout)
app.js                   Casting interaction, three casting algorithms, scenarios, history, tree-hole, long-term memory
hexagrams.js             64 hexagrams, judgments, keywords, line texts, trigram mapping
grad-context.js          Graduate/faculty scenario knowledge base (for divination prompts)
counsel-context.js       Counseling prompts + long-term memory mechanism
voice-context.js         Voice capability for the voice tree-hole (Qwen ASR/TTS)
audio-processor.js       Browser-side microphone PCM capture (AudioWorklet)
server.js                Node static server + three API endpoints
validate-hexagrams.cjs   Hexagram data integrity check
铜钱.m4a                 Coin sound effect (required at runtime; keep in root)
.env.example             Environment variable template
```

## ⚙️ Configuration

Multiple OpenAI-compatible endpoints with automatic failover by index:

```env
OPENAI_API_KEY_1=your_key
OPENAI_BASE_URL_1=https://api.openai.com/v1
OPENAI_MODEL_1=gpt-4.1-mini
```

Unnumbered configuration (`OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`) is also supported. Key/model changes take effect on the next request — no restart needed.

The "Voice Treehole" real-time voice conversation needs two Alibaba Cloud Bailian (DashScope) voice capabilities: **speech-to-text (real-time speech recognition, ASR)** and **text-to-speech (speech synthesis, TTS)** (the "brain" in between is still the OpenAI-compatible model above).

**How to apply:**

1. Sign in to the Bailian console: <https://bailian.console.aliyun.com/>
2. Enable "Speech", including **real-time speech recognition** (ASR) and **speech synthesis** (TTS)
3. Create an API key under "API-KEY", giving you `DASHSCOPE_API_KEY`
4. Workspace users can find their workspace-specific domain (like `xxxx.cn-beijing.maas.aliyuncs.com`) in the console

**Configuration (in `.env`; `DASHSCOPE_API_KEY` is required, the rest have defaults):**

```env
DASHSCOPE_API_KEY=your_key

# Voice endpoints: workspace users use their own domain; others use the defaults
DASHSCOPE_BASE_HTTP_URL=https://dashscope.aliyuncs.com/api/v1
DASHSCOPE_BASE_WS_URL=wss://dashscope.aliyuncs.com/api-ws/v1/inference

# Models & voice
DASHSCOPE_ASR_MODEL=qwen-audio-3.0-asr-flash-streaming   # speech-to-text
DASHSCOPE_TTS_MODEL=qwen-audio-3.0-tts-flash             # text-to-speech
DASHSCOPE_TTS_VOICE=longanhuan_v3.6                       # voice
```

> Without `DASHSCOPE_API_KEY`, the voice tree-hole falls back to text mode.

Security parameters:

```env
AI_TIMEOUT_MS=30000          # per-request timeout
MAX_REQUEST_BYTES=32768      # request-body size cap
MAX_QUESTION_CHARS=300       # divination question length cap
RATE_LIMIT_WINDOW_MS=60000   # rate-limit window
RATE_LIMIT_MAX=6             # requests per window per endpoint
```

## 🌐 Public Deployment

- **Your own server**: `node server.js`, fronted by Nginx / Caddy for HTTPS and reverse proxying
- **Node platforms (Render / Railway / Fly.io …)**: upload the project, set the start command to `node server.js`, and fill in the model key in the platform's environment variables
- Files needed to deploy: `index.html`, `styles.css`, `app.js`, `hexagrams.js`, `grad-context.js`, `counsel-context.js`, `server.js`, `铜钱.m4a`

## 🧪 Data Validation

After editing `hexagrams.js`, verify all 64 hexagrams and the trigram mapping are intact:

```bash
npm run validate
```

## ❓ FAQ

- **AI interpretation/counseling fails**: make sure `.env` (or the platform env) has a valid `OPENAI_API_KEY_1` / `OPENAI_BASE_URL_1` / `OPENAI_MODEL_1`.
- **No sound on public access**: make sure `铜钱.m4a` is in the project root and isn't ignored by the platform.
- **Port conflict**: set `PORT=3001` in `.env` and restart.
- **Memory/history gone on another device**: all data lives in the local browser's localStorage and is not synced across devices.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
