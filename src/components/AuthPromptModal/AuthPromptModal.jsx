import "./AuthPromptModal.css";
import { useEffect, useRef, useState } from "react";
import SigninForm from "../AuthForms/SigninForm";
import SignupForm from "../AuthForms/SignupForm";

function AuthPromptModal({ onSignup, onSignin, onSuccess, onClose }) {
  const [mode, setMode] = useState("signup");
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="auth-modal__backdrop" onClick={onClose}>
      <div
        className="auth-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="auth-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="auth-modal-heading" className="auth-modal__heading">
          {mode === "signup"
            ? "Create an account to save this topic"
            : "Sign in to save this topic"}
        </h2>

        <p className="auth-modal__subtext">
          {mode === "signup"
            ? "Your study card is ready — create an account and we'll save it for you automatically."
            : "Welcome back — sign in and we'll save this topic for you automatically."}
        </p>

        {mode === "signup" ? (
          <SignupForm onSignup={onSignup} onSuccess={onSuccess} />
        ) : (
          <SigninForm onSignin={onSignin} onSuccess={onSuccess} />
        )}

        <button
          type="button"
          className="auth-modal__toggle"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}

export default AuthPromptModal;
