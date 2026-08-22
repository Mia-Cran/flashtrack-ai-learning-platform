require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("../models/subject");

const subjects = [
  { name: "Software Engineering", slug: "software-engineering", sortOrder: 1 },
  { name: "Mathematics", slug: "mathematics", sortOrder: 2 },
  { name: "Science", slug: "science", sortOrder: 3 },
  { name: "History", slug: "history", sortOrder: 4 },
  { name: "English", slug: "english", sortOrder: 5 },
  { name: "Languages", slug: "languages", sortOrder: 6 },
  { name: "Social Studies/Government", slug: "social-studies-government", sortOrder: 7 },
  { name: "Test Prep", slug: "test-prep", sortOrder: 8 },
  { name: "Business/Finance", slug: "business-finance", sortOrder: 9 },
  { name: "Arts", slug: "arts", sortOrder: 10 },
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
