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
  seedSubjects,
  sampleStudyGuide,
} = require("./helpers");
const LearnerProfile = require("../models/learnerProfile");

before(startDatabase);
after(stopDatabase);
beforeEach(clearDatabase);

test("POST /study/generate returns a real study card from the model", async () => {
  await seedSubjects();
  fakeOpenAI({ responsesByName: { study_guide: sampleStudyGuide } });

  const res = await request(app).post("/study/generate").send({ term: "recursion" });

  assert.equal(res.status, 200);
  assert.equal(res.body.studyGuide.title, "Recursion");
  assert.equal(res.body.studyGuide.simpleDefinition, "A function that calls itself.");
  // The model's subject name is resolved to the real Subject document.
  assert.equal(res.body.studyGuide.suggestedSubject.slug, "software-engineering");
  assert.ok(res.body.studyGuide.suggestedSubject._id);
});

test("the prompt offers the model the active subjects by name", async () => {
  await seedSubjects();
  const calls = fakeOpenAI({ responsesByName: { study_guide: sampleStudyGuide } });

  await request(app).post("/study/generate").send({ term: "recursion" });

  assert.equal(calls.length, 1);
  assert.match(calls[0].instructions, /Software Engineering, Math/);
  assert.equal(calls[0].input, "Create a study guide for: recursion");
  assert.equal(calls[0].text.format.name, "study_guide");
});

test("a signed-in learner's preferences are added to the prompt", async () => {
  await seedSubjects();
  const { user, authHeader } = await createUser();
  await LearnerProfile.create({
    user: user._id,
    preferredDifficulty: "Advanced",
    learningPreferences: { pacing: "keyPointsOnly", explanationStyle: "technical" },
  });
  const calls = fakeOpenAI({ responsesByName: { study_guide: sampleStudyGuide } });

  await request(app).post("/study/generate").set(authHeader).send({ term: "recursion" });

  assert.match(calls[0].instructions, /Preferred difficulty \(Advanced\)/);
  assert.match(calls[0].instructions, /Pacing:/);
  assert.match(calls[0].instructions, /Explanation style:/);
});

test("an anonymous search gets no personalization block", async () => {
  await seedSubjects();
  const calls = fakeOpenAI({ responsesByName: { study_guide: sampleStudyGuide } });

  await request(app).post("/study/generate").send({ term: "recursion" });

  assert.doesNotMatch(calls[0].instructions, /saved learning preferences/);
});

test("gibberish the model rejects becomes a 400", async () => {
  await seedSubjects();
  fakeOpenAI({
    responsesByName: {
      study_guide: { ...sampleStudyGuide, title: "INVALID_TOPIC" },
    },
  });

  const res = await request(app).post("/study/generate").send({ term: "asdfghjkl" });
  assert.equal(res.status, 400);
});

test("empty and blocklisted terms are rejected before calling the model", async () => {
  const calls = fakeOpenAI({ responsesByName: { study_guide: sampleStudyGuide } });

  const empty = await request(app).post("/study/generate").send({});
  assert.equal(empty.status, 400);

  const filler = await request(app).post("/study/generate").send({ term: "the" });
  assert.equal(filler.status, 400);

  assert.equal(calls.length, 0);
});

test("text the moderation check flags is rejected", async () => {
  await seedSubjects();
  const calls = fakeOpenAI({ responsesByName: { study_guide: sampleStudyGuide }, blocked: true });

  const res = await request(app).post("/study/generate").send({ term: "something awful" });
  assert.equal(res.status, 400);
  assert.equal(calls.length, 0);
});

test("a model failure is a 500 with a friendly message", async () => {
  await seedSubjects();
  fakeOpenAI(); // no canned response -> the fake throws

  const res = await request(app).post("/study/generate").send({ term: "recursion" });
  assert.equal(res.status, 500);
  assert.equal(res.body.message, "Failed to generate study guide");
});
