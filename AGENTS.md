# FlashTrack — agent handoff

You are picking up a working full-stack app. Read this file, then the README, then run the three checks below before changing anything. Everything here was true as of 2026-09-03.

## What this app is

FlashTrack: a student searches a term, gets an AI-written study card (simple definition, beginner explanation, technical definition, analogy, code example, common mistake), saves it to their account, and quizzes themselves on it later. Multi-subject (23 subjects seeded). Owner: Maria Cranford. Bootcamp project ("Project 16"), Phase 3.

## Stack and layout

| Part | Where | Stack |
|---|---|---|
| Frontend | repo root, `src/` | React 19, React Router 7, Vite 8. Plain CSS, one folder per page/component. |
| Backend | `backend/` | Node 20+, Express 5, Mongoose 9 (MongoDB), JWT auth (bcrypt passwords), OpenAI SDK 7 (Responses API). CommonJS. |
| Tests | `backend/tests/` (node:test + supertest + mongodb-memory-server), `src/**/*.test.jsx` (Vitest + Testing Library) | 32 backend, 6 frontend |
| CI | `.github/workflows/ci.yml` | lint + both suites + build on every push and PR |

Backend routes are mounted in `backend/app.js`. Route files (`backend/routes/`) do auth/rate-limit wiring only; logic is in `backend/controllers/`. The browser talks only to the backend; the backend alone holds the OpenAI key and the DB connection.

The entire AI layer is two files:
- `backend/utils/studyGuide.js` — the study-card prompt + JSON schema, used by `POST /study/generate` (search) and `POST /topics/:id/regenerate`. Learner-profile personalization is built here.
- `backend/utils/quizGeneration.js` — 5 questions per difficulty level, in the learner's preferred question type, three parallel model calls.

Model: `OPENAI_MODEL` env, default `gpt-5.5`. Client is lazy (`backend/utils/openai.js`); the key is optional (see below).

## Run it

```bash
# no accounts needed
cd backend && npm install && npm run demo   # in-memory MongoDB, seeds subjects
npm install && npm run dev                  # repo root, second terminal

# real setup: copy backend/.env.example -> backend/.env, fill MONGODB_URI, JWT_SECRET, optionally OPENAI_API_KEY
cd backend && npm run dev
```

Without `OPENAI_API_KEY` the app runs fully except search, regenerate, and quiz creation, which answer 503 with a "turn on AI" message (`backend/middleware/requireAI.js`). Do not "fix" that by stubbing the AI; add a key.

## Before every push (CI runs the same three)

```bash
npm run lint             # frontend + backend
npm test                 # frontend
cd backend && npm test   # backend
```

All three are green on `main` right now. Keep them green. Add a test for any behavior you change; the backend helpers (`backend/tests/helpers.js`: `createUser`, `fakeOpenAI`, `seedSubjects`) make that a few lines.

## History you need to know

- The Sept 1 commit "Fix search and quiz functionality with test endpoints" (8b6e713) replaced the whole AI layer with placeholder text and added stub routes that shadowed the real ones. It misdiagnosed the OpenAI calls; `gpt-5.5` and the Responses API were never broken. All of that was removed on Sept 3 (PR #10). If you see references to "dummy" quizzes or "test endpoints" anywhere, they are dead history.
- PR #2–#8 (Sept 2): startup crash fix, `.env` loading, `VITE_API_BASE_URL`, quiz page layout, answer-key leak fix + rate limit, signup errors, CORS/404/error handler, README rewrite.
- PR #9: `render.yaml` + a one-click "Deploy to Render" button in the README.
- PR #10: real AI restored, tests, CI, maintainer guide, ESLint now covers the backend.
- PR #11: OpenAI key optional, `npm run demo`, `requireAI` middleware.

## Deployment state

- Frontend: already on Vercel (`software-engineering-study-tracker` project). Auto-deploys from `main`. Needs `VITE_API_BASE_URL` set to the backend URL, then a redeploy.
- Backend: **not deployed yet**. The README's "Deploying" section is the procedure (Render button, four env vars, then the Vercel variable). Until that is done the live site cannot sign up or search. This is the single most valuable next step.

## Known gaps and good next tasks (in rough priority order)

1. **Deploy the backend** (above). Then set `CLIENT_URL` on Render to the Vercel URL.
2. **Quiz results history.** `UserQuizResponse` documents are saved on every submit but nothing reads them. A "past attempts" list on the quiz page or dashboard (`GET /quizzes/:quizId/responses`, owner-scoped) is a clean, contained feature.
3. **Strengths / areas of struggle.** `LearnerProfile.strengths` and `areasOfStruggle` exist (refs to Subject) and are never populated. With quiz history available, derive them from scores by subject. The model comment says: no proxy or heuristic until there's a real measure; quiz scores are that measure.
4. **Learner profile "guiding questions"** (`studentStage`, `primaryInterest`) are saved from the dashboard but only the dashboard recommendation list uses saved topics' `relatedTopics`. Using stage/interest to seed recommendations for a brand-new user is the intended follow-on ("Phase 3, Session 10" in the model comments).
5. **Frontend test coverage** is thin (QuizPage + API util only). SearchPage, StudyCard save/regenerate, and the auth forms are the next to cover. Mock `fetch` the way `QuizPage.test.jsx` does.
6. **Auth hardening.** JWT is kept in `localStorage`. Moving it to an `httpOnly` cookie is the standard fix (README "A note on auth"). Touches `backend/controllers/users.js`, `backend/middleware/auth.js`, `src/App.jsx` sign-in/out, and CORS (`credentials: true`).
7. **Short-answer grading** is exact-match (case-insensitive) in `submitQuizResponse`. Fine for MC/TF; for `shortAnswer` a lenient comparison (or a model-graded pass) would be better.
8. **Rate limiting** is per-IP, 30 per 15 minutes on AI routes (`backend/middleware/rateLimit.js`). Per-user limits once accounts are the norm.
9. `backend/scripts/fixCorruptedTopics.js` and `reportLearnerProfiles.js` are one-off maintenance scripts; leave them unless asked.

## Conventions

- Small, single-purpose PRs into `main`; CI green before merge.
- Comments explain *why*, in plain English; the codebase already reads that way, match it.
- Never commit `backend/.env`. Never hardcode the backend URL in the frontend; use `src/utils/api.js`.
- Public routes must never return quiz `correctAnswer`/`explanation` (see `withoutAnswers` in `backend/controllers/quizzes.js`).
- All user text that reaches the model goes through `backend/utils/moderation.js` first.
- Express 5: route handlers can be `async`; thrown errors reach the central handler in `app.js`.

## If something is confusing

Check the README first (it has the API table and the maintainer's guide), then the tests: they show the intended behavior of every route.
