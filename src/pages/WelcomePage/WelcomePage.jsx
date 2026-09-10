import "./WelcomePage.css";
import { useNavigate } from "react-router";
import { useState } from "react";
import {
  IconArrowRight,
  IconBulb,
  IconConfetti,
  IconFlame,
} from "@tabler/icons-react";
import SigninForm from "../../components/AuthForms/SigninForm";
import SignupForm from "../../components/AuthForms/SignupForm";
import { getSavedAt } from "../../utils/topicTimestamps";
import { useT } from "../../i18n";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function countSavedThisWeek(savedTopics) {
  const now = Date.now();

  return savedTopics.filter((topic) => {
    const savedAt = getSavedAt(topic._id);
    return savedAt !== null && now - savedAt <= ONE_WEEK_MS;
  }).length;
}

function getStreakText(count, t) {
  if (count === 0) {
    return t("welcome.streakZero");
  }

  return count === 1
    ? t("welcome.streakOne", { count })
    : t("welcome.streakMany", { count });
}

function WelcomePage({
  onSignin,
  onSignup,
  isLoggedIn,
  userName,
  savedTopics = [],
}) {
  const navigate = useNavigate();
  const t = useT();
  const [activeForm, setActiveForm] = useState(null);

  function handlePrimaryCta() {
    navigate(isLoggedIn ? "/home" : "/search");
  }

  const isReturning = isLoggedIn && savedTopics.length > 0;
  const savedThisWeek = isReturning ? countSavedThisWeek(savedTopics) : 0;

  return (
    <section className="app__intro">
      <div className="welcome__card">
        {activeForm === null ? (
          <>
            <div
              className={`welcome__icon-wrap welcome__icon-wrap--${
                isReturning ? "pink" : "green"
              }`}
            >
              {isReturning ? (
                <IconConfetti
                  size={36}
                  stroke={1.75}
                  className="welcome__icon welcome__icon--pink"
                  aria-hidden="true"
                />
              ) : (
                <IconBulb
                  size={36}
                  stroke={1.75}
                  className="welcome__icon welcome__icon--green"
                  aria-hidden="true"
                />
              )}
            </div>

            <h1 className="welcome__heading">
              {isReturning
                ? t("welcome.back", { name: userName })
                : t("welcome.hello")}
            </h1>

            <p className="welcome__subtext">
              {isReturning ? t("welcome.subtextBack") : t("welcome.subtextNew")}
            </p>

            {isReturning && (
              <span className="welcome__streak-badge">
                <IconFlame size={16} stroke={2} aria-hidden="true" />
                {getStreakText(savedThisWeek, t)}
              </span>
            )}

            <button
              type="button"
              className="welcome__cta"
              onClick={handlePrimaryCta}
            >
              {isReturning ? t("welcome.ctaBack") : t("welcome.ctaNew")}
              <IconArrowRight size={18} stroke={2} aria-hidden="true" />
            </button>

            {!isReturning && (
              <div className="welcome__badges">
                <span className="welcome__badge welcome__badge--pink">
                  {t("welcome.badgeTopic")}
                </span>
                <span className="welcome__badge welcome__badge--green">
                  {t("welcome.badgeAi")}
                </span>
              </div>
            )}

            {!isLoggedIn && (
              <p className="welcome__signup-prompt">
                {t("welcome.noAccount")}{" "}
                <button
                  type="button"
                  className="welcome__inline-link"
                  onClick={() => setActiveForm("signup")}
                >
                  {t("welcome.createAccount")}
                </button>
              </p>
            )}

            {!isLoggedIn && (
              <button
                type="button"
                className="app__auth-link welcome__signin-link"
                onClick={() => setActiveForm("signin")}
              >
                {t("welcome.alreadyAccount")}
              </button>
            )}
          </>
        ) : activeForm === "signin" ? (
          <SigninForm
            onSignin={onSignin}
            onSuccess={() => navigate("/home")}
          />
        ) : (
          <SignupForm
            onSignup={onSignup}
            onSuccess={() => navigate("/home")}
          />
        )}
      </div>
    </section>
  );
}

export default WelcomePage;
