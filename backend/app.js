const express = require("express");
const cors = require("cors");
const topicRoutes = require("./routes/topics");
const userRoutes = require("./routes/users");
const studyRoutes = require("./routes/study");
const quoteRoutes = require("./routes/quote");
const subjectRoutes = require("./routes/subject");
const learnerProfileRoutes = require("./routes/learnerProfile");
const feedbackRoutes = require("./routes/feedback");
const quizRoutes = require("./routes/quizzes");

const app = express();

app.set("trust proxy", 1);

// Only allow requests from the frontend. CLIENT_URL is the deployed
// frontend's address (e.g. https://your-app.vercel.app). It falls back to
// the Vite dev server so local development works with no extra setup.
// You can list more than one, separated by commas.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use("/", userRoutes);


app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.use("/topics", topicRoutes);
app.use("/study", studyRoutes);
app.use("/quote", quoteRoutes);
app.use("/subjects", subjectRoutes);
app.use("/learner-profile", learnerProfileRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/quizzes", quizRoutes);

// Anything that didn't match a route above is a 404 (as JSON, not HTML).
app.use((req, res) => {
  res.status(404).send({ message: "Route not found" });
});

// Central error handler. Express calls this when a route throws or calls
// next(err). The four-argument signature is what marks it as an error
// handler, so keep `next` even though it is unused.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  // Errors Express itself raises for bad requests (e.g. malformed JSON body)
  // carry a status and expose: true, so their message is safe to show.
  // Anything else is a bug on our side: hide the details, return 500.
  const status = err.status || 500;
  const message = err.expose ? err.message : "Server error";
  res.status(status).send({ message });
});

module.exports = app;