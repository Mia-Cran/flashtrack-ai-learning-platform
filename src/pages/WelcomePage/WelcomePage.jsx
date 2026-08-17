import "./WelcomePage.css";
import { useNavigate } from "react-router";
import { useState } from "react";
import {
  IconArrowRight,
  IconBulb,
  IconConfetti,
  IconFlame,
} from "@tabler/icons-react";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signinError, setSigninError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setIsSigningIn(true);
    setSigninError("");

    onSignin(email, password)
      .then(() => {
        navigate("/home");
      })
      .catch((err) => {
        console.error(err);
        setSigninError("Incorrect email or password. Please try again.");
      })
      .finally(() => {
        setIsSigningIn(false);
      });
  }

  function handleSignup(event) {
    event.preventDefault();
    setIsSigningUp(true);

    onSignup(name, email, password)
      .then(() => {
        navigate("/home");
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsSigningUp(false);
      });
  }

  function handlePrimaryCta() {
    if (isLoggedIn) {
      navigate("/home");
      return;
    }

    setActiveForm("signup");
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
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />

            <button
              type="submit"
              className="app__submit-button"
              disabled={isSigningIn}
              aria-busy={isSigningIn}
            >
              {isSigningIn && (
                <span className="app__spinner" aria-hidden="true" />
              )}
              {isSigningIn ? "Signing In..." : "Sign In"}
            </button>

            {signinError && (
              <p className="app__form-error" role="alert">
                {signinError}
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              required
            />

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />

            <button type="submit" disabled={isSigningUp}>
              {isSigningUp ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default WelcomePage;
