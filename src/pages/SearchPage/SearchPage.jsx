import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import "./SearchPage.css";
import StudyCard from "../../components/StudyCard/StudyCard";
import AuthPromptModal from "../../components/AuthPromptModal/AuthPromptModal";
import SubjectPicker from "../../components/SubjectPicker/SubjectPicker";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    () => location.state?.searchTerm ?? "",
  );
  const [topicResult, setTopicResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  async function runSearch(rawQuery) {
    const cleanedQuery = rawQuery.trim().replace(/[.,!?]+$/, "");

    if (!cleanedQuery) {
      setError("Please enter a topic to search.");
      setTopicResult(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setShowAuthModal(false);
    setAutoSaved(false);
    setIsSaved(false);

    try {
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

      setTopicResult({ ...data.studyGuide, searchTerm: cleanedQuery });
      setSelectedSubjectId(data.studyGuide.suggestedSubject?._id ?? null);
    } catch (err) {
      console.log(err);
      setTopicResult(null);
      setError("Something went wrong. Please try another search.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    runSearch(searchQuery);
  }

  function handleRelatedTopicClick(term) {
    setSearchQuery(term);
    runSearch(term);
  }

  useEffect(() => {
    const incomingTerm = location.state?.searchTerm;

    if (incomingTerm) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runSearch(incomingTerm);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSaveTopic(topic) {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return Promise.reject(new Error("Sign in required to save"));
    }

    return onSaveTopic({ ...topic, subject: selectedSubjectId }).then(
      (saved) => {
        setIsSaved(true);
        return saved;
      },
    );
  }

  async function handleAuthSuccess() {
    try {
      await onSaveTopic({ ...topicResult, subject: selectedSubjectId });
      setAutoSaved(true);
    } catch (err) {
      console.error("Failed to save topic after signup:", err);
    } finally {
      setShowAuthModal(false);
    }
  }

  const hasSaved = isSaved || autoSaved;

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
        <button
          className="home__button"
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading && (
            <span className="home__button-spinner" aria-hidden="true" />
          )}
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {isLoading && (
        <div className="home__loading" role="status">
          <span className="home__loading-spinner" aria-hidden="true" />
          <p className="home__loading-text">Generating your study card...</p>
        </div>
      )}

      {error && <p className="home__error">{error}</p>}

      {topicResult && !hasSaved && (
        <div className="home__subject-confirm">
          <label
            htmlFor="search-subject-picker"
            className="home__subject-confirm-label"
          >
            Subject
          </label>
          <SubjectPicker
            id="search-subject-picker"
            value={selectedSubjectId}
            onChange={setSelectedSubjectId}
          />
        </div>
      )}

      {topicResult && (
        <StudyCard
          topic={topicResult}
          onSaveTopic={handleSaveTopic}
          onRelatedTopicClick={handleRelatedTopicClick}
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

      {!topicResult && !isLoading && (
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
