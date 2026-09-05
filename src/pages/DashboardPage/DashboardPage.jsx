import "./DashboardPage.css";
import { API_BASE_URL } from "../../utils/api";
import { useEffect, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router";
import {
  IconQuote,
  IconFlame,
  IconBookmark,
  IconSearch,
  IconBookmarks,
  IconBooks,
  IconSparkles,
  IconBulb,
  IconSchool,
} from "@tabler/icons-react";
import { getSavedAt } from "../../utils/topicTimestamps";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_TOPICS_LIMIT = 4;
const RECOMMENDATIONS_LIMIT = 4;
const QUIZ_UNLOCK_COUNT = 5;

const STAGE_OPTIONS = [
  { value: "k12", label: "K-12 Student" },
  { value: "college", label: "College Student" },
  { value: "trade", label: "Trade / Vocational Program" },
  { value: "testPrep", label: "Studying for a Test" },
  { value: "exploring", label: "Just Exploring" },
];

function toDateKey(ms) {
  const date = new Date(ms);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDayStreak(savedTopics) {
  const dateKeys = new Set(
    savedTopics
      .map((topic) => getSavedAt(topic._id))
      .filter((ms) => ms !== null)
      .map(toDateKey),
  );

  if (dateKeys.size === 0) {
    return 0;
  }

  let cursor = Date.now();

  if (!dateKeys.has(toDateKey(cursor))) {
    cursor -= ONE_DAY_MS;
  }

  let streak = 0;

  while (dateKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor -= ONE_DAY_MS;
  }

  return streak;
}

function getRecentTopics(savedTopics) {
  return [...savedTopics]
    .sort((a, b) => (getSavedAt(b._id) ?? 0) - (getSavedAt(a._id) ?? 0))
    .slice(0, RECENT_TOPICS_LIMIT);
}

// The first real "adaptive learning" signal (Version 3.0 roadmap item 3,
// Session 8/9): how many distinct subjects a learner is actually studying
// across, derived straight from their existing saved topics -- no new field
// to store or keep in sync, since getTopics already returns each topic's
// subject populated. Started as a single "Top Subject" stat, but that
// couldn't answer a real question -- a learner juggling several subjects at
// once (e.g. studying for a test) has no way to see that spread from one
// top pick alone -- so this counts the full spread instead, and links
// through to the Subjects page (Session 9) that breaks it down.
function getSubjectNames(savedTopics) {
  const names = new Set();

  savedTopics.forEach((topic) => {
    // Prefer the curated Subject (assigned since the Multisubject Foundation
    // shipped), but fall back to the AI-generated category for older saved
    // topics that predate Subjects entirely -- every topic has always had a
    // category, so this keeps the stat meaningful on every account, not
    // just ones with newer saves.
    const name = topic.subject?.name || topic.category;

    if (name) {
      names.add(name);
    }
  });

  return names;
}

// Session 10, entry point 1: for learners who already have saved-topic
// history, recommend topics pulled straight from the related-topics lists
// the AI already generates on every study card -- no separate recommendation
// engine needed. Dedupes against what's already saved (case-insensitive,
// since a learner might save "React" and a related list might surface
// "react") and against repeats across multiple saved topics' related lists.
function getRecommendations(savedTopics) {
  const savedTermsLower = new Set(
    savedTopics.map((topic) => topic.term.trim().toLowerCase()),
  );
  const seen = new Set();
  const recommendations = [];

  savedTopics.forEach((topic) => {
    (topic.relatedTopics ?? []).forEach((related) => {
      const key = related.trim().toLowerCase();

      if (!key || savedTermsLower.has(key) || seen.has(key)) {
        return;
      }

      seen.add(key);
      recommendations.push(related);
    });
  });

  return recommendations.slice(0, RECOMMENDATIONS_LIMIT);
}

function DashboardPage({
  isLoggedIn,
  userName,
  savedTopics = [],
  learnerProfile,
  onUpdateLearnerProfile = () => Promise.resolve(),
}) {
  const [quote, setQuote] = useState("");
  const [isQuoteLoading, setIsQuoteLoading] = useState(true);
  const [interestInput, setInterestInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [skippedInterestPrompt, setSkippedInterestPrompt] = useState(false);
  const [quizLoadingId, setQuizLoadingId] = useState(null);
  const [quizError, setQuizError] = useState("");
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [progress, setProgress] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    fetch(`${API_BASE_URL}/quote/daily`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load quote");
        }

        return res.json();
      })
      .then((data) => {
        setQuote(data.quote);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsQuoteLoading(false);
      });
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const token = localStorage.getItem("jwt");
    if (!token) {
      return;
    }

    fetch(`${API_BASE_URL}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setProgress(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const totalSaved = savedTopics.length;
  const dayStreak = getDayStreak(savedTopics);
  const recentTopics = getRecentTopics(savedTopics);
  const subjectCount = getSubjectNames(savedTopics).size;
  const recommendations = getRecommendations(savedTopics);

  function handleStageSelect(stage) {
    setIsSavingProfile(true);

    onUpdateLearnerProfile({ studentStage: stage })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsSavingProfile(false);
      });
  }

  function handleInterestSubmit(e) {
    e.preventDefault();
    const trimmed = interestInput.trim();

    if (!trimmed) {
      return;
    }

    setIsSavingProfile(true);

    onUpdateLearnerProfile({ primaryInterest: trimmed })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsSavingProfile(false);
      });
  }

  async function handleTakeTopicQuiz(topicId) {
    setQuizLoadingId(topicId);
    setQuizError("");

    try {
      const token = localStorage.getItem("jwt");
      const headers = { "Content-Type": "application/json" };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/quizzes/${topicId}/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ questionType: "multipleChoice" }),
      });

      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || `Could not load quiz (error ${res.status})`,
        );
      }

      navigate(`/quiz/${topicId}`);
    } catch (err) {
      console.error(err);
      setQuizError(err.message || "Could not start that quiz. Please try again.");
    } finally {
      setQuizLoadingId(null);
    }
  }

  async function handleStartReviewQuiz() {
    setIsStartingReview(true);
    setQuizError("");

    try {
      const token = localStorage.getItem("jwt");
      const headers = { "Content-Type": "application/json" };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/quizzes/review/generate`, {
        method: "POST",
        headers,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message || `Could not start review quiz (error ${res.status})`,
        );
      }

      navigate(`/quiz/review/${data._id}`);
    } catch (err) {
      console.error(err);
      setQuizError(
        err.message || "Could not start the review quiz. Please try again.",
      );
    } finally {
      setIsStartingReview(false);
    }
  }

  const quizzesUnlocked = totalSaved >= QUIZ_UNLOCK_COUNT;
  const quizTopics = [...savedTopics].sort(
    (a, b) => (getSavedAt(b._id) ?? 0) - (getSavedAt(a._id) ?? 0),
  );

  return (
    <section className="dashboard">
      <h1 className="dashboard__title">Your Dashboard</h1>
      <p className="dashboard__subtitle">
        {userName ? `Here's where things stand, ${userName}.` : "Here's where things stand."}
      </p>

      {!isQuoteLoading && quote && (
        <div className="dashboard__quote">
          <IconQuote
            size={22}
            stroke={1.75}
            className="dashboard__quote-icon"
            aria-hidden="true"
          />
          <p className="dashboard__quote-text">{quote}</p>
        </div>
      )}

      <div className="dashboard__stats">
        <div className="dashboard__stat">
          <IconBookmark
            size={22}
            stroke={1.75}
            className="dashboard__stat-icon dashboard__stat-icon--green"
            aria-hidden="true"
          />
          <span className="dashboard__stat-value">{totalSaved}</span>
          <span className="dashboard__stat-label">
            {totalSaved === 1 ? "Topic saved" : "Topics saved"}
          </span>
        </div>

        <div className="dashboard__stat">
          <IconFlame
            size={22}
            stroke={1.75}
            className="dashboard__stat-icon dashboard__stat-icon--pink"
            aria-hidden="true"
          />
          <span className="dashboard__stat-value">{dayStreak}</span>
          <span className="dashboard__stat-label">
            {dayStreak === 1 ? "Day streak" : "Day streak"}
          </span>
        </div>

        {subjectCount > 0 && (
          <Link to="/subjects" className="dashboard__stat dashboard__stat--link">
            <IconBooks
              size={22}
              stroke={1.75}
              className="dashboard__stat-icon dashboard__stat-icon--green"
              aria-hidden="true"
            />
            <span className="dashboard__stat-value">{subjectCount}</span>
            <span className="dashboard__stat-label">
              {subjectCount === 1 ? "Subject" : "Subjects"}
            </span>
          </Link>
        )}
      </div>

      {(progress?.totals?.attemptCount > 0 ||
        progress?.strengths?.length > 0 ||
        progress?.areasOfStruggle?.length > 0) && (
        <section className="dashboard__progress" aria-label="Your quiz progress">
          <h2 className="dashboard__section-heading">Your Progress</h2>

          {(progress.strengths.length > 0 ||
            progress.areasOfStruggle.length > 0) && (
            <div className="dashboard__progress-signals">
              {progress.strengths.length > 0 && (
                <div className="dashboard__progress-signal dashboard__progress-signal--strength">
                  <h3 className="dashboard__progress-signal-title">Strengths</h3>
                  <p className="dashboard__progress-signal-list">
                    {progress.strengths.map((subject) => subject.name).join(", ")}
                  </p>
                </div>
              )}
              {progress.areasOfStruggle.length > 0 && (
                <div className="dashboard__progress-signal dashboard__progress-signal--struggle">
                  <h3 className="dashboard__progress-signal-title">
                    Needs practice
                  </h3>
                  <p className="dashboard__progress-signal-list">
                    {progress.areasOfStruggle
                      .map((subject) => subject.name)
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          {progress.topics.length > 0 && (
            <ul className="dashboard__progress-list">
              {progress.topics.slice(0, 6).map((topic) => (
                <li className="dashboard__progress-item" key={topic.topicId}>
                  <div className="dashboard__progress-item-copy">
                    <span className="dashboard__progress-item-title">
                      {topic.term}
                    </span>
                    <span className="dashboard__progress-item-meta">
                      Last {topic.lastScore}/{topic.lastMaxScore} (
                      {topic.lastPercent}%)
                      {topic.trend === "improving" && " · improving"}
                      {topic.trend === "slipping" && " · slipping"}
                      {topic.attemptCount > 1 &&
                        ` · ${topic.attemptCount} tries`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="dashboard__recent" aria-label="Recently saved topics">
        <h2 className="dashboard__section-heading">Recently Saved</h2>

        {recentTopics.length === 0 ? (
          <p className="dashboard__empty">
            No saved topics yet — search for something to get started.
          </p>
        ) : (
          <div className="dashboard__recent-grid">
            {recentTopics.map((topic) => (
              <div className="dashboard__recent-card" key={topic._id}>
                <span className="dashboard__recent-title">{topic.term}</span>
                <span className="dashboard__recent-simple">
                  {topic.simpleDefinition}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard__quizzes" aria-label="Quizzes by topic">
        <h2 className="dashboard__section-heading">
          <IconSchool size={20} stroke={1.75} aria-hidden="true" />
          Quizzes by Topic
        </h2>

        {!quizzesUnlocked ? (
          <div className="dashboard__quiz-locked">
            <p className="dashboard__quiz-locked-text">
              Save {QUIZ_UNLOCK_COUNT} flashcards to unlock a review quiz across
              those cards. Missed topics get a focused practice quiz next.
            </p>
            <div
              className="dashboard__quiz-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={QUIZ_UNLOCK_COUNT}
              aria-valuenow={totalSaved}
              aria-label={`${totalSaved} of ${QUIZ_UNLOCK_COUNT} topics saved`}
            >
              <div
                className="dashboard__quiz-progress-fill"
                style={{
                  width: `${Math.min(100, (totalSaved / QUIZ_UNLOCK_COUNT) * 100)}%`,
                }}
              />
            </div>
            <p className="dashboard__quiz-progress-label">
              {totalSaved} / {QUIZ_UNLOCK_COUNT} saved
            </p>
            <Link to="/search" className="dashboard__link dashboard__link--primary">
              <IconSearch size={18} stroke={2} aria-hidden="true" />
              Save more topics
            </Link>
          </div>
        ) : (
          <>
            <div className="dashboard__review-cta">
              <p className="dashboard__quiz-intro">
                Ready for a mixed review? We&apos;ll ask one multiple-choice
                question from each of your recent cards (up to 10). Topics you
                miss unlock a focused practice quiz.
              </p>
              <button
                type="button"
                className="dashboard__quiz-button dashboard__quiz-button--review"
                onClick={handleStartReviewQuiz}
                disabled={isStartingReview}
                aria-busy={isStartingReview}
              >
                {isStartingReview
                  ? "Building your review..."
                  : "Start review quiz"}
              </button>
            </div>

            {quizError && (
              <p className="dashboard__quiz-error" role="alert">
                {quizError}
              </p>
            )}

            <h3 className="dashboard__quiz-subheading">
              Or practice one topic
            </h3>
            <ul className="dashboard__quiz-list">
              {quizTopics.map((topic) => (
                <li className="dashboard__quiz-item" key={topic._id}>
                  <div className="dashboard__quiz-item-copy">
                    <span className="dashboard__quiz-item-title">
                      {topic.term || topic.title}
                    </span>
                    {(topic.subject?.name || topic.category) && (
                      <span className="dashboard__quiz-item-meta">
                        {topic.subject?.name || topic.category}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="dashboard__quiz-button"
                    onClick={() => handleTakeTopicQuiz(topic._id)}
                    disabled={quizLoadingId === topic._id || isStartingReview}
                    aria-busy={quizLoadingId === topic._id}
                  >
                    {quizLoadingId === topic._id
                      ? "Writing quiz..."
                      : "Take Quiz"}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="dashboard__recommended" aria-label="Recommended for you">
        <h2 className="dashboard__section-heading">
          <IconSparkles size={20} stroke={1.75} aria-hidden="true" />
          Recommended for You
        </h2>

        {recommendations.length > 0 ? (
          <div className="dashboard__recommend-grid">
            {recommendations.map((term) => (
              <Link
                key={term}
                to="/search"
                state={{ searchTerm: term }}
                className="dashboard__recommend-card"
              >
                {term}
              </Link>
            ))}
          </div>
        ) : learnerProfile?.primaryInterest ? (
          <div className="dashboard__recommend-cta">
            <p className="dashboard__recommend-text">
              Ready to keep going with {learnerProfile.primaryInterest}?
            </p>
            <Link
              to="/search"
              state={{ searchTerm: learnerProfile.primaryInterest }}
              className="dashboard__link dashboard__link--primary"
            >
              <IconSearch size={18} stroke={2} aria-hidden="true" />
              Explore {learnerProfile.primaryInterest}
            </Link>
          </div>
        ) : learnerProfile?.studentStage && !skippedInterestPrompt ? (
          <form
            className="dashboard__recommend-form"
            onSubmit={handleInterestSubmit}
          >
            <label
              htmlFor="dashboard-interest-input"
              className="dashboard__recommend-label"
            >
              What are you focused on studying right now?
            </label>
            <div className="dashboard__recommend-form-row">
              <input
                id="dashboard-interest-input"
                type="text"
                className="dashboard__recommend-input"
                placeholder='Try "React" or "Cellular Biology"'
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                disabled={isSavingProfile}
              />
              <button
                type="submit"
                className="dashboard__link dashboard__link--primary"
                disabled={isSavingProfile || !interestInput.trim()}
              >
                Save
              </button>
            </div>
            <button
              type="button"
              className="dashboard__recommend-skip"
              onClick={() => setSkippedInterestPrompt(true)}
            >
              Skip for now
            </button>
          </form>
        ) : !learnerProfile?.studentStage ? (
          <div className="dashboard__recommend-stage">
            <p className="dashboard__recommend-text">
              <IconBulb size={18} stroke={1.75} aria-hidden="true" />
              Tell us a bit about yourself so we can point you in the right
              direction.
            </p>
            <div className="dashboard__recommend-stage-options">
              {STAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="dashboard__recommend-stage-button"
                  onClick={() => handleStageSelect(option.value)}
                  disabled={isSavingProfile}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="dashboard__empty">
            Keep saving topics and we&apos;ll start recommending related ones
            here.
          </p>
        )}
      </section>

      <div className="dashboard__links">
        <Link to="/search" className="dashboard__link dashboard__link--primary">
          <IconSearch size={18} stroke={2} aria-hidden="true" />
          Search a New Topic
        </Link>

        <Link to="/saved" className="dashboard__link dashboard__link--secondary">
          <IconBookmarks size={18} stroke={2} aria-hidden="true" />
          View Saved Topics
        </Link>
      </div>
    </section>
  );
}

export default DashboardPage;
