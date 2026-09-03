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
  sampleQuizLevel,
} = require("./helpers");
const LearnerProfile = require("../models/learnerProfile");

before(startDatabase);
after(stopDatabase);
beforeEach(clearDatabase);

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

async function savedTopic(authHeader) {
  const res = await request(app).post("/topics").set(authHeader).send(topicBody);
  return res.body._id;
}

test("generating a quiz asks the model for all three levels and stores them", async () => {
  const { authHeader } = await createUser();
  const topicId = await savedTopic(authHeader);
  const calls = fakeOpenAI({ responsesByName: { quiz_questions: sampleQuizLevel } });

  const res = await request(app).post(`/quizzes/${topicId}/generate`).set(authHeader);

  assert.equal(res.status, 201);
  assert.equal(calls.length, 3);
  const levels = calls.map((c) => c.input).sort();
  assert.deepEqual(levels, [
    "Write the Advanced quiz for: Recursion",
    "Write the Beginner quiz for: Recursion",
    "Write the Intermediate quiz for: Recursion",
  ]);
  for (const level of ["Beginner", "Intermediate", "Advanced"]) {
    assert.equal(res.body.questions[level].length, 5);
    assert.equal(res.body.questions[level][0].type, "multipleChoice");
  }
});

test("generating again returns the existing quiz without calling the model", async () => {
  const { authHeader } = await createUser();
  const topicId = await savedTopic(authHeader);
  const calls = fakeOpenAI({ responsesByName: { quiz_questions: sampleQuizLevel } });

  const first = await request(app).post(`/quizzes/${topicId}/generate`).set(authHeader);
  const second = await request(app).post(`/quizzes/${topicId}/generate`).set(authHeader);

  assert.equal(second.status, 200);
  assert.equal(second.body._id, first.body._id);
  assert.equal(calls.length, 3);
});

test("the learner's preferred question type is used", async () => {
  const { user, authHeader } = await createUser();
  await LearnerProfile.create({ user: user._id, learningPreferences: { questionType: "trueFalse" } });
  const topicId = await savedTopic(authHeader);
  const calls = fakeOpenAI({
    responsesByName: {
      quiz_questions: {
        questions: [1, 2, 3, 4, 5].map((n) => ({
          text: `Statement ${n}`,
          options: ["true", "false"],
          correctAnswer: "true",
          explanation: "Yes.",
        })),
      },
    },
  });

  const res = await request(app).post(`/quizzes/${topicId}/generate`).set(authHeader);

  assert.match(calls[0].instructions, /5 trueFalse questions/);
  assert.equal(res.body.questions.Beginner[0].type, "trueFalse");
});

test("generating a quiz for someone else's topic is a 404", async () => {
  const alice = await createUser({ email: "alice@example.com" });
  const bob = await createUser({ email: "bob@example.com" });
  const topicId = await savedTopic(alice.authHeader);
  fakeOpenAI({ responsesByName: { quiz_questions: sampleQuizLevel } });

  const res = await request(app).post(`/quizzes/${topicId}/generate`).set(bob.authHeader);
  assert.equal(res.status, 404);
});

test("reading a quiz is public and never includes the answers", async () => {
  const { authHeader } = await createUser();
  const topicId = await savedTopic(authHeader);
  fakeOpenAI({ responsesByName: { quiz_questions: sampleQuizLevel } });
  await request(app).post(`/quizzes/${topicId}/generate`).set(authHeader);

  const res = await request(app).get(`/quizzes/${topicId}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.topic.term, "Recursion");
  for (const level of ["Beginner", "Intermediate", "Advanced"]) {
    for (const question of res.body.questions[level]) {
      assert.equal(question.correctAnswer, undefined);
      assert.equal(question.explanation, undefined);
      assert.ok(question.text);
    }
  }
});

test("submitting answers grades them on the server", async () => {
  const { authHeader } = await createUser();
  const topicId = await savedTopic(authHeader);
  fakeOpenAI({ responsesByName: { quiz_questions: sampleQuizLevel } });
  const quiz = await request(app).post(`/quizzes/${topicId}/generate`).set(authHeader);

  const res = await request(app)
    .post(`/quizzes/${quiz.body._id}/submit`)
    .set(authHeader)
    .send({
      difficulty: "Beginner",
      responses: ["A", "A", "B", "a", null].map((userAnswer) => ({ userAnswer })),
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.score, 3);
  assert.equal(res.body.maxScore, 5);
  assert.deepEqual(
    res.body.responses.map((r) => r.isCorrect),
    [true, true, false, true, false],
  );
});

test("submitting the wrong number of answers or a bad difficulty is a 400", async () => {
  const { authHeader } = await createUser();
  const topicId = await savedTopic(authHeader);
  fakeOpenAI({ responsesByName: { quiz_questions: sampleQuizLevel } });
  const quiz = await request(app).post(`/quizzes/${topicId}/generate`).set(authHeader);

  const short = await request(app)
    .post(`/quizzes/${quiz.body._id}/submit`)
    .set(authHeader)
    .send({ difficulty: "Beginner", responses: [{ userAnswer: "A" }] });
  assert.equal(short.status, 400);

  const badLevel = await request(app)
    .post(`/quizzes/${quiz.body._id}/submit`)
    .set(authHeader)
    .send({ difficulty: "Expert", responses: [] });
  assert.equal(badLevel.status, 400);
});

test("a missing quiz is a 404, a malformed id is a 400", async () => {
  const missing = await request(app).get("/quizzes/64b000000000000000000000");
  assert.equal(missing.status, 404);

  const malformed = await request(app).get("/quizzes/not-an-id");
  assert.equal(malformed.status, 400);
});
