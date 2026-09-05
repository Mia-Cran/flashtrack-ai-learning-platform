const path = require("path");
// Load backend/.env by its full path. dotenv's default looks for ".env" in
// whatever directory you ran the command from, so starting the server from
// the repo root (e.g. `node backend/server.js`) used to silently load nothing.
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Stop right away with a clear message if a required setting is missing.
for (const key of ["MONGODB_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Add it to backend/.env (see backend/.env.example).`);
    process.exit(1);
  }
}

// The OpenAI key is optional: without it the app runs with search,
// regenerate, and quiz creation switched off (they answer 503 with a
// message). See middleware/requireAI.js.
if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "OPENAI_API_KEY is not set: AI features are OFF. Add it to backend/.env to turn them on.",
  );
}

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3001;
console.log(
  "Mongo target:",
  process.env.MONGODB_URI?.startsWith("mongodb+srv://")
    ? "Atlas"
    : process.env.MONGODB_URI
);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
