# FlashTrack — AI Learning Platform

FlashTrack helps you learn with AI study cards. Search a topic, flip the card, hear the word, save it, quiz yourself, or play a short game. English and Spanish. For learners 15 and older.

**Voice is the last planned feature on this web app.** Her name is Nova. Tap the mic in the corner and talk to her. Want to know what to say? Tap **What can I say?** right next to the mic. She opens the page. She does not tap buttons for you. Works in Chrome.

Live site: https://flashtrack-ai-learning-platform.vercel.app

Project video: https://www.loom.com/share/f26ab3845b6343eaa4e1c6ee966c2527

> The public site is live (frontend on Vercel, API on Render). The first visit after Render has been idle can take about 30 seconds. Do not share your OpenAI API key — testers who run locally use their own key in `backend/.env`.

## How it's built

This is a full-stack app in one repository:

| Part | Where | Stack |
|---|---|---|
| Frontend | repo root (`src/`) | React 19, React Router 7, Vite |
| Backend | `backend/` | Node, Express 5, Mongoose 9 (MongoDB), JSON Web Tokens, OpenAI API |

The browser only ever talks to the backend. The backend is the only thing that holds the OpenAI key and the database connection.

```
Browser (React)  --HTTP/JSON-->  Express API  -->  MongoDB
                                      |
                                      +-->  OpenAI (study cards, quizzes)
```

## Features

- **Search** a topic and get an AI study card (simple definition, beginner explanation, technical definition, analogy, code example where it fits, common mistake)
- **Flip cards** — term on the front; learning sections on the back (collapsible, respects Settings)
- **Hear it** — browser text-to-speech for the term and open sections
- **Nova (Voice)** — tap the corner mic and say where to go, or search a topic. Phrase list: **What can I say?** next to the mic (Chrome)
- **English and Spanish** — whole app plus new cards; pick at signup or in Settings
- **Accounts** with signup and login (15+ checkbox, bcrypt passwords, JWT that expires in 7 days)
- **Saved topics** stored in MongoDB per user
- **Regenerate** a saved card at a different difficulty
- **Quizzes by topic** — after **5+** real saved cards, a quiz for one flashcard
- **Review quiz** — mixed quiz across recent cards (up to 10); missed topics unlock focused practice
- **Games** — after **4+** real saved cards: Match, Spot the mistake, Hear & pick. No timer
- **Learner profile** (Settings): explanation style, question type, pacing, language, which card sections open by default
- **Subjects** browsing (23 seeded subjects), a daily quote, a silent welcome tour, and a feedback form
- **Legal** page at `/legal`
- Rate limiting on AI-backed endpoints to keep OpenAI costs predictable

## Running it locally

You need Node 20+. For a full AI experience you also need an OpenAI API key. MongoDB Atlas is optional if you use demo mode.

**1. Backend settings**

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in:

| Variable | Required? | Notes |
|---|---|---|
| `MONGODB_URI` | for `npm run dev` / `npm start` | Atlas or local Mongo |
| `JWT_SECRET` | for `npm run dev` / `npm start` | any long random string |
| `OPENAI_API_KEY` | for search / regenerate / quizzes | leave empty to run the app with AI features off |
| `OPENAI_MODEL` | optional | defaults to `gpt-5.5` |
| `CLIENT_URL` | optional | CORS; defaults to `http://localhost:5173` |

The file is git-ignored, so your keys never get committed.

**2. Start the backend** (terminal 1)

```bash
cd backend
npm install
npm run demo       # easiest: in-memory MongoDB, no Atlas account
# or: npm run dev  # needs MONGODB_URI + JWT_SECRET in .env
```

You should see `Server is running on http://localhost:3001`.

**3. Start the frontend** (terminal 2, from the repo root)

