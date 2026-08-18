const express = require("express");
const cors = require("cors");
const topicRoutes = require("./routes/topics");
const userRoutes = require("./routes/users");
const studyRoutes = require("./routes/study");
const quoteRoutes = require("./routes/quote");

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

module.exports = app;