import "./SettingsPage.css";
import { useLayoutEffect, useRef, useState } from "react";
import { Navigate } from "react-router";
import {
  IconGauge,
  IconBulb,
  IconAccessible,
  IconDeviceFloppy,
  IconCheck,
} from "@tabler/icons-react";

function buildFormState(profile) {
  return {
    preferredDifficulty: profile?.preferredDifficulty || "",
    pacing: profile?.learningPreferences?.pacing || "",
    explanationStyle: profile?.learningPreferences?.explanationStyle || "",
    reduceMotion: profile?.accessibilityPreferences?.reduceMotion ?? false,
    largerText: profile?.accessibilityPreferences?.largerText ?? false,
    sectionsCollapsedByDefault:
      profile?.accessibilityPreferences?.sectionsCollapsedByDefault ?? true,
  };
}

function ToggleRow({ title, hint, checked, onChange }) {
  return (
    <label className="settings__toggle-row">
      <span className="settings__toggle-label">
        <span className="settings__toggle-title">{title}</span>
        <span className="settings__toggle-hint">{hint}</span>
      </span>
      <span className="settings__switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="settings__switch-track" aria-hidden="true" />
      </span>
    </label>
  );
}

function RadioOption({ name, value, label, currentValue, onChange }) {
  return (
    <label className="settings__radio">
      <input
        type="radio"
        name={name}
        value={value}
        checked={currentValue === value}
        onChange={() => onChange(value)}
      />
      {label}
    </label>
  );
}

function SettingsPage({ isLoggedIn, learnerProfile, onUpdateLearnerProfile }) {
  const [form, setForm] = useState(() => buildFormState(learnerProfile));
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const hasSyncedRef = useRef(Boolean(learnerProfile));

  // learnerProfile arrives from an async fetch in App that can resolve after this
  // page has already mounted — sync the form once it settles, but only the first
  // time, so we don't clobber changes the learner is mid-way through making.
  useLayoutEffect(() => {
    if (hasSyncedRef.current || !learnerProfile) {
      return;
    }

    hasSyncedRef.current = true;
    setForm(buildFormState(learnerProfile));
  }, [learnerProfile]);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveState("idle");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setSaveState("idle");

    const learningPreferences = {};

    if (form.pacing) {
      learningPreferences.pacing = form.pacing;
    }

    if (form.explanationStyle) {
      learningPreferences.explanationStyle = form.explanationStyle;
    }

    onUpdateLearnerProfile({
      preferredDifficulty: form.preferredDifficulty,
      learningPreferences,
      accessibilityPreferences: {
        reduceMotion: form.reduceMotion,
        largerText: form.largerText,
        sectionsCollapsedByDefault: form.sectionsCollapsedByDefault,
      },
    })
      .then(() => {
        setSaveState("saved");
      })
      .catch(() => {
        setSaveState("error");
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  if (!learnerProfile) {
    return (
      <section className="settings">
        <h1 className="settings__title">Settings</h1>
        <p className="settings__loading">Loading your settings...</p>
      </section>
    );
  }

  return (
    <section className="settings">
      <h1 className="settings__title">Settings</h1>
      <p className="settings__subtitle">
        Tell FlashTrack how you like to learn — these shape how study cards
        look and behave for you.
      </p>

      <form className="settings__form" onSubmit={handleSubmit}>
        <div className="settings__group">
          <h2 className="settings__group-title">
            <IconGauge size={20} stroke={1.75} aria-hidden="true" />
            Preferred Difficulty
          </h2>
          <p className="settings__group-hint">
            New topics will default to this level when it's available.
          </p>
          <select
            className="settings__select"
            value={form.preferredDifficulty}
            onChange={(event) =>
              updateField("preferredDifficulty", event.target.value)
            }
          >
            <option value="">No preference</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="settings__group">
          <h2 className="settings__group-title">
            <IconBulb size={20} stroke={1.75} aria-hidden="true" />
            Learning Style
          </h2>

          <fieldset className="settings__fieldset">
            <legend className="settings__legend">Pacing</legend>
            <div className="settings__radio-row">
              <RadioOption
                name="pacing"
                value=""
                label="No preference"
                currentValue={form.pacing}
                onChange={(value) => updateField("pacing", value)}
              />
              <RadioOption
                name="pacing"
                value="fast"
                label="Fast & to-the-point"
                currentValue={form.pacing}
                onChange={(value) => updateField("pacing", value)}
              />
              <RadioOption
                name="pacing"
                value="slow"
                label="Slower &amp; more gradual"
                currentValue={form.pacing}
                onChange={(value) => updateField("pacing", value)}
              />
            </div>
          </fieldset>

          <fieldset className="settings__fieldset">
            <legend className="settings__legend">Explanation Style</legend>
            <div className="settings__radio-row">
              <RadioOption
                name="explanationStyle"
                value=""
                label="No preference"
                currentValue={form.explanationStyle}
                onChange={(value) => updateField("explanationStyle", value)}
              />
              <RadioOption
                name="explanationStyle"
                value="analogies"
                label="Real-world analogies"
                currentValue={form.explanationStyle}
                onChange={(value) => updateField("explanationStyle", value)}
              />
              <RadioOption
                name="explanationStyle"
                value="technical"
                label="Technical depth"
                currentValue={form.explanationStyle}
                onChange={(value) => updateField("explanationStyle", value)}
              />
            </div>
          </fieldset>
        </div>

        <div className="settings__group">
          <h2 className="settings__group-title">
            <IconAccessible size={20} stroke={1.75} aria-hidden="true" />
            Accessibility
          </h2>

          <ToggleRow
            title="Sections collapsed by default"
            hint="Study card sections stay tucked away until you tap to open them."
            checked={form.sectionsCollapsedByDefault}
            onChange={(value) => updateField("sectionsCollapsedByDefault", value)}
          />

          <ToggleRow
            title="Larger text"
            hint="Increases text size across the app."
            checked={form.largerText}
            onChange={(value) => updateField("largerText", value)}
          />

          <ToggleRow
            title="Reduce motion"
            hint="Limits animations and transitions across the app."
            checked={form.reduceMotion}
            onChange={(value) => updateField("reduceMotion", value)}
          />
        </div>

        <div className="settings__actions">
          <button
            type="submit"
            className="settings__save-button"
            disabled={isSaving}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <IconDeviceFloppy size={18} stroke={2} aria-hidden="true" />
                Save Settings
              </>
            )}
          </button>

          {saveState === "saved" && (
            <span className="settings__save-confirmation">
              <IconCheck size={18} stroke={2} aria-hidden="true" />
              Saved
            </span>
          )}

          {saveState === "error" && (
            <span className="settings__save-error">
              Something went wrong — try again.
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

export default SettingsPage;
