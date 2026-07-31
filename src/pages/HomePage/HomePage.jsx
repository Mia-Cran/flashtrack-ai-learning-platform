import { useState } from "react";
import "./HomePage.css";
import StudyCard from "../../components/StudyCard/StudyCard";
import simpleDefinitions from "../../utils/simpleDefinitions";

function HomePage({ onSaveTopic }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [topicResult, setTopicResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearchSubmit(e) {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError("Please enter a topic to search.");
      setTopicResult(null);
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const cleanedQuery = searchQuery.trim().replace(/[.,!?]+$/, "");
      const encodedQuery = encodeURIComponent(cleanedQuery);
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Topic not found.");
      }

      const data = await response.json();
      const normalizedQuery = cleanedQuery.toLowerCase();
      const studyInfo = simpleDefinitions[normalizedQuery] || null;

      setTopicResult({
        ...data,
        studyInfo,
      });
    } catch (err) {
      console.log(err);
      setTopicResult(null);
      setError("Something went wrong. Please try another search.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="home">
      <h1 className="home__title">Search Topics</h1>
      <p className="home__description">
        Search for software engineering concepts and turn them into study cards.
      </p>
      <form className="home__form" onSubmit={handleSearchSubmit}>
        <input
          className="home__input"
          type="text"
          placeholder='Try "JavaScript", "React", or "API"'
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
        <StudyCard topic={topicResult} onSaveTopic={onSaveTopic} />
      )}
    </section>
  );
}

export default HomePage;
