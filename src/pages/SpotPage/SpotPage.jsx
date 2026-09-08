import { useState } from "react";
import { Link, Navigate } from "react-router";
import { IconAlertTriangle } from "@tabler/icons-react";
import {
  SPOT_UNLOCK_COUNT,
  buildSpotRound,
  playableSpotTopics,
} from "../../utils/spotGame";
import "./SpotPage.css";

function SpotPage({ isLoggedIn, savedTopics = [] }) {
  const [pinnedRound, setPinnedRound] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [spotted, setSpotted] = useState(false);
  const [status, setStatus] = useState("Tap the common mix-up.");

  const playableCount = playableSpotTopics(savedTopics).length;
  const round = pinnedRound ?? buildSpotRound(savedTopics);
  if (pinnedRound === null && round) {
    setPinnedRound(round);
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const totalCards = round?.cards.length ?? 0;
  const card = round?.cards[cardIndex];
  const spottedCount = spotted ? cardIndex + 1 : cardIndex;
  const isComplete = Boolean(round) && spotted && cardIndex === totalCards - 1;

  function startNewRound() {
    setCardIndex(0);
    setSpotted(false);
    setStatus("Tap the common mix-up.");
    setPinnedRound(buildSpotRound(savedTopics));
  }

  function handleOptionClick(kind) {
    if (!card || spotted || isComplete) {
      return;
    }

    if (kind === "mistake") {
      setSpotted(true);
      setStatus(
        cardIndex === totalCards - 1
          ? "Spotted it. That's the last one."
          : "Spotted it.",
      );
      return;
    }

    setStatus("That's the real meaning. Try the other one.");
  }

  function handleNext() {
    if (!spotted || isComplete) {
      return;
    }

    setCardIndex((index) => index + 1);
    setSpotted(false);
    setStatus("Tap the common mix-up.");
  }

  return (
    <section className="spot-page">
      <header className="spot-page__header">
        <h1 className="spot-page__title">
          <IconAlertTriangle size={28} stroke={1.75} aria-hidden="true" />
          Spot the mistake
        </h1>
        <p className="spot-page__lede">
          Two statements. One is the real meaning. Tap the common mix-up.
          No timer.
        </p>
        <Link to="/games" className="spot-page__hub-link">
          All games
        </Link>
      </header>

      {!round ? (
        <div className="spot-page__empty">
          <p>
            Save {SPOT_UNLOCK_COUNT} real flashcards to play Spot the
            mistake. Test cards don’t count. You have {playableCount} ready.
          </p>
          <Link
            to="/search"
            className="spot-page__button spot-page__button--primary"
          >
            Search a topic
          </Link>
        </div>
      ) : (
        <>
          <p className="spot-page__progress" aria-live="polite">
            {spottedCount} of {totalCards} spotted
          </p>
          <p className="spot-page__status" role="status" aria-live="polite">
            {status}
          </p>

          <div className="spot-page__card">
            <p className="spot-page__term">{card.term}</p>
            <p className="spot-page__prompt">Which one is the common mix-up?</p>

            <div className="spot-page__options" aria-label="Statements">
              {card.options.map((option) => {
                const isPickedMistake =
                  spotted && option.kind === "mistake";
                const isRevealedMeaning =
                  spotted && option.kind === "meaning";

                return (
                  <button
                    key={`${card.id}-${option.kind}`}
                    type="button"
                    className={[
                      "spot-page__option",
                      isPickedMistake ? "spot-page__option--spotted" : "",
                      isRevealedMeaning ? "spot-page__option--meaning" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleOptionClick(option.kind)}
                    disabled={spotted}
                    aria-label={`Option: ${option.label}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="spot-page__actions">
            {spotted && !isComplete && (
              <button
                type="button"
                className="spot-page__button spot-page__button--primary"
                onClick={handleNext}
              >
                Next term
              </button>
            )}
            <button
              type="button"
              className={
                isComplete
                  ? "spot-page__button spot-page__button--primary"
                  : "spot-page__button spot-page__button--secondary"
              }
              onClick={startNewRound}
            >
              {isComplete ? "Play again" : "New round"}
            </button>
            {isComplete && (
              <Link
                to="/home"
                className="spot-page__button spot-page__button--secondary"
              >
                Back to dashboard
              </Link>
            )}
          </div>

          {isComplete && (
            <p className="spot-page__complete-note">
              You spotted every mix-up.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default SpotPage;
