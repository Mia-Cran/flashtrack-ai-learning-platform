// Shared setup for backend tests.
//
// Each test file gets a throwaway in-memory MongoDB (nothing touches a real
// database) and a fake OpenAI client, so the suite runs offline, costs
// nothing, and gives the same answer every time.

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-key";

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const openai = require("../utils/openai");
const app = require("../app");
const User = require("../models/user");
const Subject = require("../models/subject");

let mongod;

async function startDatabase() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function stopDatabase() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

async function clearDatabase() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

// Replace the real OpenAI calls with canned answers. `responsesByName` maps
// the JSON-schema name the code asks for ("study_guide", "quiz_questions")
// to the object the fake model should return. Moderation always passes
// unless `blocked` is set.
function fakeOpenAI({ responsesByName = {}, blocked = false } = {}) {
  const calls = [];

  openai.responses.create = async (params) => {
    calls.push(params);
    const name = params.text?.format?.name;
    const payload = responsesByName[name];
    if (!payload) {
      throw new Error(`fakeOpenAI: no canned response for "${name}"`);
    }
    const body = typeof payload === "function" ? payload(params) : payload;
    return { output_text: JSON.stringify(body) };
  };

  openai.moderations.create = async () => ({
    results: [{ categories: { hate: blocked } }],
  });

  return calls;
}

async function createUser({ name = "Test User", email = "test@example.com", password = "pw123456" } = {}) {
  const res = await request(app).post("/signup").send({ name, email, password });
  if (res.status !== 201) {
    throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const user = await User.findById(res.body._id);
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return { user, token, authHeader: { Authorization: `Bearer ${token}` } };
}

async function seedSubjects() {
  return Subject.create([
    { name: "Software Engineering", slug: "software-engineering", sortOrder: 1 },
    { name: "Math", slug: "math", sortOrder: 2 },
  ]);
}

const sampleStudyGuide = {
  title: "Recursion",
  simpleDefinition: "A function that calls itself.",
  beginnerExplanation: "Think of it as a loop that uses itself.\n\nEach call handles a smaller piece.",
  technicalDefinition: "A function defined in terms of itself with a base case.",
  analogy: "Russian nesting dolls.",
  codeExample: "function f(n) { return n <= 1 ? 1 : n * f(n - 1); }",
  commonMistake: "Forgetting the base case.",
  category: "Programming",
  difficulty: "Intermediate",
  relatedTopics: ["Stack", "Base case", "Iteration"],
  suggestedSubject: "Software Engineering",
};

const sampleQuizLevel = {
  questions: [1, 2, 3, 4, 5].map((n) => ({
    text: `Question ${n}?`,
    options: ["A", "B", "C", "D"],
    correctAnswer: "A",
    explanation: "Because A.",
  })),
};

module.exports = {
  app,
  request,
  startDatabase,
  stopDatabase,
  clearDatabase,
  fakeOpenAI,
  createUser,
  seedSubjects,
  sampleStudyGuide,
  sampleQuizLevel,
};
