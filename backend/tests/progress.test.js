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
  seedSubjects,
} = require("./helpers");
const Subject = require("../models/subject");

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

async function savedTopicWithSubject(authHeader) {
  await seedSubjects();
  const subject = await Subject.findOne({ slug: "software-engineering" });
  const res = await request(app).post("/topics").set(authHeader).send({
    ...topicBody,
    subject: subject._id,
  });
  return res.body;
}

test("listing quiz attempts returns only the caller's scores", async () => {
  const alice = await createUser({ email: "alice@example.com" });
  const bob = await createUser({ email: "bob@example.com" });
  const topic = await savedTopicWithSubject(alice.authHeader);
  fakeOpenAI({ responsesByName: { quiz_questions: sampleQuizLevel } });
  const quiz = await request(app)
    .post(`/quizzes/${topic._id}/generate`)
    .set(alice.authHeader);

  await request(app)
    .post(`/quizzes/${quiz.body._id}/submit`)
    .set(alice.authHeader)
    .send({
      difficulty: "Beginner",
      responses: ["A", "A", "A", "A", "A"].map((userAnswer) => ({ userAnswer })),
    });

  const mine = await request(app)
    .get(`/quizzes/${quiz.body._id}/responses`)
    .set(alice.authHeader);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.attempts.length, 1);
  assert.equal(mine.body.attempts[0].score, 5);
  assert.equal(mine.body.attempts[0].percent, 100);

  const others = await request(app)
    .get(`/quizzes/${quiz.body._id}/responses`)
    .set(bob.authHeader);
  assert.equal(others.status, 200);
  assert.equal(others.body.attempts.length, 0);
});

test("submitting a quiz updates strengths and progress summary", async () => {
  const { authHeader } = await createUser();
  const topic = await savedTopicWithSubject(authHeader);
  fakeOpenAI({ responsesByName: { quiz_questions: sampleQuizLevel } });
  const quiz = await request(app)
    .post(`/quizzes/${topic._id}/generate`)
    .set(authHeader);

  const submit = await request(app)
    .post(`/quizzes/${quiz.body._id}/submit`)
    .set(authHeader)
    .send({
      difficulty: "Beginner",
      responses: ["A", "A", "A", "A", "A"].map((userAnswer) => ({ userAnswer })),
    });
  assert.equal(submit.status, 201);

  const progress = await request(app).get("/progress").set(authHeader);
  assert.equal(progress.status, 200);
  assert.equal(progress.body.totals.attemptCount, 1);
  assert.equal(progress.body.topics.length, 1);
  assert.equal(progress.body.topics[0].term, "Recursion");
  assert.equal(progress.body.topics[0].lastPercent, 100);
  assert.equal(progress.body.strengths.length, 1);
  assert.equal(progress.body.strengths[0].name, "Software Engineering");
  assert.equal(progress.body.areasOfStruggle.length, 0);
});

test("a low score lands the subject in areas of struggle", async () => {
  const { authHeader } = await createUser();
  const topic = await savedTopicWithSubject(authHeader);
  fakeOpenAI({ responsesByName: { quiz_questions: sampleQuizLevel } });
  const quiz = await request(app)
    .post(`/quizzes/${topic._id}/generate`)
    .set(authHeader);

  // 1/5 = 20% -> struggle (< 60%)
  await request(app)
    .post(`/quizzes/${quiz.body._id}/submit`)
    .set(authHeader)
    .send({
      difficulty: "Beginner",
      responses: ["A", "B", "B", "B", "B"].map((userAnswer) => ({ userAnswer })),
    });

  const progress = await request(app).get("/progress").set(authHeader);
  assert.equal(progress.status, 200);
  assert.equal(progress.body.areasOfStruggle.length, 1);
  assert.equal(progress.body.strengths.length, 0);
});
