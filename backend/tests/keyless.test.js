// The app must run without an OpenAI key: only the three AI actions switch
// off, and they say so plainly.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  app,
  request,
  startDatabase,
  stopDatabase,
  clearDatabase,
  createUser,
} = require("./helpers");
const { AI_OFF_MESSAGE } = require("../middleware/requireAI");

before(startDatabase);
after(stopDatabase);
beforeEach(clearDatabase);

function withoutKey(fn) {
  return async () => {
    const saved = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      await fn();
    } finally {
      process.env.OPENAI_API_KEY = saved;
    }
  };
}

const topicBody = {
  term: "Recursion",
  simpleDefinition: "A function that calls itself.",
  beginnerDefinition: "Explanation.",
  technicalDefinition: "Technical.",
  analogy: "Nesting dolls.",
  commonMistake: "No base case.",
  relatedTopics: ["Stack"],
  category: "Programming",
  difficulty: "Intermediate",
};

test("search answers 503 with the turn-on-AI message when there is no key", withoutKey(async () => {
  const res = await request(app).post("/study/generate").send({ term: "recursion" });
  assert.equal(res.status, 503);
  assert.equal(res.body.message, AI_OFF_MESSAGE);
  assert.equal(res.body.aiEnabled, false);
}));

test("regenerate and quiz creation are off too, before any auth or database work", withoutKey(async () => {
  const regen = await request(app).post("/topics/64b000000000000000000000/regenerate").send({ difficulty: "Advanced" });
  assert.equal(regen.status, 503);

  const quiz = await request(app).post("/quizzes/64b000000000000000000000/generate");
  assert.equal(quiz.status, 503);
}));

test("everything else keeps working without a key", withoutKey(async () => {
  const { authHeader } = await createUser();

  const created = await request(app).post("/topics").set(authHeader).send(topicBody);
  assert.equal(created.status, 201);

  const list = await request(app).get("/topics").set(authHeader);
  assert.equal(list.body.length, 1);

  const subjects = await request(app).get("/subjects");
  assert.equal(subjects.status, 200);

  const feedback = await request(app).post("/feedback").send({ message: "Works without a key." });
  assert.equal(feedback.status, 201);
}));
