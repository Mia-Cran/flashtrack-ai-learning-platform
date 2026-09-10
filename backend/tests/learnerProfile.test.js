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

before(startDatabase);
after(stopDatabase);
beforeEach(clearDatabase);

test("PATCH /learner-profile saves preferredLanguage", async () => {
  const { authHeader } = await createUser();

  const res = await request(app)
    .patch("/learner-profile")
    .set(authHeader)
    .send({ preferredLanguage: "es" });

  assert.equal(res.status, 200);
  assert.equal(res.body.preferredLanguage, "es");

  const again = await request(app).get("/learner-profile").set(authHeader);
  assert.equal(again.body.preferredLanguage, "es");
});

test("PATCH /learner-profile rejects an unknown language", async () => {
  const { authHeader } = await createUser();

  const res = await request(app)
    .patch("/learner-profile")
    .set(authHeader)
    .send({ preferredLanguage: "fr" });

  assert.equal(res.status, 400);
});
