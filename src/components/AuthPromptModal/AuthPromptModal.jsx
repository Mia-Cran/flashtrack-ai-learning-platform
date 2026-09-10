import "./AuthPromptModal.css";
import { useEffect, useRef, useState } from "react";
import SigninForm from "../AuthForms/SigninForm";
import SignupForm from "../AuthForms/SignupForm";
import { useT } from "../../i18n";

function AuthPromptModal({ onSignup, onSignin, onSuccess, onClose }) {
  const [mode, setMode] = useState("signup");
  const closeButtonRef = useRef(null);
  const t = useT();

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
          aria-label={t("auth.close")}
        >
          ×
        </button>

        <h2 id="auth-modal-heading" className="auth-modal__heading">
          {mode === "signup"
            ? t("auth.saveSignupTitle")
            : t("auth.saveSigninTitle")}
        </h2>

        <p className="auth-modal__subtext">
          {mode === "signup"
            ? t("auth.saveSignupBody")
            : t("auth.saveSigninBody")}
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
            ? t("auth.toggleSignin")
            : t("auth.toggleSignup")}
        </button>
      </div>
    </div>
  );
}

export default AuthPromptModal;
