import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { API_BASE_URL } from "../../utils/api";
import "./QuizPage.css";

function formatAttemptDate(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function PastAttempts({ attempts }) {
  if (!attempts?.length) {
    return null;
  }

  return (
    <div className="quiz-past-attempts">
      <h3 className="quiz-past-attempts__title">Your past scores</h3>
      <ul className="quiz-past-attempts__list">
        {attempts.map((attempt) => (
          <li key={attempt._id} className="quiz-past-attempts__item">
            <span>
              {attempt.score}/{attempt.maxScore} ({attempt.percent}%)
            </span>
            <span className="quiz-past-attempts__meta">
              {attempt.difficulty} · {formatAttemptDate(attempt.completedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuizPage() {
  const { topicId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [difficulty, setDifficulty] = useState("Beginner");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
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
        setAttempts([]);
        return fetch(`${API_BASE_URL}/quizzes/${topicId}`);
      })
      .then((res) => {
        if (cancelled || res === null) return null;
        if (!res.ok) throw new Error("Quiz not found");
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
  }, [topicId]);

  if (isLoading) {
    return <div className="quiz-page">Loading quiz...</div>;
  }

  if (error || !quiz) {
    return <div className="quiz-page">Error: {error || "Quiz not found"}</div>;
  }

  // A quiz may be missing a difficulty level (or have an empty one), so never
  // assume there are exactly 5 questions. Use the real count everywhere.
  const questions = quiz.questions?.[difficulty] ?? [];
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
      setError("You must be logged in to submit quizzes");
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
        if (!res.ok) throw new Error("Failed to submit quiz");
        return res.json();
      })
      .then((data) => {
        setScore(data.score);
        setSubmitted(true);
        return loadAttempts(quiz._id);
      })
      .catch((err) => {
        setError(err.message);
      });
  }

  if (submitted) {
    return (
      <section className="quiz-page">
        <div className="quiz-result">
          <h2>Quiz Complete!</h2>
          <div className="quiz-score">
            <div className="score-number">
              {score}/{total}
            </div>
            <div className="score-percentage">
              {total > 0 ? Math.round((score / total) * 100) : 0}%
            </div>
          </div>
          <p className="score-message">
            {score === total && "Perfect score! 🎉"}
            {score < total && score / total >= 0.8 && "Great job! 🌟"}
            {score / total >= 0.6 &&
              score / total < 0.8 &&
              "Good effort! Keep practicing."}
            {score / total < 0.6 && "Review the material and try again."}
          </p>
          <PastAttempts attempts={attempts} />
          <button
            className="quiz-restart-button"
            onClick={() => {
              setSubmitted(false);
              setCurrentQuestionIndex(0);
              setResponses(new Array(total).fill(null));
              setScore(null);
            }}
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-page">
      <div className="quiz-header">
        <h1>{quiz.topic?.term} Quiz</h1>
        <div className="quiz-controls">
          <label>
            Difficulty:
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
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </label>
        </div>
      </div>

      <PastAttempts attempts={attempts} />

      {total === 0 && (
        <p className="quiz-empty">
          No {difficulty} questions yet for this topic. Try another difficulty.
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
          Question {currentQuestionIndex + 1} of {total}
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
                  <span>{option === "true" ? "True" : "False"}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === "shortAnswer" && (
            <input
              type="text"
              className="answer-input"
              placeholder="Type your answer..."
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
            ← Previous
          </button>

          <button
            className="quiz-button quiz-button--primary"
            onClick={handleNext}
            disabled={responses[currentQuestionIndex] === null}
          >
            {isLastQuestion ? "Submit" : "Next →"}
          </button>
        </div>
      </div>
      )}
    </section>
  );
}

export default QuizPage;