```bash
npm install
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173). Use **Chrome** if you want to try Nova.

### Trying it without MongoDB Atlas

```bash
cd backend && npm install && npm run demo
npm install && npm run dev   # another terminal, repo root
```

Sign up, browse subjects, save topics, leave feedback. Put `OPENAI_API_KEY` in `backend/.env` (and restart `npm run demo`) before search and quizzes will work. Nothing persists after you stop the demo server.

### Suggested path for a first-time tester

1. Sign up / sign in (check that you are 15 or older)
2. Search a few topics, flip the card, try **Hear it**
3. Tap **Nova** in the corner, then **What can I say?** if you want the phrase list (Chrome)
4. Save at least **5** topics
5. Open **Games** (Match, Spot the mistake, Hear & pick) after 4 saved cards
6. Save a fifth card, then **Start review quiz** or **Take Quiz** on one topic
7. If you miss topics on the review quiz, use **Practice this topic**

## Sharing the app with a tester

Send the live site: https://flashtrack-ai-learning-platform.vercel.app

For local runs, give them the GitHub repo and the steps above. They need Node 20+ and (for AI features) their own OpenAI key.

```text
Repo: https://github.com/Mia-Cran/flashtrack-ai-learning-platform

cd backend && npm install && cp .env.example .env
# add OPENAI_API_KEY (and for non-demo: MONGODB_URI, JWT_SECRET)
npm run demo

# other terminal, repo root:
npm install && npm run dev
# open http://localhost:5173
```

## Deploying (already live — steps if you fork or rebuild)

Frontend: Vercel (`flashtrack-ai-learning-platform`), auto-deploys from `main`.  
Backend: Render (`https://flashtrack-api.onrender.com`). `CLIENT_URL` should be the Vercel URL. `VITE_API_BASE_URL` on Vercel should be the Render URL.

**If you need to stand it up again**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Mia-Cran/flashtrack-ai-learning-platform)

Click the button (sign in to Render with GitHub if asked). It reads `render.yaml` from this repo and shows one service, `flashtrack-api`. Before it builds, paste:

| Render asks for | Paste |
|---|---|
| `MONGODB_URI` | your MongoDB Atlas string (`mongodb+srv://...`) |
| `JWT_SECRET` | the same long random string you use locally |
| `OPENAI_API_KEY` | your OpenAI key (`sk-...`), or leave blank to start with AI off |
| `CLIENT_URL` | your Vercel site address — no slash at the end |

Click **Apply**. Copy the backend URL Render shows.

In Vercel: project → **Settings** → **Environment Variables** → **Add**: name `VITE_API_BASE_URL`, value = the Render address (no trailing slash), environment **Production**. Save, then **Deployments** → ⋯ on the latest → **Redeploy**.

**Good to know**
- Free Render naps after ~15 idle minutes; the first request after a nap can take ~30 seconds.
- Backend code changes: Render → `flashtrack-api` → **Manual Deploy** (`autoDeploy: false` in this repo).
- If the site can’t reach the API, check `CLIENT_URL` on Render and `VITE_API_BASE_URL` on Vercel.

## API overview

All responses are JSON. Routes marked 🔒 need an `Authorization: Bearer <token>` header (from `/signin`).

| Method | Path | What it does |
|---|---|---|
| POST | `/signup` | Create an account |
| POST | `/signin` | Log in, returns a token |
| POST | `/study/generate` | Generate a study card for a term (rate limited) |
| GET/POST | `/topics` 🔒 | List / save the current user's topics |
| GET/PATCH/DELETE | `/topics/:id` 🔒 | Read / update / delete one topic |
| POST | `/topics/:id/regenerate` 🔒 | Rebuild a card at another difficulty |
| GET | `/progress` 🔒 | Quiz progress summary + strengths / struggles |
| POST | `/quizzes/review/generate` 🔒 | Mixed review quiz across recent saved cards (needs 5+) |
| GET | `/quizzes/review/:id` 🔒 | Read a review quiz (answers not included) |
| POST | `/quizzes/review/:id/submit` 🔒 | Submit review answers; returns score + missed topics |
| POST | `/quizzes/:topicId/generate` 🔒 | Create the per-topic quiz (rate limited; optional `questionType` in body) |
| GET | `/quizzes/:topicId` | Read a topic quiz's questions (answers not included) |
| GET | `/quizzes/:quizId/responses` 🔒 | Past attempts for a quiz (owner only) |
| POST | `/quizzes/:quizId/submit` 🔒 | Submit topic-quiz answers, get a score |
| GET/PATCH | `/learner-profile` 🔒 | Read / update learning preferences |
| GET | `/subjects` | List subjects |
| GET | `/quote/daily` | Daily quote |
| GET/POST | `/feedback` | Read / leave feedback (rate limited) |

