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

app.use(cors());
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

module.exports = app;