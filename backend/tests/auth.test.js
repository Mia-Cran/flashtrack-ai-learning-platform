const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  app,
  request,
  startDatabase,
  stopDatabase,
  clearDatabase,
} = require("./helpers");

before(startDatabase);
after(stopDatabase);
beforeEach(clearDatabase);

test("signup creates an account and never returns the password", async () => {
  const res = await request(app)
    .post("/signup")
    .send({ name: "Maria", email: "maria@example.com", password: "secret123" });

  assert.equal(res.status, 201);
  assert.equal(res.body.email, "maria@example.com");
  assert.equal(res.body.password, undefined);
});

test("signup rejects a missing field with 400, not a crash", async () => {
  const res = await request(app).post("/signup").send({ email: "x@example.com" });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /required/i);
});

test("signup rejects a duplicate email with 409", async () => {
  const body = { name: "A", email: "dup@example.com", password: "secret123" };
  await request(app).post("/signup").send(body);
  const res = await request(app).post("/signup").send(body);
  assert.equal(res.status, 409);
});

test("signin returns a token that unlocks a protected route", async () => {
  await request(app)
    .post("/signup")
    .send({ name: "Maria", email: "maria@example.com", password: "secret123" });

  const signin = await request(app)
    .post("/signin")
    .send({ email: "maria@example.com", password: "secret123" });
  assert.equal(signin.status, 200);
  assert.ok(signin.body.token);

  const topics = await request(app)
    .get("/topics")
    .set("Authorization", `Bearer ${signin.body.token}`);
  assert.equal(topics.status, 200);
  assert.deepEqual(topics.body, []);
});

test("signin with the wrong password is 401", async () => {
  await request(app)
    .post("/signup")
    .send({ name: "Maria", email: "maria@example.com", password: "secret123" });
  const res = await request(app)
    .post("/signin")
    .send({ email: "maria@example.com", password: "nope" });
  assert.equal(res.status, 401);
});

test("protected routes reject a missing or bad token", async () => {
  const missing = await request(app).get("/topics");
  assert.equal(missing.status, 401);

  const bad = await request(app).get("/topics").set("Authorization", "Bearer not-a-token");
  assert.equal(bad.status, 401);
});

test("unknown routes are a JSON 404", async () => {
  const res = await request(app).get("/definitely-not-a-route");
  assert.equal(res.status, 404);
  assert.equal(res.body.message, "Route not found");
});
