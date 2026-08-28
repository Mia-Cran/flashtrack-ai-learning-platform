require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("../models/subject");

// Full list as of August 28, 2026: the original 10 (Multisubject Foundation,
// August 2026), plus 12 from a real K-12/college subject breakdown a teacher
// shared, plus 1 more ("Outdoor & Wilderness Skills") surfaced by mapping
// the Scouting America merit badge list -- see the Builder Guide in Notion
// for the full item-by-item reasoning behind every addition.
//
// exampleTopics are what show up when a student browses this subject from
// the nav dropdown instead of searching directly -- just a starting point,
// not an exhaustive or authoritative list. Safe to edit/expand any time by
// re-running this script; it upserts by slug, so existing subjects are
// updated in place rather than duplicated.
const subjects = [
  {
    name: "Software Engineering",
    slug: "software-engineering",
    sortOrder: 1,
    exampleTopics: ["React", "Git", "APIs"],
  },
  {
    name: "Mathematics",
    slug: "mathematics",
    sortOrder: 2,
    exampleTopics: ["Algebra", "The Pythagorean Theorem", "Probability"],
  },
  {
    name: "Science",
    slug: "science",
    sortOrder: 3,
    exampleTopics: ["Photosynthesis", "The Water Cycle", "Newton's Laws of Motion"],
  },
  {
    name: "History",
    slug: "history",
    sortOrder: 4,
    exampleTopics: ["The French Revolution", "World War II", "Ancient Egypt"],
  },
  {
    name: "English",
    slug: "english",
    sortOrder: 5,
    exampleTopics: ["Metaphor", "The Great Gatsby", "Persuasive Writing"],
  },
  {
    name: "Languages",
    slug: "languages",
    sortOrder: 6,
    exampleTopics: ["Spanish Verb Conjugation", "French Greetings", "ASL Alphabet"],
  },
  {
    name: "Social Studies/Government",
    slug: "social-studies-government",
    sortOrder: 7,
    exampleTopics: ["The Three Branches of Government", "The Bill of Rights", "Supply and Demand"],
  },
  {
    name: "Test Prep",
    slug: "test-prep",
    sortOrder: 8,
    exampleTopics: ["SAT Vocabulary", "The Citizenship Test", "GRE Quantitative Reasoning"],
  },
  {
    name: "Business/Finance",
    slug: "business-finance",
    sortOrder: 9,
    exampleTopics: ["Compound Interest", "Supply Chains", "What Is a Budget"],
  },
  {
    name: "Arts",
    slug: "arts",
    sortOrder: 10,
    exampleTopics: ["Color Theory", "The Renaissance", "Music Theory Basics"],
  },
  {
    name: "Health & Physical Education",
    slug: "health-physical-education",
    sortOrder: 11,
    exampleTopics: ["Cardiovascular Endurance", "Nutrition Basics", "The Rules of Basketball"],
  },
  {
    name: "Computer Science & Technology",
    slug: "computer-science-technology",
    sortOrder: 12,
    exampleTopics: ["Binary Numbers", "How the Internet Works", "Cybersecurity Basics"],
  },
  {
    name: "Engineering",
    slug: "engineering",
    sortOrder: 13,
    exampleTopics: ["Simple Machines", "Circuit Basics", "Structural Load"],
  },
  {
    name: "Career & Technical Education",
    slug: "career-technical-education",
    sortOrder: 14,
    exampleTopics: ["Basic Knife Skills", "Ohm's Law for Electricians", "Engine Fundamentals"],
  },
  {
    name: "Health Science",
    slug: "health-science",
    sortOrder: 15,
    exampleTopics: ["Vital Signs", "The Nervous System", "What Does an Occupational Therapist Do"],
  },
  {
    name: "Legal Studies",
    slug: "legal-studies",
    sortOrder: 16,
    exampleTopics: ["Due Process", "Miranda Rights", "What Is a Paralegal"],
  },
  {
    name: "Humanities",
    slug: "humanities",
    sortOrder: 17,
    exampleTopics: ["The Trolley Problem", "Stoicism", "World Religions Overview"],
  },
  {
    name: "Social Sciences",
    slug: "social-sciences",
    sortOrder: 18,
    exampleTopics: ["Classical Conditioning", "Maslow's Hierarchy of Needs", "What Is Sociology"],
  },
  {
    name: "Communication",
    slug: "communication",
    sortOrder: 19,
    exampleTopics: ["Public Speaking Basics", "Persuasive Techniques", "Active Listening"],
  },
  {
    name: "Education",
    slug: "education",
    sortOrder: 20,
    exampleTopics: ["Child Development Stages", "Classroom Management Basics", "Learning Styles"],
  },
  {
    name: "Aviation",
    slug: "aviation",
    sortOrder: 21,
    exampleTopics: ["How Airplanes Fly", "Air Traffic Control Basics", "Aircraft Instruments"],
  },
  {
    name: "Extracurriculars & Leadership",
    slug: "extracurriculars-leadership",
    sortOrder: 22,
    exampleTopics: ["What Makes a Good Leader", "Team Building Basics", "Robert's Rules of Order"],
  },
  {
    name: "Outdoor & Wilderness Skills",
    slug: "outdoor-wilderness-skills",
    sortOrder: 23,
    exampleTopics: ["Basic Knot Tying", "Reading a Compass", "Wilderness First Aid Basics"],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const subject of subjects) {
    const result = await Subject.findOneAndUpdate(
      { slug: subject.slug },
      { $set: subject },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    console.log(`Upserted: ${result.name} (${result.slug})`);
  }

  console.log(`Done. ${subjects.length} subjects seeded.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
