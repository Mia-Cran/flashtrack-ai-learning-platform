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

before(startDatabase);
after(stopDatabase);
beforeEach(clearDatabase);

const topicBody = {
  term: "Recursion",
  searchTerm: "recursion",
  simpleDefinition: "A function that calls itself.",
  beginnerDefinition: "Explanation.",
  technicalDefinition: "Technical.",
  analogy: "Nesting dolls.",
  codeExample: null,
  commonMistake: "No base case.",
  relatedTopics: ["Stack"],
  category: "Programming",
  difficulty: "Intermediate",
};

test("a user can save, list, read, update and delete their own topics", async () => {
  const { authHeader } = await createUser();

  const created = await request(app).post("/topics").set(authHeader).send(topicBody);
  assert.equal(created.status, 201);
  const id = created.body._id;

  const list = await request(app).get("/topics").set(authHeader);
  assert.equal(list.body.length, 1);

  const one = await request(app).get(`/topics/${id}`).set(authHeader);
  assert.equal(one.body.term, "Recursion");

  const updated = await request(app)
    .patch(`/topics/${id}`)
    .set(authHeader)
    .send({ difficulty: "Advanced" });
  assert.equal(updated.body.difficulty, "Advanced");

  const deleted = await request(app).delete(`/topics/${id}`).set(authHeader);
  assert.equal(deleted.status, 200);

  const after = await request(app).get("/topics").set(authHeader);
  assert.deepEqual(after.body, []);
});

test("saving the same term twice is a 409, and ?term= finds the saved copy", async () => {
  const { authHeader } = await createUser();

  await request(app).post("/topics").set(authHeader).send(topicBody);
  const again = await request(app).post("/topics").set(authHeader).send(topicBody);
  assert.equal(again.status, 409);

  const found = await request(app).get("/topics?term=Recursion").set(authHeader);
  assert.equal(found.body.length, 1);
  assert.equal(found.body[0].term, "Recursion");

  const none = await request(app).get("/topics?term=closures").set(authHeader);
  assert.deepEqual(none.body, []);
});

test("saving without a term is a 400, not a crash", async () => {
  const { authHeader } = await createUser();
  const res = await request(app).post("/topics").set(authHeader).send({ ...topicBody, term: undefined });
  assert.equal(res.status, 400);
});

test("users cannot see each other's topics", async () => {
  const alice = await createUser({ email: "alice@example.com" });
  const bob = await createUser({ email: "bob@example.com" });

  const created = await request(app).post("/topics").set(alice.authHeader).send(topicBody);

  const bobList = await request(app).get("/topics").set(bob.authHeader);
  assert.deepEqual(bobList.body, []);

  const bobRead = await request(app).get(`/topics/${created.body._id}`).set(bob.authHeader);
  assert.equal(bobRead.status, 404);
});

test("regenerate rebuilds the card at the requested level via the model", async () => {
  await seedSubjects();
  const { authHeader } = await createUser();
  const created = await request(app).post("/topics").set(authHeader).send(topicBody);

  const calls = fakeOpenAI({
    responsesByName: {
      study_guide: { ...sampleStudyGuide, simpleDefinition: "Advanced definition." },
    },
  });

  const res = await request(app)
    .post(`/topics/${created.body._id}/regenerate`)
    .set(authHeader)
    .send({ difficulty: "Advanced" });

  assert.equal(res.status, 200);
  assert.equal(res.body.simpleDefinition, "Advanced definition.");
  assert.equal(res.body.difficulty, "Advanced");
  assert.equal(res.body.subject.slug, "software-engineering");
  assert.match(calls[0].instructions, /at Advanced level/);
});

test("regenerate with a bad difficulty is a 400 and never calls the model", async () => {
  const { authHeader } = await createUser();
  const created = await request(app).post("/topics").set(authHeader).send(topicBody);
  const calls = fakeOpenAI({ responsesByName: { study_guide: sampleStudyGuide } });

  const res = await request(app)
    .post(`/topics/${created.body._id}/regenerate`)
    .set(authHeader)
    .send({ difficulty: "Expert" });

  assert.equal(res.status, 400);
  assert.equal(calls.length, 0);
});
