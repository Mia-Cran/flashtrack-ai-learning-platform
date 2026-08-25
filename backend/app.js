const express = require("express");
const cors = require("cors");
const topicRoutes = require("./routes/topics");
const userRoutes = require("./routes/users");
const studyRoutes = require("./routes/study");
const quoteRoutes = require("./routes/quote");
const subjectRoutes = require("./routes/subject");
const learnerProfileRoutes = require("./routes/learnerProfile");
const feedbackRoutes = require("./routes/feedback");

const app = express();

app.set("trust proxy", 1);

app.use(cors());
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

module.exports = app;