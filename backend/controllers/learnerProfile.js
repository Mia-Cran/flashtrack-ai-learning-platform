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
  const {
    preferredDifficulty,
    learningPreferences,
    accessibilityPreferences,
    studentStage,
    primaryInterest,
  } = req.body;

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

  // Answers to the guiding questions (Phase 3, Session 10 design) -- saved
  // the same way as every other preference here, so a learner never has to
  // re-answer once they have.
  if (studentStage !== undefined) {
    update.studentStage = studentStage;
  }

  if (primaryInterest !== undefined) {
    update.primaryInterest = primaryInterest;
  }

  // Wrapped in $set so this only touches the fields being updated — without it,
  // MongoDB treats a plain object as a full replacement document and would wipe
  // out `user` and every other field not included in this request.
  LearnerProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: update },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  )
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
