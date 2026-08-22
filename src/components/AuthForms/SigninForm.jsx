import { useState } from "react";
import "./AuthForms.css";

function SigninForm({ onSignin, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    onSignin(email, password)
      .then(() => {
        onSuccess?.();
      })
      .catch((err) => {
        console.error(err);
        setError("Incorrect email or password. Please try again.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <input
        className="auth-form__input"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        required
      />

      <input
        className="auth-form__input"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        required
      />

      <button
        type="submit"
        className="auth-form__submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting && <span className="auth-form__spinner" aria-hidden="true" />}
        {isSubmitting ? "Signing In..." : "Sign In"}
      </button>

      {error && (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export default SigninForm;
