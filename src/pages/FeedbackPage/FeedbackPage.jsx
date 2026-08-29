import "./FeedbackPage.css";
import { useEffect, useState } from "react";
import { IconMessage2, IconSend } from "@tabler/icons-react";
import { API_BASE_URL } from "../../utils/api";

function FeedbackPage({ isLoggedIn }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState(false);

  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState("idle");

  // Runs once on mount to populate the public feed. State is only ever set
  // inside the fetch's own callbacks (not synchronously in the effect body)
  // to avoid a cascading-render setState-in-effect lint error.
  useEffect(() => {
    fetch(`${API_BASE_URL}/feedback`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load feedback");
        }

        return res.json();
      })
      .then((feedback) => {
        setFeedbackList(feedback);
      })
      .catch((err) => {
        console.error(err);
        setListError(true);
      })
      .finally(() => {
        setIsLoadingList(false);
      });
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitState("idle");

    // Feedback stays open to anyone -- attach the token when someone happens
    // to be signed in, but never require it (see optionalAuth on the backend).
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch(`${API_BASE_URL}/feedback`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        contactEmail: isLoggedIn ? undefined : contactEmail,
      }),
    })
      .then((res) => {
        if (res.status === 400) {
          setSubmitState("blocked");
          return null;
        }

        if (!res.ok) {
          throw new Error("Failed to submit feedback");
        }

        return res.json();
      })
      .then((created) => {
        if (!created) {
          return;
        }

        setMessage("");
        setContactEmail("");
        setSubmitState("sent");
        setFeedbackList((prev) => [created, ...prev]);
      })
      .catch((err) => {
        console.error(err);
        setSubmitState("error");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <section className="feedback">
      <h1 className="feedback__title">Feedback</h1>
      <p className="feedback__subtitle">
        Tell me what's working, what's broken, or what you want to see next.
        No account needed — your message is shown publicly, but who sent it
        stays private.
      </p>

      <form className="feedback__form" onSubmit={handleSubmit}>
        <label className="feedback__label" htmlFor="feedback-message">
          Your feedback
        </label>
        <textarea
          id="feedback-message"
          className="feedback__textarea"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="What did you notice?"
          required
        />

        {!isLoggedIn && (
          <>
            <label className="feedback__label" htmlFor="feedback-email">
              Email (optional — only I can see this)
            </label>
            <input
              id="feedback-email"
              type="email"
              className="feedback__input"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </>
        )}

        <div className="feedback__actions">
          <button
            type="submit"
            className="feedback__submit-button"
            disabled={isSubmitting || !message.trim()}
          >
            <IconSend size={18} stroke={2} aria-hidden="true" />
            {isSubmitting ? "Sending..." : "Send Feedback"}
          </button>

          {submitState === "sent" && (
            <span className="feedback__confirmation">Thanks — got it!</span>
          )}

          {submitState === "blocked" && (
            <span className="feedback__error">
              That message couldn't be posted. Please rephrase and try again.
            </span>
          )}

          {submitState === "error" && (
            <span className="feedback__error">
              Something went wrong — try again.
            </span>
          )}
        </div>
      </form>

      <div className="feedback__list">
        <h2 className="feedback__list-title">
          <IconMessage2 size={20} stroke={1.75} aria-hidden="true" />
          What people are saying
        </h2>

        {isLoadingList && (
          <p className="feedback__list-status">Loading feedback...</p>
        )}

        {!isLoadingList && listError && (
          <p className="feedback__list-status">
            Couldn't load feedback right now.
          </p>
        )}

        {!isLoadingList && !listError && feedbackList.length === 0 && (
          <p className="feedback__list-status">
            No feedback yet — be the first!
          </p>
        )}

        {!isLoadingList && !listError && feedbackList.length > 0 && (
          <ul className="feedback__list-items">
            {feedbackList.map((item) => (
              <li key={item._id} className="feedback__list-item">
                <p className="feedback__list-message">{item.message}</p>
                <span className="feedback__list-date">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default FeedbackPage;