## Project layout

```
src/                 React app
  pages/             Welcome, Search, Dashboard, Saved, Quiz, ReviewQuiz, Games, Settings, Voice, Legal, ...
  components/        StudyCard (flip + hear), Header, VoiceMic (Nova), auth forms, ...
  i18n/              English + Spanish copy
  utils/api.js       the backend URL (single source of truth)
  utils/voiceCommands.js  Nova phrase parser
  **/*.test.jsx      frontend tests live next to the thing they test
.github/workflows/   CI: lint + both test suites + build
backend/
  server.js          loads .env, checks required keys, connects to Mongo, listens
  app.js             Express app: CORS, JSON, routes, 404 and error handlers
  routes/            URL → controller wiring (+ auth / rate limits)
  controllers/       route logic (including reviewQuizzes)
  models/            User, Topic, Quiz, ReviewQuiz, UserQuizResponse, ...
  middleware/        auth, optionalAuth, requireAI, rate limiters
  utils/             openai, studyGuide, quizGeneration, reviewQuizGeneration, moderation
  tests/             backend suite (offline; in-memory Mongo + fake OpenAI)
  scripts/           demoServer, seed subjects, maintenance
```

## Keeping it going (the maintainer's guide)

This web app’s planned feature list is done. Next work is wrap/docs, or small add-ons people actually ask for — not a new version.

Everything below runs offline. No OpenAI key, no Atlas: backend tests use in-memory MongoDB and canned OpenAI answers.

**Before you push, run these three:**

```bash
npm run lint             # frontend + backend
npm test                 # frontend (Vitest)
cd backend && npm test   # backend (node:test + Supertest)
```

CI runs the same three on every push and PR.

**How a change gets shipped**

1. Branch: `git checkout -b my-change`
2. Change the code (and a test if behavior changes)
3. Run the three commands above
4. Push, open a PR, merge when green
5. Backend: Render → **Manual Deploy**. Frontend: Vercel redeploys from `main`

**Where things live**

| Want to change... | Look in |
|---|---|
| Study card prompt / wording | `backend/utils/studyGuide.js` |
| Per-topic quiz generation | `backend/utils/quizGeneration.js` |
| Mixed review quiz generation | `backend/utils/reviewQuizGeneration.js` |
| Flip card / Hear it UI | `src/components/StudyCard/` |
| Nova phrases / parser | `src/utils/voiceCommands.js`, `src/pages/VoicePage/` |
| English / Spanish copy | `src/i18n/translations.js` |
| Dashboard quiz unlock + CTAs | `src/pages/DashboardPage/` |
| OpenAI model | `OPENAI_MODEL` in `backend/.env` (default `gpt-5.5`) |
| Rate limit on AI endpoints | `backend/middleware/rateLimit.js` |
| CORS allowlist | `CLIENT_URL` in `backend/.env` |

**Adding a backend route:** controller → `routes/` → mount in `app.js` → test with `createUser` / `fakeOpenAI` / `seedSubjects` in `backend/tests/`.

**If OpenAI calls fail** it is almost always: missing/revoked key, no account credit, or a bad `OPENAI_MODEL`. The server log has the real error; the browser often only shows a generic failure message.

## A note on auth

The login token is kept in `localStorage`. Fine for this stage; a production hardening step is an `httpOnly` cookie.

## Author

Maria Cranford
