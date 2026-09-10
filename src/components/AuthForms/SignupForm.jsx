import { useState } from "react";
import "./AuthForms.css";
import { useT } from "../../i18n";

function SignupForm({ onSignup, onSuccess }) {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    onSignup(name, email, password)
      .then(() => {
        onSuccess?.();
      })
      .catch((err) => {
        console.error(err);
        // A TypeError here means the request never reached the server
        // (offline, backend down). Anything else is the server's own message.
        setError(
          err instanceof TypeError || !err.message
            ? t("auth.signupError")
            : err.message,
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <input
        className="auth-form__input"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={t("auth.name")}
        required
      />

      <input
        className="auth-form__input"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t("auth.email")}
        required
      />

      <input
        className="auth-form__input"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder={t("auth.password")}
        required
      />

      <button
        type="submit"
        className="auth-form__submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting && <span className="auth-form__spinner" aria-hidden="true" />}
        {isSubmitting ? t("auth.creating") : t("auth.createAccount")}
      </button>

      {error && (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export default SignupForm;
