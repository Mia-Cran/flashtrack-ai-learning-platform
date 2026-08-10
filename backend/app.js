const express = require("express");
const cors = require("cors");
const topicRoutes = require("./routes/topics");
const userRoutes = require("./routes/users");
const studyRoutes = require("./routes/study");

const app = express();


app.use(cors());
app.use(express.json());
app.use("/", userRoutes);


app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.use("/topics", topicRoutes);
app.use("/study", studyRoutes);

module.exports = app;