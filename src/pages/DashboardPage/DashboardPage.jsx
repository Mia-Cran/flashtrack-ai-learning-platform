import "./DashboardPage.css";
import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router";
import {
  IconQuote,
  IconFlame,
  IconBookmark,
  IconSearch,
  IconBookmarks,
  IconTrophy,
} from "@tabler/icons-react";
import { getSavedAt } from "../../utils/topicTimestamps";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_TOPICS_LIMIT = 4;

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
// Session 8): which subject a learner actually studies most, derived
// straight from their existing saved topics -- no new field to store or
// keep in sync, since getTopics already returns each topic's subject
// populated. This is the input Session 9's recommendation feature will
// build on top of.
function getTopSubject(savedTopics) {
  const countsByName = {};

  savedTopics.forEach((topic) => {
    // Prefer the curated Subject (assigned since the Multisubject Foundation
    // shipped), but fall back to the AI-generated category for older saved
    // topics that predate Subjects entirely -- every topic has always had a
    // category, so this keeps the stat meaningful on every account, not
    // just ones with newer saves.
    const name = topic.subject?.name || topic.category;

    if (!name) {
      return;
    }

    countsByName[name] = (countsByName[name] || 0) + 1;
  });

  const entries = Object.entries(countsByName);

  if (entries.length === 0) {
    return null;
  }

  const [name, count] = entries.reduce((best, entry) =>
    entry[1] > best[1] ? entry : best,
  );

  return { name, count };
}

function DashboardPage({ isLoggedIn, userName, savedTopics = [] }) {
  const [quote, setQuote] = useState("");
  const [isQuoteLoading, setIsQuoteLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    fetch("https://software-engineering-study-tracker.onrender.com/quote/daily")
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

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const totalSaved = savedTopics.length;
  const dayStreak = getDayStreak(savedTopics);
  const recentTopics = getRecentTopics(savedTopics);
  const topSubject = getTopSubject(savedTopics);

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

        {topSubject && (
          <div className="dashboard__stat">
            <IconTrophy
              size={22}
              stroke={1.75}
              className="dashboard__stat-icon dashboard__stat-icon--green"
              aria-hidden="true"
            />
            <span className="dashboard__stat-value">{topSubject.count}</span>
            <span className="dashboard__stat-label">
              Top Subject: {topSubject.name}
            </span>
          </div>
        )}
      </div>

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
