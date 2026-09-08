import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { IconVolume } from "@tabler/icons-react";
import {
  HEAR_UNLOCK_COUNT,
  buildHearRound,
  playableHearTopics,
} from "../../utils/hearGame";
import { canUseSpeech, speakText, stopSpeech } from "../../utils/speech";
import "./HearPage.css";

function HearPage({ isLoggedIn, savedTopics = [] }) {
  const [pinnedRound, setPinnedRound] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [picked, setPicked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("Tap Hear, then pick the meaning.");
  const speechAvailable = canUseSpeech();

  const playableCount = playableHearTopics(savedTopics).length;
  const round = pinnedRound ?? buildHearRound(savedTopics);
  if (pinnedRound === null && round) {
    setPinnedRound(round);
  }

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const totalCards = round?.cards.length ?? 0;
  const card = round?.cards[cardIndex];
  const pickedCount = picked ? cardIndex + 1 : cardIndex;
  const isComplete = Boolean(round) && picked && cardIndex === totalCards - 1;
  const showTerm = !speechAvailable || picked;

  function quiet() {
    stopSpeech();
    setIsSpeaking(false);
  }

  function startNewRound() {
    quiet();
    setCardIndex(0);
    setPicked(false);
    setStatus("Tap Hear, then pick the meaning.");
    setPinnedRound(buildHearRound(savedTopics));
  }

  function handleHear() {
    if (!card || !speechAvailable) {
      return;
    }

    if (isSpeaking) {
      quiet();
      return;
    }

    speakText(card.spoken, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }

  function handleOptionClick(id) {
    if (!card || picked || isComplete) {
      return;
    }

    if (id === card.id) {
      quiet();
      setPicked(true);
      setStatus(
        cardIndex === totalCards - 1
          ? `That's ${card.term}. Last one.`
          : `That's ${card.term}.`,
      );
      return;
    }

    setStatus("Not that one. Hear it again, or try another meaning.");
  }

  function handleNext() {
    if (!picked || isComplete) {
      return;
    }

    quiet();
    setCardIndex((index) => index + 1);
    setPicked(false);
    setStatus("Tap Hear, then pick the meaning.");
  }

  return (
    <section className="hear-page">
      <header className="hear-page__header">
        <h1 className="hear-page__title">
          <IconVolume size={28} stroke={1.75} aria-hidden="true" />
          Hear & pick
        </h1>
        <p className="hear-page__lede">
          Hear a saved term, then tap its meaning. Same voice as Hear it.
          No timer.
        </p>
        <Link to="/games" className="hear-page__hub-link">
          All games
        </Link>
      </header>

      {!round ? (
        <div className="hear-page__empty">
          <p>
            Save {HEAR_UNLOCK_COUNT} real flashcards to play Hear & pick.
            Test cards don’t count. You have {playableCount} ready.
          </p>
          <Link
            to="/search"
            className="hear-page__button hear-page__button--primary"
          >
            Search a topic
          </Link>
        </div>
      ) : (
        <>
          <p className="hear-page__progress" aria-live="polite">
            {pickedCount} of {totalCards} picked
          </p>
          <p className="hear-page__status" role="status" aria-live="polite">
            {status}
          </p>

          <div className="hear-page__card">
            {showTerm && <p className="hear-page__term">{card.term}</p>}
            <p className="hear-page__prompt">
              {speechAvailable
                ? "Which meaning matches the term you heard?"
                : "This browser can’t speak, so the term is on the screen. Tap its meaning."}
            </p>

            {speechAvailable && (
              <button
                type="button"
                className="hear-page__hear"
                onClick={handleHear}
                aria-pressed={isSpeaking}
                aria-label={
                  isSpeaking ? "Stop the term" : "Hear the term"
                }
              >
                {isSpeaking ? "Stop" : "Hear the term"}
              </button>
            )}

            <div className="hear-page__options" aria-label="Meanings">
              {card.options.map((option) => {
                const isCorrect = picked && option.id === card.id;
                const isOther = picked && option.id !== card.id;

                return (
                  <button
                    key={`${card.id}-${option.id}`}
                    type="button"
                    className={[
                      "hear-page__option",
                      isCorrect ? "hear-page__option--picked" : "",
                      isOther ? "hear-page__option--other" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleOptionClick(option.id)}
                    disabled={picked}
                    aria-label={`Meaning: ${option.label}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hear-page__actions">
            {picked && !isComplete && (
              <button
                type="button"
                className="hear-page__button hear-page__button--primary"
                onClick={handleNext}
              >
                Next term
              </button>
            )}
            <button
              type="button"
              className={
                isComplete
                  ? "hear-page__button hear-page__button--primary"
                  : "hear-page__button hear-page__button--secondary"
              }
              onClick={startNewRound}
            >
              {isComplete ? "Play again" : "New round"}
            </button>
            {isComplete && (
              <Link
                to="/home"
                className="hear-page__button hear-page__button--secondary"
              >
                Back to dashboard
              </Link>
            )}
          </div>

          {isComplete && (
            <p className="hear-page__complete-note">
              You picked every meaning.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default HearPage;
