import "./StudyCard.css";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../../utils/api";

const SECTION_KEYS = ["beginner", "technical", "analogy", "code", "mistake"];

function getInitialOpenSections(sectionsCollapsedByDefault, explanationStyle) {
  if (sectionsCollapsedByDefault) {
    // Open the preferred section based on explanation style
    if (explanationStyle === "technical") {
      return { technical: true };
    }
    // Default to analogies
    return { analogy: true };
  }

  return SECTION_KEYS.reduce((openByKey, key) => {
    openByKey[key] = true;
    return openByKey;
  }, {});
}

// Flip back includes the simple definition too. When the learner prefers
// collapsed sections, keep simple closed and only open their chosen style.
// When they prefer everything open, open all.
function getInitialFlipOpenSections(sectionsCollapsedByDefault, explanationStyle) {
  const openByKey = getInitialOpenSections(
    sectionsCollapsedByDefault,
    explanationStyle,
  );

  openByKey.simple = !sectionsCollapsedByDefault;
  return openByKey;
}

function Icon({ name, className }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
  };

  if (name === "chevron") {
    return (
      <svg {...common}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    );
  }

  if (name === "speaker") {
    return (
      <svg {...common}>
        <path d="M11 5L6 9H3v6h3l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 010 7" />
        <path d="M18.5 5.5a9 9 0 010 13" />
      </svg>
    );
  }

  if (name === "speakerOff") {
    return (
      <svg {...common}>
        <path d="M11 5L6 9H3v6h3l5 4V5z" />
        <path d="M22 9l-6 6M16 9l6 6" />
      </svg>
    );
  }

  return null;
}

const canUseSpeech =
  typeof window !== "undefined" && "speechSynthesis" in window;

function stopSpeech() {
  if (canUseSpeech) {
    window.speechSynthesis.cancel();
  }
}

