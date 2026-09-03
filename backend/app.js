const express = require("express");
const cors = require("cors");
const auth = require("./middleware/auth");
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

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.use("/", userRoutes);


app.get("/", (req, res) => {
    console.log("📍 HOME ENDPOINT CALLED");
    res.send("Backend is running");
});

app.get("/test", (req, res) => {
    console.log("📍 TEST ENDPOINT CALLED");
    res.send({ test: "success" });
});

app.post("/study/generate", (req, res) => {
    console.log("📍 STUDY TEST ENDPOINT CALLED");
    res.status(200).send({
      studyGuide: {
        title: req.body.term || "Test",
        simpleDefinition: "Test definition",
        beginnerExplanation: "Test explanation",
        technicalDefinition: "Test technical",
        analogy: "Test analogy",
        codeExample: "// test",
        commonMistake: "Test mistake",
        category: "Test",
        difficulty: "Beginner",
        relatedTopics: ["Topic 1", "Topic 2"],
        suggestedSubject: "Test"
      }
    });
});

app.post("/quizzes/:topicId/generate", auth, async (req, res) => {
    console.log("📍 QUIZ GENERATE TEST ENDPOINT CALLED");
    try {
      const mongoose = require("mongoose");
      const Quiz = require("./models/quiz");
      const { topicId } = req.params;

      const quiz = await Quiz.create({
        topic: topicId,
        questions: {
          Beginner: [
            { _id: new mongoose.Types.ObjectId(), text: "Q1?", type: "multipleChoice", options: ["A", "B", "C", "D"], correctAnswer: "A", explanation: "Test" }
          ],
          Intermediate: [
            { _id: new mongoose.Types.ObjectId(), text: "Q2?", type: "multipleChoice", options: ["A", "B", "C", "D"], correctAnswer: "B", explanation: "Test" }
          ],
          Advanced: [
            { _id: new mongoose.Types.ObjectId(), text: "Q3?", type: "multipleChoice", options: ["A", "B", "C", "D"], correctAnswer: "C", explanation: "Test" }
          ]
        }
      });
      res.status(201).send(quiz);
    } catch (err) {
      console.error("Quiz error:", err.message);
      res.status(500).send({ message: "Error" });
    }
});

app.post("/quizzes/:quizId/submit", auth, (req, res) => {
    console.log("📍 QUIZ SUBMIT TEST ENDPOINT CALLED");
    res.status(201).send({ score: 3, maxScore: 5 });
});

app.use("/topics", topicRoutes);
app.use("/study", studyRoutes);
app.use("/quote", quoteRoutes);
app.use("/subjects", subjectRoutes);
app.use("/learner-profile", learnerProfileRoutes);
app.use("/feedback", feedbackRoutes);
console.log("✅ Registering quiz routes");
app.use("/quizzes", quizRoutes);
console.log("✅ Quiz routes registered");

app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.message);
  console.error(err);
  res.status(500).send({ message: "Internal server error" });
});

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