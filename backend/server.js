require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
require("dotenv").config();

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