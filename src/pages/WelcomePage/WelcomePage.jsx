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

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getSavedAt(topicId) {
  if (typeof topicId !== "string" || topicId.length < 8) {
    return null;
  }

  const seconds = parseInt(topicId.substring(0, 8), 16);
  return Number.isNaN(seconds) ? null : seconds * 1000;
}

function countSavedThisWeek(savedTopics) {
  const now = Date.now();

  return savedTopics.filter((topic) => {
    const savedAt = getSavedAt(topic._id);
    return savedAt !== null && now - savedAt <= ONE_WEEK_MS;
  }).length;
}

function getStreakText(count) {
  if (count === 0) {
    return "No topics saved this week yet — let's fix that.";
  }

  const label = count === 1 ? "topic" : "topics";
  return `${count} ${label} saved this week — nice streak`;
}

function WelcomePage({
  onSignin,
  onSignup,
  isLoggedIn,
  userName,
  savedTopics = [],
}) {
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState(null);

  function handlePrimaryCta() {
    navigate("/home");
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
                ? `Welcome back, ${userName}!`
                : "Welcome to FlashTrack!"}
            </h1>

            <p className="welcome__subtext">
              {isReturning
                ? "Great to see you again. Ready to keep the momentum going?"
                : "Let's find something worth learning today. Search any topic and watch a full study card come to life in seconds."}
            </p>

            {isReturning && (
              <span className="welcome__streak-badge">
                <IconFlame size={16} stroke={2} aria-hidden="true" />
                {getStreakText(savedThisWeek)}
              </span>
            )}

            <button
              type="button"
              className="welcome__cta"
              onClick={handlePrimaryCta}
            >
              {isReturning ? "Continue learning" : "Start exploring"}
              <IconArrowRight size={18} stroke={2} aria-hidden="true" />
            </button>

            {!isReturning && (
              <div className="welcome__badges">
                <span className="welcome__badge welcome__badge--pink">
                  Any topic
                </span>
                <span className="welcome__badge welcome__badge--green">
                  AI-powered
                </span>
              </div>
            )}

            {!isLoggedIn && (
              <p className="welcome__signup-prompt">
                Don&rsquo;t have an account?{" "}
                <button
                  type="button"
                  className="welcome__inline-link"
                  onClick={() => setActiveForm("signup")}
                >
                  Create one
                </button>
              </p>
            )}

            {!isLoggedIn && (
              <button
                type="button"
                className="app__auth-link welcome__signin-link"
                onClick={() => setActiveForm("signin")}
              >
                Already have an account? Sign in
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
