const Topic = require("../models/topic");

const getTopics = (req, res) => {
  Topic.find({ owner: req.user._id })
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
    simpleDefinition,
    beginnerDefinition,
    technicalDefinition,
    category,
    difficulty,
  } = req.body;
   
  const cleanedTerm = term.trim();
  const normalizedTerm = cleanedTerm.toLowerCase();

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
        owner: req.user._id,
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

module.exports = {
  getTopics,
  createTopic,
  getTopicById,
  deleteTopic,
  updateTopic,
};
