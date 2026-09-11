const path = require("path");

// Loaded by real location, not by whatever directory the command is run
// from -- dotenv's default config() resolves ".env" relative to
// process.cwd(), which silently loads nothing (and leaves MONGODB_URI
// undefined) if this script isn't run from inside backend/ specifically.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const LearnerProfile = require("../models/learnerProfile");

// Read-only report: how many real users have actually touched their
// Learner Profile versus how many are still sitting on every default.
// Written August 25, 2026 right after the Settings page shipped; updated
// August 28, 2026 to also count studentStage/primaryInterest -- the
// guiding-questions answers added by Session 10 -- as real customization,
// same as the original preference fields.
function isDefaultProfile(profile) {
  const hasDifficulty = Boolean(profile.preferredDifficulty);
  const hasPacing = Boolean(profile.learningPreferences?.pacing);
  const hasExplanationStyle = Boolean(profile.learningPreferences?.explanationStyle);
  const hasNonDefaultAccessibility =
    profile.accessibilityPreferences?.reduceMotion === true ||
    profile.accessibilityPreferences?.largerText === true ||
    profile.accessibilityPreferences?.sectionsCollapsedByDefault === false;
  const hasStudentStage = Boolean(profile.studentStage);
  const hasPrimaryInterest = Boolean(profile.primaryInterest);

  return !(
    hasDifficulty ||
    hasPacing ||
    hasExplanationStyle ||
    hasNonDefaultAccessibility ||
    hasStudentStage ||
    hasPrimaryInterest
  );
}

async function report() {
  await mongoose.connect(process.env.MONGODB_URI);

  const profiles = await LearnerProfile.find({});
  const total = profiles.length;
  const customized = profiles.filter((p) => !isDefaultProfile(p));
  const stillDefault = total - customized.length;

  console.log(`Total learner profiles: ${total}`);
  console.log(`Still fully default: ${stillDefault}`);
  console.log(`Customized (at least one real setting changed): ${customized.length}`);

  if (customized.length > 0) {
    console.log("\nWhat's been customized:");
    customized.forEach((p) => {
      const bits = [];
      if (p.preferredDifficulty) bits.push(`difficulty=${p.preferredDifficulty}`);
      if (p.learningPreferences?.pacing) bits.push(`pacing=${p.learningPreferences.pacing}`);
      if (p.learningPreferences?.explanationStyle) bits.push(`style=${p.learningPreferences.explanationStyle}`);
      if (p.accessibilityPreferences?.reduceMotion) bits.push("reduceMotion=true");
      if (p.accessibilityPreferences?.largerText) bits.push("largerText=true");
      if (p.accessibilityPreferences?.sectionsCollapsedByDefault === false) bits.push("sectionsCollapsedByDefault=false");
      if (p.studentStage) bits.push(`studentStage=${p.studentStage}`);
      if (p.primaryInterest) bits.push(`primaryInterest=${p.primaryInterest}`);
      console.log(`  - user ${p.user}: ${bits.join(", ")}`);
    });
  }

  await mongoose.disconnect();
}

report().catch((err) => {
  console.error(err);
  process.exit(1);
});
