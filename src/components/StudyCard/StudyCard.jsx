import "./StudyCard.css";
import { useId, useLayoutEffect, useRef, useState } from "react";
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

  switch (name) {
    case "check":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.5 2.5 5-5.5" />
        </svg>
      );
    case "beginner":
      return (
        <svg {...common}>
          <path d="M4 5.5C6 4.5 9 4.5 12 6c3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5z" />
          <path d="M12 6v13" />
        </svg>
      );
    case "technical":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      );
    case "analogy":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-2 5-5 2 2-5z" />
        </svg>
      );
    case "code":
      return (
        <svg {...common}>
          <path d="M9 8l-4.5 4L9 16M15 8l4.5 4L15 16" />
        </svg>
      );
    case "mistake":
      return (
        <svg {...common}>
          <path d="M12 3.5l9.5 16.5H2.5z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    default:
      return null;
  }
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

function AccordionSection({
  id,
  icon,
  label,
  isOpen,
  onToggle,
  disabled,
  children,
}) {
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  return (
    <div className="study-card__accordion-item">
      <h3 className="study-card__accordion-heading">
        <button
          type="button"
          id={buttonId}
          className="study-card__accordion-button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          disabled={disabled}
        >
          <span className="study-card__accordion-label">
            <Icon name={icon} className="study-card__section-icon" />
            {label}
          </span>
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
        className="study-card__accordion-panel"
        hidden={!isOpen}
      >
        {children}
      </div>
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
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [openSections, setOpenSections] = useState(() =>
    getInitialOpenSections(sectionsCollapsedByDefault, explanationStyle),
  );
  const baseId = useId();
  const hasUserToggledRef = useRef(false);

  // sectionsCollapsedByDefault often arrives from an async profile fetch that can
  // resolve after this card has already mounted with the fallback default — sync
  // once it settles, but only until the learner actually toggles something by hand.
  useLayoutEffect(() => {
    if (hasUserToggledRef.current) {
      return;
    }

    setOpenSections(getInitialOpenSections(sectionsCollapsedByDefault, explanationStyle));
  }, [sectionsCollapsedByDefault, explanationStyle]);

  const effectivelySaved = isSaved || isSavedExternally;

  const toggleSection = (key) => {
    hasUserToggledRef.current = true;
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
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

  const sections = [
    {
      key: "beginner",
      icon: "beginner",
      label: "Beginner-Friendly Explanation",
      content: topic.beginnerExplanation,
    },
    {
      key: "technical",
      icon: "technical",
      label: "Technical Definition",
      content: topic.technicalDefinition,
    },
    {
      key: "analogy",
      icon: "analogy",
      label: "Real-World Analogy",
      content: topic.analogy,
    },
    {
      key: "code",
      icon: "code",
      label: "Code Example",
      content: topic.codeExample ? (
        <pre className="study-card__code">
          <code>{topic.codeExample}</code>
        </pre>
      ) : null,
    },
    {
      key: "mistake",
      icon: "mistake",
      label: "Common Beginner Mistake",
      content: topic.commonMistake,
    },
  ];

  const relatedTopics = topic.relatedTopics?.filter(Boolean) ?? [];

  return (
    <article className="study-card">
      <div className="study-card__inner">
        <h2 className="study-card__title">{topic.title}</h2>

        {(topic.subject?.name || topic.difficulty || topic.category) && (
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
        )}

        <div className="study-card__simple">
          <h3 className="study-card__simple-label">
            <Icon name="check" className="study-card__simple-icon" />
            Simple Definition
          </h3>
          <p className="study-card__simple-definition">
            {topic.simpleDefinition}
          </p>
        </div>

        <div className="study-card__accordion">
          {sections.map(
            (section) =>
              section.content && (
                <AccordionSection
                  key={section.key}
                  id={`${baseId}-${section.key}`}
                  icon={section.icon}
                  label={section.label}
                  isOpen={Boolean(openSections[section.key])}
                  onToggle={() => toggleSection(section.key)}
                  disabled={disabled}
                >
                  {typeof section.content === "string" ? (
                    renderParagraphs(section.content)
                  ) : (
                    section.content
                  )}
                </AccordionSection>
              ),
          )}
        </div>

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

            {/* Quiz button removed */}

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
