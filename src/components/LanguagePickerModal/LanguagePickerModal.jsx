import { useState } from "react";
import "./LanguagePickerModal.css";

function LanguagePickerModal({ onChoose }) {
  const [choice, setChoice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (!choice || isSaving) {
      return;
    }

    setIsSaving(true);
    Promise.resolve(onChoose(choice)).finally(() => {
      setIsSaving(false);
    });
  }

  return (
    <div className="language-picker__backdrop">
      <form
        className="language-picker__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-picker-title"
        onSubmit={handleSubmit}
      >
        <h2 id="language-picker-title" className="language-picker__title">
          ¿Quieres español? / ¿Quieres inglés?
        </h2>

        <fieldset className="language-picker__fieldset">
          <legend className="language-picker__legend">Language / Idioma</legend>
          <label className="language-picker__option">
            <input
              type="radio"
              name="preferredLanguage"
              value="es"
              checked={choice === "es"}
              onChange={() => setChoice("es")}
            />
            ¿Quieres español?
          </label>
          <label className="language-picker__option">
            <input
              type="radio"
              name="preferredLanguage"
              value="en"
              checked={choice === "en"}
              onChange={() => setChoice("en")}
            />
            ¿Quieres inglés?
          </label>
        </fieldset>

        <button
          type="submit"
          className="language-picker__continue"
          disabled={!choice || isSaving}
        >
          {choice === "es" ? "Continuar" : "Continue"}
        </button>
      </form>
    </div>
  );
}

export default LanguagePickerModal;
