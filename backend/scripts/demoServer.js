// Run the whole backend against a throwaway in-memory MongoDB, for trying
// the app without a MongoDB Atlas account. Nothing persists past Ctrl-C.
//
//   cd backend && npm run demo
//
// Works with or without OPENAI_API_KEY (from backend/.env or the
// environment). Without it, search / regenerate / quiz creation answer with
// a "turn on AI" message and everything else works normally.

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const { seedSubjects } = require("./seedSubjects");

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || "demo-only-secret-not-for-production";

  console.log("Demo database: in-memory (everything is gone when this stops)");

  // server.js reads the env, connects, and listens.
  require("../server");

  mongoose.connection.once("open", () => {
    seedSubjects({ log: () => {} }).then(() => console.log("Seeded the subject list"));
  });

  const stop = async () => {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
