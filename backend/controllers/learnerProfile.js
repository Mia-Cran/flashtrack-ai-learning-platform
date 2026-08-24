const LearnerProfile = require("../models/learnerProfile");

const getLearnerProfile = (req, res) => {
  LearnerProfile.findOne({ user: req.user._id })
    .then((profile) => {
      if (profile) {
        return profile;
      }

      return LearnerProfile.create({ user: req.user._id });
    })
    .then((profile) => {
      res.status(200).send(profile);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send({ message: "Error getting learner profile" });
    });
};

const updateLearnerProfile = (req, res) => {
  const { preferredDifficulty, learningPreferences, accessibilityPreferences } =
    req.body;

  const update = {};

  if (preferredDifficulty !== undefined) {
    update.preferredDifficulty = preferredDifficulty;
  }

  if (learningPreferences !== undefined) {
    update.learningPreferences = learningPreferences;
  }

  if (accessibilityPreferences !== undefined) {
    update.accessibilityPreferences = accessibilityPreferences;
  }

  LearnerProfile.findOneAndUpdate({ user: req.user._id }, update, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  })
    .then((profile) => {
      res.status(200).send(profile);
    })
    .catch((err) => {
      console.error(err);

      if (err.name === "ValidationError") {
        return res.status(400).send({
          message: "Invalid learner profile data",
        });
      }

      res.status(500).send({ message: "Error updating learner profile" });
    });
};

module.exports = {
  getLearnerProfile,
  updateLearnerProfile,
};
