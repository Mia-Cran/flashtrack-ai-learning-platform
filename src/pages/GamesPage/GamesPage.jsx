import { Link, Navigate } from "react-router";
import { IconAlertTriangle, IconPuzzle } from "@tabler/icons-react";
import { MATCH_UNLOCK_COUNT, playableMatchTopics } from "../../utils/matchGame";
import { SPOT_UNLOCK_COUNT, playableSpotTopics } from "../../utils/spotGame";
import "./GamesPage.css";

function GamesPage({ isLoggedIn, savedTopics = [] }) {
  const matchCount = playableMatchTopics(savedTopics).length;
  const spotCount = playableSpotTopics(savedTopics).length;
  const matchUnlocked = matchCount >= MATCH_UNLOCK_COUNT;
  const spotUnlocked = spotCount >= SPOT_UNLOCK_COUNT;

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="games-page">
      <header className="games-page__header">
        <h1 className="games-page__title">Games</h1>
        <p className="games-page__lede">
          Short rounds from your saved cards. One choice at a time — no
          timer, and a miss just means try again.
        </p>
      </header>

      <div className="games-page__grid">
        <article className="games-page__card">
          <h2 className="games-page__card-title">
            <IconPuzzle size={22} stroke={1.75} aria-hidden="true" />
            Match
          </h2>
          <p className="games-page__card-copy">
            Pair four saved terms with their meanings.
          </p>
          {matchUnlocked ? (
            <Link to="/match" className="games-page__button">
              Play Match
            </Link>
          ) : (
            <p className="games-page__locked">
              Save {MATCH_UNLOCK_COUNT} real flashcards to unlock. You have{" "}
              {matchCount} ready.
            </p>
          )}
        </article>

        <article className="games-page__card">
          <h2 className="games-page__card-title">
            <IconAlertTriangle size={22} stroke={1.75} aria-hidden="true" />
            Spot the mistake
          </h2>
          <p className="games-page__card-copy">
            See a term and two statements. Tap the common mix-up.
          </p>
          {spotUnlocked ? (
            <Link to="/spot" className="games-page__button">
              Play Spot the mistake
            </Link>
          ) : (
            <p className="games-page__locked">
              Save {SPOT_UNLOCK_COUNT} real flashcards to unlock. You have{" "}
              {spotCount} ready.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

export default GamesPage;
