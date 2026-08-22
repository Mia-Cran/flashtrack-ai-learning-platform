const Subject = require("../models/subject");

const getSubjects = (req, res) => {
  Subject.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .then((subjects) => {
      res.status(200).send(subjects);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send({ message: "Error getting subjects" });
    });
};

module.exports = {
  getSubjects,
};
