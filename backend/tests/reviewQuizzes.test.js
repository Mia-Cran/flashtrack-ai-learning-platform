const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  app,
  request,
  startDatabase,
  stopDatabase,
  clearDatabase,
  fakeOpenAI,
  createUser,
} = require("./helpers");

before(startDatabase);
after(stopDatabase);
beforeEach(clearDatabase);

async function saveTopics(authHeader, count) {
  const ids = [];

  for (let i = 0; i < count; i += 1) {
    const res = await request(app)
      .post("/topics")
      .set(authHeader)
      .send({
        term: `Topic ${i + 1}`,
        simpleDefinition: "Simple.",
        beginnerDefinition: "Beginner.",
        technicalDefinition: "Technical.",
        analogy: "Analogy.",
        commonMistake: "Mistake.",
        relatedTopics: ["Related"],
        category: "Programming",
        difficulty: "Beginner",
      });
    assert.equal(res.status, 201);
    ids.push(res.body._id);
  }

  return ids;
}

test("review quiz needs at least 5 saved topics", async () => {
  const { authHeader } = await createUser();
  await saveTopics(authHeader, 3);

  const res = await request(app)
    .post("/quizzes/review/generate")
    .set(authHeader);

  assert.equal(res.status, 400);
  assert.match(res.body.message, /at least 5/i);
});

test("review quiz grades misses by topic", async () => {
  const { authHeader } = await createUser();
  const topicIds = await saveTopics(authHeader, 5);

  fakeOpenAI({
    responsesByName: {
      review_quiz_questions: {
        questions: topicIds.map((_id, i) => ({
          topicTerm: `Topic ${i + 1}`,
          text: `Question about Topic ${i + 1}?`,
          options: ["A", "B", "C", "D"],
          correctAnswer: "A",
          explanation: "Because A.",
        })),
      },
    },
  });

  const created = await request(app)
    .post("/quizzes/review/generate")
    .set(authHeader);

  assert.equal(created.status, 201);
  assert.equal(created.body.questions.length, 5);
  assert.equal(created.body.questions[0].correctAnswer, undefined);

  const submitted = await request(app)
    .post(`/quizzes/review/${created.body._id}/submit`)
    .set(authHeader)
    .send({
      responses: [
        { userAnswer: "A" },
        { userAnswer: "B" },
        { userAnswer: "A" },
        { userAnswer: "B" },
        { userAnswer: "A" },
      ],
    });

  assert.equal(submitted.status, 201);
  assert.equal(submitted.body.score, 3);
  assert.equal(submitted.body.maxScore, 5);
  assert.equal(submitted.body.missedTopics.length, 2);
  assert.deepEqual(
    submitted.body.missedTopics.map((topic) => topic.term).sort(),
    ["Topic 2", "Topic 4"],
  );
});
