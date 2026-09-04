import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../utils/api";
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

function SearchPage({
  onSaveTopic,
  isLoggedIn,
  onSignup,
  onSignin,
  onLoadingChange,
  sectionsCollapsedByDefault = true,
  explanationStyle = "analogies",
}) {
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
  // Session 10, entry point 2: set when a student arrives here by browsing
  // a subject from the nav dropdown instead of searching directly. Purely
  // local display state -- it swaps which example topics are shown below,
  // never anything sent to the backend or used to classify a search.
  const [browseSubject, setBrowseSubject] = useState(null);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    return () => {
      onLoadingChange?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setBrowseSubject(null);

    try {
      const token = localStorage.getItem("jwt");
      const headers = { "Content-Type": "application/json" };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/study/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          term: cleanedQuery,
        }),
      });

      // Read the body before branching on response.ok so a specific
      // backend-provided message (e.g. the rate limiter's) can be shown
      // instead of a generic one -- previously every non-ok response
      // (rate limited, not found, server error) looked identical to the
      // user, which hid a real, working rate limit behind a confusing
      // "something went wrong."
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            data?.message ||
              "You've hit the search limit for now. Please wait a few minutes and try again.",
          );
        }

        // 503 = the server is running without an OpenAI key. Its message
        // says exactly what to do, so show it instead of "Topic not found."
        if (response.status === 503) {
          throw new Error(
            data?.message || "AI features are turned off on this server.",
          );
        }

        // Prefer the server's reason (bad/missing key, model error, etc.)
        // over a generic "Topic not found" that hid real setup problems.
        throw new Error(
          data?.message || "Topic not found. Please try another search.",
        );
      }

      setTopicResult({ ...data.studyGuide, searchTerm: cleanedQuery });
      setSelectedSubjectId(data.studyGuide.suggestedSubject?._id ?? null);
    } catch (err) {
      console.log(err);
      setTopicResult(null);
      setError(err.message || "Something went wrong. Please try another search.");
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
    const state = location.state;

    if (!state) {
      return;
    }

    if (state.searchTerm) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runSearch(state.searchTerm);
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    if (state.browseSubjectId) {
      setBrowseSubject({
        name: state.browseSubjectName,
        exampleTopics: state.browseExampleTopics ?? [],
      });
      setTopicResult(null);
      navigate(location.pathname, { replace: true, state: null });
    }
    // Depends on location.state (not mount-only) so picking a different
    // subject from the nav dropdown updates this page even when already
    // sitting on /search, rather than only working on the first arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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
          disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>
      )}

      {topicResult && (
        <StudyCard
          key={topicResult.searchTerm || topicResult.title}
          topic={topicResult}
          onSaveTopic={handleSaveTopic}
          onRelatedTopicClick={handleRelatedTopicClick}
          isSavedExternally={autoSaved}
          disabled={isLoading}
          sectionsCollapsedByDefault={sectionsCollapsedByDefault}
          explanationStyle={explanationStyle}
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

      {!topicResult && !isLoading && browseSubject && (
        <section className="home__examples" aria-label={`Example topics in ${browseSubject.name}`}>
          <p className="home__examples-label">
            Browsing {browseSubject.name} — try one, or search anything:
          </p>
          {browseSubject.exampleTopics.length > 0 ? (
            <div className="home__browse-chips">
              {browseSubject.exampleTopics.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="home__browse-chip"
                  onClick={() => setSearchQuery(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          ) : (
            <p className="home__empty">
              No example topics for this subject yet — search anything and
              it'll be classified into {browseSubject.name} automatically if
              that's the best fit.
            </p>
          )}
          <button
            type="button"
            className="home__browse-clear"
            onClick={() => setBrowseSubject(null)}
          >
            ← Or see general example topics instead
          </button>
        </section>
      )}

      {!topicResult && !isLoading && !browseSubject && (
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
