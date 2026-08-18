import { useState } from "react";
import "./SearchPage.css";
import StudyCard from "../../components/StudyCard/StudyCard";
import AuthPromptModal from "../../components/AuthPromptModal/AuthPromptModal";

const exampleTopics = [
  {
    title: "React",
    simpleDefinition:
      "React is a JavaScript library for building interactive user interfaces out of reusable components.",
  },
  {
    title: "Photosynthesis",
    simpleDefinition:
      "Photosynthesis is the process plants use to turn sunlight, water, and carbon dioxide into energy and oxygen.",
  },
  {
    title: "The French Revolution",
    simpleDefinition:
      "The French Revolution was a period of major political upheaval in France that overthrew the monarchy and reshaped the country.",
  },
];

function SearchPage({ onSaveTopic, isLoggedIn, onSignup, onSignin }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [topicResult, setTopicResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  async function handleSearchSubmit(e) {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError("Please enter a topic to search.");
      setTopicResult(null);
      return;
    }
    setIsLoading(true);
    setError("");
    setShowAuthModal(false);
    setAutoSaved(false);

    try {
      const cleanedQuery = searchQuery.trim().replace(/[.,!?]+$/, "");
      const token = localStorage.getItem("jwt");
      const headers = { "Content-Type": "application/json" };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("https://software-engineering-study-tracker.onrender.com/study/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          term: cleanedQuery,
        }),
      });

      if (!response.ok) {
        throw new Error("Topic not found.");
      }

      const data = await response.json();

      setTopicResult(data.studyGuide);
    } catch (err) {
      console.log(err);
      setTopicResult(null);
      setError("Something went wrong. Please try another search.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSaveTopic(topic) {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return Promise.reject(new Error("Sign in required to save"));
    }

    return onSaveTopic(topic);
  }

  async function handleAuthSuccess() {
    try {
      await onSaveTopic(topicResult);
      setAutoSaved(true);
    } catch (err) {
      console.error("Failed to save topic after signup:", err);
    } finally {
      setShowAuthModal(false);
    }
  }

  return (
    <section className="home">
      <h1 className="home__title">Search Topics</h1>
      <p className="home__description">
        Search for any topic you want to learn and turn it into a study card.
      </p>
      <form className="home__form" onSubmit={handleSearchSubmit}>
        <input
          className="home__input"
          type="text"
          placeholder='Try "React", "Photosynthesis", or "The French Revolution"'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="home__button" type="submit">
          Search
        </button>
      </form>

      {isLoading && <p className="home__loading">Loading...</p>}

      {error && <p className="home__error">{error}</p>}

      {topicResult && (
        <StudyCard
          topic={topicResult}
          onSaveTopic={handleSaveTopic}
          isSavedExternally={autoSaved}
        />
      )}

      {showAuthModal && (
        <AuthPromptModal
          onSignup={onSignup}
          onSignin={onSignin}
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {!topicResult && (
        <section className="home__examples" aria-label="Example topics">
          <p className="home__examples-label">
            See what a study card looks like — try one:
          </p>
          <div className="home__examples-grid">
            {exampleTopics.map((topic) => (
              <button
                key={topic.title}
                type="button"
                className="home__example-card"
                onClick={() => setSearchQuery(topic.title)}
              >
                <span className="home__example-title">{topic.title}</span>
                <span className="home__example-simple">
                  <span className="home__example-simple-label">
                    Simple Definition
                  </span>
                  <span className="home__example-simple-text">
                    {topic.simpleDefinition}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

export default SearchPage;
