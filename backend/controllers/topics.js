const Topic = require("../models/topic");
const Subject = require("../models/subject");
const LearnerProfile = require("../models/learnerProfile");
const { generateStudyGuide, DIFFICULTY_LEVELS } = require("../utils/studyGuide");

const getTopics = (req, res) => {
  const filter = { owner: req.user._id };

  // GET /topics?term=recursion narrows to the caller's saved copy of that
  // term. The frontend uses this after a 409 on save to fetch the existing one.
  if (typeof req.query.term === "string" && req.query.term.trim()) {
    filter.normalizedTerm = req.query.term.trim().toLowerCase();
  }

  Topic.find(filter)
    .populate("subject")
    .then((topics) => {
      res.send(topics);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send({ message: "Error getting topics" });
    });
};

const getTopicById = (req, res) => {
  const { id } = req.params;

  Topic.findOne({
    _id: id,
    owner: req.user._id,
  })
    .populate("subject")
    .then((topic) => {
      if (!topic) {
        return res.status(404).send({ message: "Topic not found" });
      }

      return res.send(topic);
    })
    .catch((err) => {
      console.error(err);

      if (err.name === "CastError") {
        return res.status(400).send({ message: "Invalid topic id" });
      }

      return res.status(500).send({ message: "Error getting topic" });
    });
};

const deleteTopic = (req, res) => {
  const { id } = req.params;

  Topic.findOneAndDelete({
    _id: id,
    owner: req.user._id,
  })
    .then((topic) => {
      if (!topic) {
        return res.status(404).send({ message: "Topic not found" });
      }

      return res.send({ message: "Topic deleted" });
    })
    .catch((err) => {
      console.error(err);

      if (err.name === "CastError") {
        return res.status(400).send({ message: "Invalid topic id" });
      }

      return res.status(500).send({ message: "Error deleting topic" });
    });
};

const updateTopic = (req, res) => {
  const { id } = req.params;

  Topic.findOneAndUpdate(
    {
      _id: id,
      owner: req.user._id,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("subject")
    .then((topic) => {
      if (!topic) {
        return res.status(404).send({ message: "Topic not found" });
      }

      return res.send(topic);
    })
    .catch((err) => {
      console.error(err);

      if (err.name === "CastError") {
        return res.status(400).send({ message: "Invalid topic id" });
      }

      return res.status(500).send({ message: "Error updating topic" });
    });
};

const createTopic = (req, res) => {
  const {
    term,
    searchTerm,
    simpleDefinition,
    beginnerDefinition,
    technicalDefinition,
    analogy,
    codeExample,
    commonMistake,
    relatedTopics,
    category,
    difficulty,
    subject,
  } = req.body;

  if (typeof term !== "string" || !term.trim()) {
    return res.status(400).send({ message: "A term is required" });
  }

  const cleanedTerm = term.trim();
  const normalizedTerm = (searchTerm || term).trim().toLowerCase();

  return Topic.findOne({
    normalizedTerm,
    owner: req.user._id,
  })
    .then((existingTopic) => {
      if (existingTopic) {
        return res.status(409).send({
          message: "Topic already saved",
        });
      }

      return Topic.create({
        term: cleanedTerm,
        normalizedTerm,
        simpleDefinition,
        beginnerDefinition,
        technicalDefinition,
        category,
        difficulty,
        analogy,
        codeExample,
        commonMistake,
        relatedTopics,
        subject,
        owner: req.user._id,
      }).then((topic) => {
        return topic.populate("subject");
      }).then((topic) => {
        return res.status(201).send(topic);
      });
    })
    .catch((err) => {
      console.error(err);

      if (err.name === "ValidationError") {
        return res.status(400).send({
          message: "Invalid topic data",
        });
      }

      return res.status(500).send({
        message: "Error creating topic",
      });
    });
};

const regenerateTopic = async (req, res) => {
  const { id } = req.params;
  const { difficulty } = req.body;

  if (!DIFFICULTY_LEVELS.includes(difficulty)) {
    return res.status(400).send({
      message: "Valid difficulty level is required (Beginner, Intermediate, or Advanced)",
    });
  }

  try {
    const topic = await Topic.findOne({ _id: id, owner: req.user._id });

    if (!topic) {
      return res.status(404).send({ message: "Topic not found" });
    }

    const subjects = await Subject.find({ isActive: true }).sort({ sortOrder: 1 });
    const learnerProfile = await LearnerProfile.findOne({ user: req.user._id });

    // Same prompt and model as a fresh search, just pinned to the level the
    // student picked. See utils/studyGuide.js.
    const { studyGuide, matchedSubject } = await generateStudyGuide({
      term: topic.term,
      subjects,
      learnerProfile,
      difficulty,
    });

    if (!studyGuide) {
      return res.status(400).send({ message: "This topic could not be regenerated" });
    }

    topic.simpleDefinition = studyGuide.simpleDefinition;
    topic.beginnerDefinition = studyGuide.beginnerExplanation;
    topic.technicalDefinition = studyGuide.technicalDefinition;
    topic.analogy = studyGuide.analogy;
    topic.codeExample = studyGuide.codeExample;
    topic.commonMistake = studyGuide.commonMistake;
    topic.category = studyGuide.category;
    // The student asked for this level; keep it even if the model would
    // rate the topic differently on its own.
    topic.difficulty = difficulty;
    topic.relatedTopics = studyGuide.relatedTopics;
    if (matchedSubject) {
      topic.subject = matchedSubject._id;
    }

    const updatedTopic = await topic.save();
    await updatedTopic.populate("subject");

    return res.send(updatedTopic);
  } catch (err) {
    console.error(err);

    if (err.name === "CastError") {
      return res.status(400).send({ message: "Invalid topic id" });
    }

    return res.status(500).send({ message: "Error regenerating topic" });
  }
};

module.exports = {
  getTopics,
  createTopic,
  getTopicById,
  deleteTopic,
  updateTopic,
  regenerateTopic,
};
