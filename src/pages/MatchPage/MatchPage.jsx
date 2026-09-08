import { useState } from "react";
import { Link, Navigate } from "react-router";
import { IconPuzzle } from "@tabler/icons-react";
import {
  MATCH_UNLOCK_COUNT,
  buildMatchRound,
  playableMatchTopics,
} from "../../utils/matchGame";
import "./MatchPage.css";

function MatchPage({
  isLoggedIn,
  savedTopics = [],
}) {
  const [pinnedRound, setPinnedRound] = useState(null);
  const [selectedTermId, setSelectedTermId] = useState(null);
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [matchedIds, setMatchedIds] = useState(() => new Set());
  const [status, setStatus] = useState("Tap a term, then tap its meaning.");

  const playableCount = playableMatchTopics(savedTopics).length;
  const round = pinnedRound ?? buildMatchRound(savedTopics);
  if (pinnedRound === null && round) {
    setPinnedRound(round);
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const matchedCount = matchedIds.size;
  const totalPairs = round?.terms.length ?? 0;
  const isComplete = Boolean(round) && matchedCount === totalPairs;

  function resetSelection() {
    setSelectedTermId(null);
    setSelectedPromptId(null);
  }

  function tryMatch(termId, promptId) {
    if (!termId || !promptId) {
      return;
    }

    if (termId === promptId) {
      const nextMatched = new Set(matchedIds);
      nextMatched.add(termId);
      setMatchedIds(nextMatched);
      resetSelection();
      setStatus(
        nextMatched.size === totalPairs
          ? "All matched. Nice work."
          : "Matched. Pick another pair.",
      );
      return;
    }

    resetSelection();
    setStatus("Not a match. Try a different pair.");
  }

  function handleTermClick(id) {
    if (matchedIds.has(id) || isComplete) {
      return;
    }

    if (selectedTermId === id) {
      setSelectedTermId(null);
      return;
    }

    if (selectedPromptId) {
      tryMatch(id, selectedPromptId);
      return;
    }

    setSelectedTermId(id);
  }

  function handlePromptClick(id) {
    if (matchedIds.has(id) || isComplete) {
      return;
    }

    if (selectedPromptId === id) {
      setSelectedPromptId(null);
      return;
    }

    if (selectedTermId) {
      tryMatch(selectedTermId, id);
      return;
    }

    setSelectedPromptId(id);
  }

  function handlePlayAgain() {
    setMatchedIds(new Set());
    resetSelection();
    setStatus("Tap a term, then tap its meaning.");
    setPinnedRound(buildMatchRound(savedTopics));
  }

  return (
    <section className="match-page">
      <header className="match-page__header">
        <h1 className="match-page__title">
          <IconPuzzle size={28} stroke={1.75} aria-hidden="true" />
          Match
        </h1>
        <p className="match-page__lede">
          Pair each term with its meaning. One pair at a time — no timer.
        </p>
        <Link to="/games" className="match-page__hub-link">
          All games
        </Link>
      </header>

      {!round ? (
        <div className="match-page__empty">
          <p>
            Save {MATCH_UNLOCK_COUNT} real flashcards to play Match. Test
            cards don’t count. You have {playableCount} ready.
          </p>
          <Link to="/search" className="match-page__button match-page__button--primary">
            Search a topic
          </Link>
        </div>
      ) : (
        <>
          <p className="match-page__progress" aria-live="polite">
            {matchedCount} of {totalPairs} matched
          </p>
          <p className="match-page__status" role="status" aria-live="polite">
            {status}
          </p>

          <div className="match-page__board">
            <div className="match-page__column" aria-label="Terms">
              {round.terms.map((tile) => {
                const isMatched = matchedIds.has(tile.id);
                const isSelected = selectedTermId === tile.id;

                return (
                  <button
                    key={`term-${tile.id}`}
                    type="button"
                    className={[
                      "match-page__tile",
                      isSelected ? "match-page__tile--selected" : "",
                      isMatched ? "match-page__tile--matched" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleTermClick(tile.id)}
                    disabled={isMatched}
                    aria-pressed={isSelected}
                    aria-label={`Term: ${tile.label}`}
                  >
                    {tile.label}
                  </button>
                );
              })}
            </div>

            <div className="match-page__column" aria-label="Meanings">
              {round.prompts.map((tile) => {
                const isMatched = matchedIds.has(tile.id);
                const isSelected = selectedPromptId === tile.id;

                return (
                  <button
                    key={`prompt-${tile.id}`}
                    type="button"
                    className={[
                      "match-page__tile",
                      "match-page__tile--prompt",
                      isSelected ? "match-page__tile--selected" : "",
                      isMatched ? "match-page__tile--matched" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handlePromptClick(tile.id)}
                    disabled={isMatched}
                    aria-pressed={isSelected}
                    aria-label={`Meaning: ${tile.label}`}
                    title={tile.label}
                  >
                    {tile.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="match-page__actions">
            <button
              type="button"
              className="match-page__button match-page__button--primary"
              onClick={handlePlayAgain}
            >
              {isComplete ? "Play again" : "New round"}
            </button>
            {isComplete && (
              <Link to="/home" className="match-page__button match-page__button--secondary">
                Back to dashboard
              </Link>
            )}
          </div>

          {isComplete && (
            <p className="match-page__complete-note">You matched every pair.</p>
          )}
        </>
      )}
    </section>
  );
}

export default MatchPage;
