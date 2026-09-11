// Progress tracking: quiz scores over time, plus strengths / struggles.
// Strengths and struggles only come from real quiz results — never from
// "saved a lot of cards" or other proxies (see LearnerProfile model notes).

const UserQuizResponse = require("../models/userQuizResponse");
const LearnerProfile = require("../models/learnerProfile");

const STRENGTH_PERCENT = 80;
const STRUGGLE_PERCENT = 60;

function percent(score, maxScore) {
  if (!maxScore) return 0;
  return Math.round((score / maxScore) * 100);
}

// After a quiz submit, recompute which subjects this learner is strong /
// struggling in from their latest score per topic.
async function refreshStrengthsAndStruggles(userId) {
  const attempts = await UserQuizResponse.find({ user: userId })
    .sort({ completedAt: -1 })
    .populate({
      path: "quiz",
      populate: { path: "topic", select: "term subject" },
    })
    .lean();

  // Latest attempt per topic (attempts are newest-first).
  const latestByTopic = new Map();
  for (const attempt of attempts) {
    const topic = attempt.quiz?.topic;
    if (!topic?._id) continue;
    const topicKey = String(topic._id);
    if (latestByTopic.has(topicKey)) continue;
    latestByTopic.set(topicKey, attempt);
  }

  // Average latest-topic percent by subject.
  const bySubject = new Map();
  for (const attempt of latestByTopic.values()) {
    const subjectId = attempt.quiz?.topic?.subject;
    if (!subjectId) continue;
    const key = String(subjectId);
    const entry = bySubject.get(key) || { subjectId, percents: [] };
    entry.percents.push(percent(attempt.score, attempt.maxScore));
    bySubject.set(key, entry);
  }

  const strengths = [];
  const areasOfStruggle = [];

  for (const { subjectId, percents } of bySubject.values()) {
    const avg = percents.reduce((a, b) => a + b, 0) / percents.length;
    if (avg >= STRENGTH_PERCENT) {
      strengths.push(subjectId);
    } else if (avg < STRUGGLE_PERCENT) {
      areasOfStruggle.push(subjectId);
    }
  }

  await LearnerProfile.findOneAndUpdate(
    { user: userId },
    { $set: { strengths, areasOfStruggle } },
    { upsert: true },
  );

  return { strengths, areasOfStruggle };
}

// Owner-scoped list of past attempts for one quiz (scores only — no answer key).
async function listQuizAttempts(userId, quizId) {
  const attempts = await UserQuizResponse.find({ user: userId, quiz: quizId })
    .sort({ completedAt: -1 })
    .select("difficulty score maxScore completedAt")
    .lean();

  return attempts.map((attempt) => ({
    _id: attempt._id,
    difficulty: attempt.difficulty,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percent: percent(attempt.score, attempt.maxScore),
    completedAt: attempt.completedAt,
  }));
}

// Dashboard summary: latest score per topic + strengths / struggles.
async function getProgressSummary(userId) {
  const attempts = await UserQuizResponse.find({ user: userId })
    .sort({ completedAt: -1 })
    .populate({
      path: "quiz",
      populate: {
        path: "topic",
        select: "term subject",
        populate: { path: "subject", select: "name" },
      },
    })
    .lean();

  const topics = [];
  const seenTopics = new Set();

  for (const attempt of attempts) {
    const topic = attempt.quiz?.topic;
    if (!topic?._id) continue;
    const topicKey = String(topic._id);
    if (seenTopics.has(topicKey)) continue;
    seenTopics.add(topicKey);

    const sameTopic = attempts.filter(
      (entry) => String(entry.quiz?.topic?._id) === topicKey,
    );
    const best = sameTopic.reduce(
      (winner, entry) =>
        percent(entry.score, entry.maxScore) >
        percent(winner.score, winner.maxScore)
          ? entry
          : winner,
      sameTopic[0],
    );

    let trend = "first";
    if (sameTopic.length >= 2) {
      const latestPct = percent(sameTopic[0].score, sameTopic[0].maxScore);
      const previousPct = percent(sameTopic[1].score, sameTopic[1].maxScore);
      if (latestPct > previousPct) trend = "improving";
      else if (latestPct < previousPct) trend = "slipping";
      else trend = "steady";
    }

    topics.push({
      topicId: topic._id,
      quizId: attempt.quiz._id,
      term: topic.term,
      subjectName: topic.subject?.name || null,
      attemptCount: sameTopic.length,
      lastScore: attempt.score,
      lastMaxScore: attempt.maxScore,
      lastPercent: percent(attempt.score, attempt.maxScore),
      lastDifficulty: attempt.difficulty,
      lastCompletedAt: attempt.completedAt,
      bestPercent: percent(best.score, best.maxScore),
      trend,
    });
  }

  const profile = await LearnerProfile.findOne({ user: userId })
    .populate("strengths", "name")
    .populate("areasOfStruggle", "name")
    .lean();

  return {
    topics,
    strengths: (profile?.strengths || []).map((subject) => ({
      _id: subject._id,
      name: subject.name,
    })),
    areasOfStruggle: (profile?.areasOfStruggle || []).map((subject) => ({
      _id: subject._id,
      name: subject.name,
    })),
    totals: {
      attemptCount: attempts.length,
      topicsPracticed: topics.length,
    },
  };
}

module.exports = {
  STRENGTH_PERCENT,
  STRUGGLE_PERCENT,
  percent,
  refreshStrengthsAndStruggles,
  listQuizAttempts,
  getProgressSummary,
};
