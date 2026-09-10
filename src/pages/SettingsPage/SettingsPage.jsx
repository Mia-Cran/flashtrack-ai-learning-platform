import "./SettingsPage.css";
import { useLayoutEffect, useRef, useState } from "react";
import { Navigate } from "react-router";
import {
  IconGauge,
  IconBulb,
  IconAccessible,
  IconDeviceFloppy,
  IconCheck,
  IconLanguage,
} from "@tabler/icons-react";
import { useT } from "../../i18n";

function buildFormState(profile) {
  return {
    preferredLanguage: profile?.preferredLanguage === "es" ? "es" : "en",
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
  const t = useT();
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
      preferredLanguage: form.preferredLanguage || "en",
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
        <h1 className="settings__title">{t("settings.title")}</h1>
        <p className="settings__loading">{t("settings.loading")}</p>
      </section>
    );
  }

  return (
    <section className="settings">
      <h1 className="settings__title">{t("settings.title")}</h1>
      <p className="settings__subtitle">{t("settings.subtitle")}</p>

      <form className="settings__form" onSubmit={handleSubmit}>
        <div className="settings__group">
          <h2 className="settings__group-title">
            <IconLanguage size={20} stroke={1.75} aria-hidden="true" />
            {t("language.title")}
          </h2>
          <p className="settings__group-hint">{t("language.hint")}</p>
          <fieldset className="settings__fieldset">
            <legend className="settings__legend">{t("language.title")}</legend>
            <div className="settings__radio-row">
              <RadioOption
                name="preferredLanguage"
                value="en"
                label={t("language.english")}
                currentValue={form.preferredLanguage}
                onChange={(value) => updateField("preferredLanguage", value)}
              />
              <RadioOption
                name="preferredLanguage"
                value="es"
                label={t("language.spanish")}
                currentValue={form.preferredLanguage}
                onChange={(value) => updateField("preferredLanguage", value)}
              />
            </div>
          </fieldset>
        </div>

        <div className="settings__group">
          <h2 className="settings__group-title">
            <IconGauge size={20} stroke={1.75} aria-hidden="true" />
            {t("settings.difficulty")}
          </h2>
          <p className="settings__group-hint">{t("settings.difficultyHint")}</p>
          <select
            className="settings__select"
            value={form.preferredDifficulty}
            onChange={(event) =>
              updateField("preferredDifficulty", event.target.value)
            }
          >
            <option value="">{t("settings.noPreference")}</option>
            <option value="Beginner">{t("card.beginnerLevel")}</option>
            <option value="Intermediate">{t("card.intermediateLevel")}</option>
            <option value="Advanced">{t("card.advancedLevel")}</option>
          </select>
        </div>

        <div className="settings__group">
          <h2 className="settings__group-title">
            <IconBulb size={20} stroke={1.75} aria-hidden="true" />
            {t("settings.learningStyle")}
          </h2>

          <fieldset className="settings__fieldset">
            <legend className="settings__legend">{t("settings.pacing")}</legend>
            <div className="settings__radio-row">
              <RadioOption
                name="pacing"
                value=""
                label={t("settings.noPreference")}
                currentValue={form.pacing}
                onChange={(value) => updateField("pacing", value)}
              />
              <RadioOption
                name="pacing"
                value="keyPointsOnly"
                label={t("settings.keyPoints")}
                currentValue={form.pacing}
                onChange={(value) => updateField("pacing", value)}
              />
              <RadioOption
                name="pacing"
                value="stepByStep"
                label={t("settings.stepByStep")}
                currentValue={form.pacing}
                onChange={(value) => updateField("pacing", value)}
              />
            </div>
          </fieldset>

          <fieldset className="settings__fieldset">
            <legend className="settings__legend">{t("settings.explanationStyle")}</legend>
            <div className="settings__radio-row">
              <RadioOption
                name="explanationStyle"
                value=""
                label={t("settings.noPreference")}
                currentValue={form.explanationStyle}
                onChange={(value) => updateField("explanationStyle", value)}
              />
              <RadioOption
                name="explanationStyle"
                value="analogies"
                label={t("settings.analogies")}
                currentValue={form.explanationStyle}
                onChange={(value) => updateField("explanationStyle", value)}
              />
              <RadioOption
                name="explanationStyle"
                value="technical"
                label={t("settings.technical")}
                currentValue={form.explanationStyle}
                onChange={(value) => updateField("explanationStyle", value)}
              />
            </div>
          </fieldset>
        </div>

        <div className="settings__group">
          <h2 className="settings__group-title">
            <IconAccessible size={20} stroke={1.75} aria-hidden="true" />
            {t("settings.accessibility")}
          </h2>

          <ToggleRow
            title={t("settings.collapsedTitle")}
            hint={t("settings.collapsedHint")}
            checked={form.sectionsCollapsedByDefault}
            onChange={(value) => updateField("sectionsCollapsedByDefault", value)}
          />

          <ToggleRow
            title={t("settings.largerTitle")}
            hint={t("settings.largerHint")}
            checked={form.largerText}
            onChange={(value) => updateField("largerText", value)}
          />

          <ToggleRow
            title={t("settings.motionTitle")}
            hint={t("settings.motionHint")}
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
              t("settings.saving")
            ) : (
              <>
                <IconDeviceFloppy size={18} stroke={2} aria-hidden="true" />
                {t("settings.save")}
              </>
            )}
          </button>

          {saveState === "saved" && (
            <span className="settings__save-confirmation">
              <IconCheck size={18} stroke={2} aria-hidden="true" />
              {t("settings.saved")}
            </span>
          )}

          {saveState === "error" && (
            <span className="settings__save-error">
              {t("settings.error")}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

export default SettingsPage;
