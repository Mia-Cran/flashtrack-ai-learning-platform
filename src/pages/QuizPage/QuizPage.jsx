import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { API_BASE_URL } from "../../utils/api";
import StudyCard from "../../components/StudyCard/StudyCard";
import { quizHasUnusableQuestions } from "../../utils/quizQuality";
import { useI18n } from "../../i18n";
import "./QuizPage.css";

function formatAttemptDate(value, locale) {
  try {
    return new Date(value).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function difficultyLabel(t, difficulty) {
  if (difficulty === "Beginner") return t("quiz.beginner");
  if (difficulty === "Intermediate") return t("quiz.intermediate");
  if (difficulty === "Advanced") return t("quiz.advanced");
  return difficulty;
}

function PastAttempts({ attempts }) {
  const { t, locale } = useI18n();

  if (!attempts?.length) {
    return null;
  }

  return (
    <div className="quiz-past-attempts">
      <h3 className="quiz-past-attempts__title">{t("quiz.pastScores")}</h3>
      <ul className="quiz-past-attempts__list">
        {attempts.map((attempt) => (
          <li key={attempt._id} className="quiz-past-attempts__item">
            <span>
              {attempt.score}/{attempt.maxScore} ({attempt.percent}%)
            </span>
            <span className="quiz-past-attempts__meta">
              {difficultyLabel(t, attempt.difficulty)} ·{" "}
              {formatAttemptDate(attempt.completedAt, locale)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuizPage() {
  const { topicId } = useParams();
  const { t } = useI18n();
  const [quiz, setQuiz] = useState(null);
  const [difficulty, setDifficulty] = useState("Beginner");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [review, setReview] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState([]);

  function loadAttempts(quizId) {
    const token = localStorage.getItem("jwt");
    if (!token || !quizId) {
      setAttempts([]);
      return Promise.resolve();
    }

    return fetch(`${API_BASE_URL}/quizzes/${quizId}/responses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : { attempts: [] }))
      .then((data) => {
        setAttempts(data.attempts || []);
      })
      .catch(() => {
        setAttempts([]);
      });
  }

  // Load the quiz whenever the topic in the URL changes. The `cancelled`
  // flag stops a slow response for an old topic from overwriting the new one.
  useEffect(() => {
    let cancelled = false;

    // Reset inside the promise chain (not synchronously in the effect body)
    // so React doesn't re-render twice before the request even starts.
    Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setIsLoading(true);
        setError("");
        setSubmitted(false);
        setScore(null);
        setReview([]);
        setAttempts([]);
        return fetch(`${API_BASE_URL}/quizzes/${topicId}`);
      })
      .then((res) => {
        if (cancelled || res === null) return null;
        if (!res.ok) throw new Error(t("quiz.notFound"));
        return res.json();
      })
      .then((data) => {
        if (cancelled || data === null) return null;
        setQuiz(data);
        setDifficulty("Beginner");
        setCurrentQuestionIndex(0);
        setResponses(
          new Array(data.questions?.Beginner?.length ?? 0).fill(null),
        );
        return loadAttempts(data._id);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [topicId, t]);

  if (isLoading) {
    return <div className="quiz-page">{t("quiz.loading")}</div>;
  }

  if (error || !quiz) {
    return (
      <div className="quiz-page">
        {t("quiz.error", { message: error || t("quiz.notFound") })}
      </div>
    );
  }

  const questions = quiz.questions?.[difficulty] ?? [];
  if (quizHasUnusableQuestions(questions)) {
    return (
      <div className="quiz-page">
        {t("quiz.badQuestions")}
      </div>
    );
  }
  const total = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === total - 1;

  function handleAnswerChange(answer) {
    const newResponses = [...responses];
    newResponses[currentQuestionIndex] = answer;
    setResponses(newResponses);
  }

  function handleNext() {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }

  function handleSubmit() {
    const token = localStorage.getItem("jwt");
    if (!token) {
      setError(t("quiz.mustLogin"));
      return;
    }

    fetch(`${API_BASE_URL}/quizzes/${quiz._id}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        difficulty,
        responses: responses.map((answer) => ({ userAnswer: answer })),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(t("quiz.failedSubmit"));
        return res.json();
      })
      .then((data) => {
        setScore(data.score);
        setReview(data.review || []);
        setSubmitted(true);
        return loadAttempts(quiz._id);
      })
      .catch((err) => {
        setError(err.message);
      });
  }

  if (submitted) {
    const missedCount = review.filter((entry) => !entry.isCorrect).length;
    const studyTopic = quiz.topic
      ? {
          ...quiz.topic,
          title: quiz.topic.title || quiz.topic.term,
          beginnerExplanation:
            quiz.topic.beginnerExplanation || quiz.topic.beginnerDefinition,
        }
      : null;

    return (
      <section className="quiz-page">
        <div className="quiz-result">
          <h2>{t("quiz.complete")}</h2>
          <div className="quiz-score">
            <div className="score-number">
              {score}/{total}
            </div>
            <div className="score-percentage">
              {total > 0 ? Math.round((score / total) * 100) : 0}%
            </div>
          </div>
          <p className="score-message">
            {score === total && t("quiz.perfect")}
            {score < total && score / total >= 0.8 && t("quiz.great")}
            {score / total >= 0.6 &&
              score / total < 0.8 &&
              t("quiz.good")}
            {score / total < 0.6 && t("quiz.reviewMaterial")}
          </p>

          {missedCount > 0 && studyTopic && (
            <div className="quiz-review-flashcard">
              <h3 className="quiz-review-flashcard__title">
                {t("quiz.reviewCard")}
              </h3>
              <p className="quiz-review-flashcard__hint">
                {t("quiz.missedHint", {
                  count: missedCount,
                  questions:
                    missedCount === 1
                      ? t("quiz.question")
                      : t("quiz.questions"),
                })}
              </p>
              <StudyCard topic={studyTopic} isSavedExternally />
            </div>
          )}

          <PastAttempts attempts={attempts} />
          <button
            className="quiz-restart-button"
            onClick={() => {
              setSubmitted(false);
              setCurrentQuestionIndex(0);
              setResponses(new Array(total).fill(null));
              setScore(null);
              setReview([]);
            }}
          >
            {t("quiz.tryAgain")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-page">
      <div className="quiz-header">
        <h1>{t("quiz.title", { term: quiz.topic?.term })}</h1>
        <div className="quiz-controls">
          <label>
            {t("quiz.difficulty")}
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setCurrentQuestionIndex(0);
                setResponses(
                  new Array(
                    quiz.questions?.[e.target.value]?.length ?? 0,
                  ).fill(null),
                );
              }}
              disabled={submitted}
            >
              <option value="Beginner">{t("quiz.beginner")}</option>
              <option value="Intermediate">{t("quiz.intermediate")}</option>
              <option value="Advanced">{t("quiz.advanced")}</option>
            </select>
          </label>
        </div>
      </div>

      <PastAttempts attempts={attempts} />

      {total === 0 && (
        <p className="quiz-empty">
          {t("quiz.emptyLevel", {
            difficulty: difficultyLabel(t, difficulty),
          })}
        </p>
      )}

      {total > 0 && (
      <div className="quiz-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((currentQuestionIndex + 1) / total) * 100}%`,
            }}
          />
        </div>
        <p className="progress-text">
          {t("quiz.questionOf", {
            current: currentQuestionIndex + 1,
            total,
          })}
        </p>
      </div>
      )}

      {total > 0 && (
      <div className="quiz-question">
        <h3>{currentQuestion.text}</h3>

        <div className="quiz-answers">
          {currentQuestion.type === "multipleChoice" && (
            <div className="answer-options">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className="answer-option">
                  <input
                    type="radio"
                    name="answer"
                    value={String.fromCharCode(65 + index)}
                    checked={
                      responses[currentQuestionIndex] ===
                      String.fromCharCode(65 + index)
                    }
                    onChange={(e) => handleAnswerChange(e.target.value)}
                  />
                  <span>
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === "trueFalse" && (
            <div className="answer-options">
              {["true", "false"].map((option) => (
                <label key={option} className="answer-option">
                  <input
                    type="radio"
                    name="answer"
                    value={option === "true"}
                    checked={responses[currentQuestionIndex] === (option === "true")}
                    onChange={() => handleAnswerChange(option === "true")}
                  />
                  <span>{option === "true" ? t("quiz.true") : t("quiz.false")}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === "shortAnswer" && (
            <input
              type="text"
              className="answer-input"
              placeholder={t("quiz.placeholder")}
              value={responses[currentQuestionIndex] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />
          )}
        </div>

        <div className="quiz-navigation">
          <button
            className="quiz-button"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            {t("quiz.previous")}
          </button>

          <button
            className="quiz-button quiz-button--primary"
            onClick={handleNext}
            disabled={responses[currentQuestionIndex] === null}
          >
            {isLastQuestion ? t("quiz.submit") : t("quiz.next")}
          </button>
        </div>
      </div>
      )}
    </section>
  );
}

export default QuizPage;
