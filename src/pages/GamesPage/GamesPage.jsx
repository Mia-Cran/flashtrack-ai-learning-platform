import { Link, Navigate } from "react-router";
import {
  IconAlertTriangle,
  IconPuzzle,
  IconVolume,
} from "@tabler/icons-react";
import { MATCH_UNLOCK_COUNT, playableMatchTopics } from "../../utils/matchGame";
import { SPOT_UNLOCK_COUNT, playableSpotTopics } from "../../utils/spotGame";
import { HEAR_UNLOCK_COUNT, playableHearTopics } from "../../utils/hearGame";
import "./GamesPage.css";
import { useT } from "../../i18n";

function GamesPage({ isLoggedIn, savedTopics = [] }) {
  const t = useT();
  const matchCount = playableMatchTopics(savedTopics).length;
  const spotCount = playableSpotTopics(savedTopics).length;
  const hearCount = playableHearTopics(savedTopics).length;
  const matchUnlocked = matchCount >= MATCH_UNLOCK_COUNT;
  const spotUnlocked = spotCount >= SPOT_UNLOCK_COUNT;
  const hearUnlocked = hearCount >= HEAR_UNLOCK_COUNT;

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="games-page">
      <header className="games-page__header">
        <h1 className="games-page__title">{t("games.title")}</h1>
        <p className="games-page__lede">{t("games.lede")}</p>
      </header>

      <div className="games-page__grid">
        <article className="games-page__card">
          <h2 className="games-page__card-title">
            <IconPuzzle size={22} stroke={1.75} aria-hidden="true" />
            {t("games.match")}
          </h2>
          <p className="games-page__card-copy">{t("games.matchCopy")}</p>
          {matchUnlocked ? (
            <Link to="/match" className="games-page__button">
              {t("games.playMatch")}
            </Link>
          ) : (
            <p className="games-page__locked">
              {t("games.locked", {
                need: MATCH_UNLOCK_COUNT,
                have: matchCount,
              })}
            </p>
          )}
        </article>

        <article className="games-page__card">
          <h2 className="games-page__card-title">
            <IconAlertTriangle size={22} stroke={1.75} aria-hidden="true" />
            {t("games.spot")}
          </h2>
          <p className="games-page__card-copy">{t("games.spotCopy")}</p>
          {spotUnlocked ? (
            <Link to="/spot" className="games-page__button">
              {t("games.playSpot")}
            </Link>
          ) : (
            <p className="games-page__locked">
              {t("games.locked", {
                need: SPOT_UNLOCK_COUNT,
                have: spotCount,
              })}
            </p>
          )}
        </article>

        <article className="games-page__card">
          <h2 className="games-page__card-title">
            <IconVolume size={22} stroke={1.75} aria-hidden="true" />
            {t("games.hear")}
          </h2>
          <p className="games-page__card-copy">{t("games.hearCopy")}</p>
          {hearUnlocked ? (
            <Link to="/hear" className="games-page__button">
              {t("games.playHear")}
            </Link>
          ) : (
            <p className="games-page__locked">
              {t("games.locked", {
                need: HEAR_UNLOCK_COUNT,
                have: hearCount,
              })}
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

export default GamesPage;
