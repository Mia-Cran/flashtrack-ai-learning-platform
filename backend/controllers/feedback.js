const Feedback = require("../models/feedback");
const { isTextBlocked } = require("../utils/moderation");

const createFeedback = async (req, res) => {
  const { message, contactEmail } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).send({ message: "Feedback message is required" });
  }

  try {
    const isBlocked = await isTextBlocked(message);

    if (isBlocked) {
      return res.status(400).send({
        message:
          "This feedback couldn't be posted. Please rephrase and try again.",
      });
    }

    // req.user is only ever set when the request carried a valid token --
    // feedback itself stays open to anonymous visitors (see optionalAuth on
    // the route). A logged-in submitter's contact email is never taken, since
    // their account is already the contact; an anonymous submitter's email is
    // optional and, like `user`, never returned by the API -- see getFeedback.
    const feedback = await Feedback.create({
      message: message.trim(),
      user: req.user?._id,
      contactEmail: req.user ? undefined : contactEmail || undefined,
    });

    // Echo back only the fields that are safe to show publicly. Even though
    // this response goes straight to the person who just submitted it, never
    // include user/contactEmail here -- keeps the frontend from ever having
    // an identity field in hand to accidentally render.
    return res.status(201).send({
      _id: feedback._id,
      message: feedback.message,
      createdAt: feedback.createdAt,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).send({ message: "Failed to submit feedback" });
  }
};

const getFeedback = (req, res) => {
  Feedback.find()
    .select("message createdAt")
    .sort({ createdAt: -1 })
    .then((feedback) => {
      res.status(200).send(feedback);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send({ message: "Error getting feedback" });
    });
};

module.exports = {
  createFeedback,
  getFeedback,
};
