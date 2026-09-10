import { useState } from "react";
import { Link, Navigate } from "react-router";
import { IconPuzzle } from "@tabler/icons-react";
import {
  MATCH_UNLOCK_COUNT,
  buildMatchRound,
  playableMatchTopics,
} from "../../utils/matchGame";
import "./MatchPage.css";
import { useT } from "../../i18n";

function MatchPage({
  isLoggedIn,
  savedTopics = [],
}) {
  const t = useT();
  const [pinnedRound, setPinnedRound] = useState(null);
  const [selectedTermId, setSelectedTermId] = useState(null);
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [matchedIds, setMatchedIds] = useState(() => new Set());
  const [status, setStatus] = useState("");

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
          ? t("match.allMatched")
          : t("match.matched"),
      );
      return;
    }

    resetSelection();
    setStatus(t("match.notPair"));
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
    setStatus(t("match.tapTerm"));
    setPinnedRound(buildMatchRound(savedTopics));
  }

  return (
    <section className="match-page">
      <header className="match-page__header">
        <h1 className="match-page__title">
          <IconPuzzle size={28} stroke={1.75} aria-hidden="true" />
          {t("games.match")}
        </h1>
        <p className="match-page__lede">{t("match.lede")}</p>
        <Link to="/games" className="match-page__hub-link">
          {t("match.back")}
        </Link>
      </header>

      {!round ? (
        <div className="match-page__empty">
          <p>
            {t("match.needMore", {
              need: MATCH_UNLOCK_COUNT,
              have: playableCount,
            })}
          </p>
          <Link to="/search" className="match-page__button match-page__button--primary">
            {t("common.searchTopic")}
          </Link>
        </div>
      ) : (
        <>
          <p className="match-page__progress" aria-live="polite">
            {t("match.progress", { matched: matchedCount, total: totalPairs })}
          </p>
          <p className="match-page__status" role="status" aria-live="polite">
            {status || t("match.tapTerm")}
          </p>

          <div className="match-page__board">
            <div className="match-page__column" aria-label={t("match.termsColumn")}>
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
                    aria-label={t("match.termAria", { label: tile.label })}
                  >
                    {tile.label}
                  </button>
                );
              })}
            </div>

            <div className="match-page__column" aria-label={t("match.meaningsColumn")}>
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
                    aria-label={t("match.meaningAria", { label: tile.label })}
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
              {isComplete ? t("common.playAgain") : t("match.newRound")}
            </button>
            {isComplete && (
              <Link to="/home" className="match-page__button match-page__button--secondary">
                {t("common.backDashboard")}
              </Link>
            )}
          </div>

          {isComplete && (
            <p className="match-page__complete-note">{t("match.complete")}</p>
          )}
        </>
      )}
    </section>
  );
}

export default MatchPage;