function speakText(text, { onStart, onEnd } = {}) {
  if (!canUseSpeech || !text?.trim()) {
    return false;
  }

  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.rate = 0.95;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

function HearButton({
  label,
  text,
  disabled = false,
  className = "",
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  if (!canUseSpeech) {
    return null;
  }

  const handleClick = (event) => {
    event.stopPropagation();

    if (disabled || !text?.trim()) {
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    speakText(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  return (
    <button
      type="button"
      className={`study-card__hear-button ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled || !text?.trim()}
      aria-pressed={isSpeaking}
      aria-label={isSpeaking ? `Stop pronunciation of ${label}` : `Hear pronunciation of ${label}`}
      title={isSpeaking ? "Stop" : `Hear “${label}”`}
    >
      <Icon
        name={isSpeaking ? "speakerOff" : "speaker"}
        className="study-card__hear-icon"
      />
      <span>{isSpeaking ? "Stop" : "Hear it"}</span>
    </button>
  );
}

// AI-generated text sometimes comes back as one long paragraph, and older saved
// topics were saved before paragraph breaks were requested at all -- splitting on
// blank lines (and falling back to the whole string as one paragraph when there
// aren't any) means both old and new content render the same way, just broken up
// into something actually readable instead of one wall of text.
function renderParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => <p key={index}>{paragraph}</p>);
}

function getLearningSections(topic) {
  return [
    {
      key: "simple",
      label: "Simple Definition",
      content: topic.simpleDefinition,
      isCode: false,
    },
    {
      key: "beginner",
      label: "Beginner-Friendly Explanation",
      content: topic.beginnerExplanation,
      isCode: false,
    },
    {
      key: "technical",
      label: "Technical Definition",
      content: topic.technicalDefinition,
      isCode: false,
    },
    {
      key: "analogy",
      label: "Real-World Analogy",
      content: topic.analogy,
      isCode: false,
    },
    {
      key: "code",
      label: "Code Example",
      content: topic.codeExample,
      isCode: true,
    },
    {
      key: "mistake",
      label: "Common Beginner Mistake",
      content: topic.commonMistake,
      isCode: false,
    },
  ].filter((section) => Boolean(section.content));
}

function FlipStudyDeck({
  topic,
  disabled = false,
  sectionsCollapsedByDefault = true,
  explanationStyle = "analogies",
  isFlipped,
  onFlip,
}) {
  const [openSections, setOpenSections] = useState(() =>
    getInitialFlipOpenSections(sectionsCollapsedByDefault, explanationStyle),
  );
  const hasUserToggledRef = useRef(false);
  const learningSections = useMemo(() => getLearningSections(topic), [topic]);
  const baseId = useId();

  useLayoutEffect(() => {
    if (hasUserToggledRef.current) {
      return;
    }

    setOpenSections(
      getInitialFlipOpenSections(sectionsCollapsedByDefault, explanationStyle),
    );
  }, [sectionsCollapsedByDefault, explanationStyle]);

  const flip = () => {
    if (disabled) {
      return;
    }
    stopSpeech();
    onFlip();
  };

  const toggleSection = (key) => {
    hasUserToggledRef.current = true;
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleKeyDown = (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      flip();
    }
  };

  return (
    <div className="study-card__flip-mode">
      <div className="study-card__flip-scene">
        <div
          className={`study-card__flip${isFlipped ? " study-card__flip--flipped" : ""}`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={flip}
          onKeyDown={handleKeyDown}
          aria-disabled={disabled || undefined}
          aria-pressed={isFlipped}
          aria-label={
            isFlipped
              ? `${topic.title} learning guide. Press to show the term again.`
              : `${topic.title}. Press to flip and see ways to learn it.`
          }
        >
          <div className="study-card__flip-inner">
            <div className="study-card__flip-face study-card__flip-face--front">
              <p className="study-card__flip-term">{topic.title}</p>
              <div className="study-card__flip-front-footer">
                <HearButton
                  label={topic.title}
                  text={topic.title}
                  disabled={disabled}
                />
                <p className="study-card__flip-hint">Tap to flip</p>
              </div>
            </div>

            <div
              className="study-card__flip-face study-card__flip-face--back"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <div className="study-card__flip-back-header">
                <p className="study-card__flip-kicker">Ways to learn it</p>
                <button
                  type="button"
                  className="study-card__flip-back-button"
                  onClick={flip}
                  disabled={disabled}
                >
                  Flip
                </button>
              </div>

              <div className="study-card__flip-answer">
                {learningSections.map((section) => {
                  const panelId = `${baseId}-flip-${section.key}-panel`;
                  const buttonId = `${baseId}-flip-${section.key}-button`;
                  const isOpen = Boolean(openSections[section.key]);

                  return (
                    <section
                      key={section.key}
                      className="study-card__flip-section"
                    >
                      <h3 className="study-card__flip-section-heading">
                        <button
                          type="button"
                          id={buttonId}
                          className="study-card__flip-section-button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => toggleSection(section.key)}
                          disabled={disabled}
                        >
                          <span>{section.label}</span>
                          <Icon
                            name="chevron"
                            className={`study-card__chevron${
                              isOpen ? " study-card__chevron--open" : ""
                            }`}
                          />
                        </button>
                      </h3>
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="study-card__flip-section-panel"
                        hidden={!isOpen}
                      >
                        {!section.isCode && (
                          <HearButton
                            label={section.label}
                            text={section.content}
                            disabled={disabled}
                            className="study-card__hear-button--inline"
                          />
                        )}
                        {section.isCode ? (
                          <pre className="study-card__code">
                            <code>{section.content}</code>
                          </pre>
                        ) : (
                          renderParagraphs(section.content)
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicBadges({ topic }) {
  if (!(topic.subject?.name || topic.difficulty || topic.category)) {
    return null;
  }

  return (
    <div className="study-card__badges">
      {topic.subject?.name && (
        <span className="study-card__pill study-card__pill--category">
          <span className="sr-only">Subject: </span>
          {topic.subject.name}
        </span>
      )}
      {topic.difficulty && (
        <span className="study-card__pill study-card__pill--difficulty">
          <span className="sr-only">Difficulty: </span>
          {topic.difficulty}
        </span>
      )}
      {topic.category && (
        <span className="study-card__pill study-card__pill--category">
          <span className="sr-only">Category: </span>
          {topic.category}
        </span>
      )}
    </div>
  );
}

function StudyCard({
  topic,
  onSaveTopic,
  onDeleteTopic,
  onRelatedTopicClick,
  onRegenerateTopic,
  isSavedExternally = false,
  disabled = false,
  sectionsCollapsedByDefault = true,
  explanationStyle = "analogies",
}) {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");
  const baseId = useId();

  const topicKey = topic._id || topic.searchTerm || topic.title || topic.term;

  // A new search reuses this component with different topic data. Reset
  // local "saved / flipped / quiz" UI so the previous card's state does
  // not stick to the new one.
  useEffect(() => {
    setIsSaved(false);
    setIsFlipped(false);
    setIsSaving(false);
    setIsRegenerating(false);
    setIsLoadingQuiz(false);
    setQuizError("");
  }, [topicKey]);

  const effectivelySaved = isSaved || isSavedExternally;

  const handleFlip = () => {
    if (disabled) {
      return;
    }
    setIsFlipped((prev) => !prev);
  };

  const handleSaveTopic = async () => {
    setIsSaving(true);

    try {
      await onSaveTopic(topic);
      setIsSaved(true);
    } catch (err) {
      console.error("Failed to save topic:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateTopic = async (difficulty) => {
    if (!onRegenerateTopic) return;

    setIsRegenerating(true);

    try {
      await onRegenerateTopic(topic._id, difficulty);
    } catch (err) {
      console.error("Failed to regenerate topic:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTakeQuiz = async () => {
    setIsLoadingQuiz(true);
    setQuizError("");

    try {
      const token = localStorage.getItem("jwt");
      const headers = { "Content-Type": "application/json" };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Generate the quiz if it doesn't exist yet. 201 means it was just
      // created, 409 means one already exists -- both are fine to continue.
      // Anything else (401 not logged in, 500 generation failed, ...) means
      // there is no quiz to show, so stay here and tell the user why.
      const res = await fetch(`${API_BASE_URL}/quizzes/${topic._id}/generate`, {
        method: "POST",
        headers,
      });

      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Could not load quiz (error ${res.status})`);
      }

      navigate(`/quiz/${topic._id}`);
    } catch (err) {
      console.error("Failed to load quiz:", err);
      setQuizError(err.message || "Could not load quiz. Please try again.");
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const relatedTopics = topic.relatedTopics?.filter(Boolean) ?? [];

  return (
    <article className="study-card">
      <div className="study-card__inner">
        <div className="study-card__header-row">
          <h2 className="study-card__title">{topic.title}</h2>
          <button
            type="button"
            className="study-card__flip-corner-button"
            onClick={handleFlip}
            disabled={disabled}
            aria-pressed={isFlipped}
          >
            Flip
          </button>
        </div>

        <TopicBadges topic={topic} />

        <FlipStudyDeck
          topic={topic}
          disabled={disabled}
          sectionsCollapsedByDefault={sectionsCollapsedByDefault}
          explanationStyle={explanationStyle}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />

        {relatedTopics.length > 0 && (
          <div className="study-card__related">
            <h3 className="study-card__related-label">Related Topics</h3>
            <ul className="study-card__related-list">
              {relatedTopics.map((relatedTopic) =>
                onRelatedTopicClick ? (
                  <li key={relatedTopic}>
                    <button
                      type="button"
                      className="study-card__pill study-card__pill--category study-card__pill--clickable"
                      onClick={() => onRelatedTopicClick(relatedTopic)}
                      disabled={disabled}
                    >
                      {relatedTopic}
                    </button>
                  </li>
                ) : (
                  <li key={relatedTopic}>
                    <span className="study-card__pill study-card__pill--category">
                      {relatedTopic}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        {(onSaveTopic || onDeleteTopic || onRegenerateTopic) && (
          <div className="study-card__actions">
            {onSaveTopic && (
              <button
                className="study-card__save-button"
                type="button"
                onClick={handleSaveTopic}
                disabled={isSaving || effectivelySaved || disabled}
              >
                {isSaving
                  ? "Saving..."
                  : effectivelySaved
                    ? "Saved ✓"
                    : "Save Topic"}
              </button>
            )}

            {effectivelySaved && onRegenerateTopic && (
              <div className="study-card__difficulty-selector">
                <label htmlFor={`difficulty-${baseId}`} className="study-card__difficulty-label">
                  View at:
                </label>
                <select
                  id={`difficulty-${baseId}`}
                  className="study-card__difficulty-select"
                  value={topic.difficulty || "Beginner"}
                  onChange={(e) => handleRegenerateTopic(e.target.value)}
                  disabled={isRegenerating || disabled}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                {isRegenerating && <span className="study-card__regenerating">Regenerating...</span>}
              </div>
            )}

            {effectivelySaved && (
              <button
                className="study-card__quiz-button"
                type="button"
                onClick={handleTakeQuiz}
                disabled={isLoadingQuiz || disabled}
              >
                {isLoadingQuiz ? "Writing your quiz..." : "Take Quiz"}
              </button>
            )}

            {quizError && (
              <p className="study-card__quiz-error" role="alert">
                {quizError}
              </p>
            )}

            {onDeleteTopic && (
              <button
                className="study-card__delete-button"
                type="button"
                onClick={() => onDeleteTopic(topic._id)}
                disabled={disabled}
              >
                Delete Topic
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default StudyCard;
