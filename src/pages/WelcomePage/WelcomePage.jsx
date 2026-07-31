import "./WelcomePage.css";
import welcomeImage from "../../assets/welcome-study.png";
import { useNavigate } from "react-router";
import { useState } from "react";

function WelcomePage({ onSignin, onSignup, isLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    onSignin(email, password)
      .then(() => {
        navigate("/home");
      })
      .catch((err) => {
        console.error(err);
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

  return (
    <section className="app__intro">
      <img
        className="app__image"
        src={welcomeImage}
        alt="Open book with coding screen"
      />

      <div className="app__text">
        <h1 className="app__title">
          Welcome to <br />
          Your Software Engineering Study Tracker
        </h1>

        <p className="app__description">
          Search, save, and review software engineering concepts as study cards.
        </p>

        {!isLoggedIn && activeForm === null && (
          <div className="app__auth-options">
            <button
              type="button"
              className="app__auth-link"
              onClick={() => setActiveForm("signin")}
            >
              Sign In
            </button>

            <button
              type="button"
              className="app__auth-link"
              onClick={() => setActiveForm("signup")}
            >
              Create Account
            </button>
          </div>
        )}
        {activeForm === "signin" && (
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

            <button type="submit">Sign In</button>
          </form>
        )}
        {activeForm === "signup" && (
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
