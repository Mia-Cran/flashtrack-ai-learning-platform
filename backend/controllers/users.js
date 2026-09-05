const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const createUser = (req, res) => {
  const { name, email, password } = req.body;

  // Check for empty fields up front: bcrypt.hash throws on undefined, which
  // would otherwise turn "you forgot the password" into a 500.
  if (!name || !email || !password) {
    return res
      .status(400)
      .send({ message: "Name, email, and password are all required" });
  }

  return bcrypt
    .hash(password, 10)
    .then((hash) =>
      User.create({
        name,
        email,
        password: hash,
      }),
    )
    .then((user) => {
      res.status(201).send({
        name: user.name,
        email: user.email,
        _id: user._id,
      });
    })
    .catch((err) => {
      // Mongo's duplicate-key error (the email has a unique index)
      if (err.code === 11000) {
        return res
          .status(409)
          .send({ message: "An account with that email already exists" });
      }

      // Mongoose schema validation (missing/invalid field)
      if (err.name === "ValidationError") {
        return res.status(400).send({ message: err.message });
      }

      console.error(err);
      return res.status(500).send({ message: "Failed to create user" });
    });
};
const login = (req, res) => {
  const { email, password } = req.body;

  return User.findOne({ email })
    .select("+password")
    .then((user) => {
      if (!user) {
        return res.status(401).send({
          message: "Invalid email or password",
        });
      }

      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          return res.status(401).send({
            message: "Invalid email or password",
          });
        }

        if (!process.env.JWT_SECRET) {
          throw new Error("JWT_SECRET is missing");
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });

        return res.send({ token, name: user.name });
      });
    })
    .catch((err) => {
      console.error("Signin error:", err);
      return res.status(500).send({
        message: "Failed to sign in",
      });
    });
};

module.exports = {
  createUser,
  login,
};
