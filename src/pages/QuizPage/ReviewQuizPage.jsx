import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { API_BASE_URL } from "../../utils/api";
import "./QuizPage.css";

function ReviewQuizPage() {
  const { reviewQuizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [practiceLoadingId, setPracticeLoadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("jwt");

    if (!token) {
      setError("You must be logged in to take a review quiz");
      setIsLoading(false);
      return undefined;
    }

    Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setIsLoading(true);
        setError("");
        return fetch(`${API_BASE_URL}/quizzes/review/${reviewQuizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => {
        if (cancelled || res === null) return null;
        if (!res.ok) throw new Error("Review quiz not found");
        return res.json();
      })
      .then((data) => {
        if (cancelled || data === null) return;
        setQuiz(data);
        setCurrentQuestionIndex(0);
        setResponses(new Array(data.questions?.length ?? 0).fill(null));
        setSubmitted(false);
        setResult(null);
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
  }, [reviewQuizId]);

  async function handlePracticeTopic(topicId) {
    setPracticeLoadingId(topicId);
    setError("");

    try {
      const token = localStorage.getItem("jwt");
      const headers = { "Content-Type": "application/json" };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/quizzes/${topicId}/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ questionType: "multipleChoice" }),
      });

      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not start practice quiz");
      }

      navigate(`/quiz/${topicId}`);
    } catch (err) {
      setError(err.message || "Could not start practice quiz");
    } finally {
      setPracticeLoadingId(null);
    }
  }

  if (isLoading) {
    return <div className="quiz-page">Loading review quiz...</div>;
  }

  if (error && !quiz) {
    return <div className="quiz-page">Error: {error}</div>;
  }

  const questions = quiz?.questions ?? [];
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

    fetch(`${API_BASE_URL}/quizzes/review/${quiz._id}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        responses: responses.map((answer) => ({ userAnswer: answer })),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to submit review quiz");
        return res.json();
      })
      .then((data) => {
        setResult(data);
        setSubmitted(true);
      })
      .catch((err) => {
        setError(err.message);
      });
  }

  if (submitted && result) {
    const missedTopics = result.missedTopics ?? [];

    return (
      <section className="quiz-page">
        <div className="quiz-result">
          <h2>Review Complete!</h2>
          <div className="quiz-score">
            <div className="score-number">
              {result.score}/{result.maxScore}
            </div>
            <div className="score-percentage">
              {result.maxScore > 0
                ? Math.round((result.score / result.maxScore) * 100)
                : 0}
              %
            </div>
          </div>

          {missedTopics.length === 0 ? (
            <p className="score-message">
              Nice work — you got every topic right. Keep saving cards and
              review again later.
            </p>
          ) : (
            <>
              <p className="score-message">
                You missed {missedTopics.length === 1 ? "this topic" : "these topics"}.
                Practice each one with a focused quiz:
              </p>
              <ul className="quiz-missed-list">
                {missedTopics.map((topic) => (
                  <li className="quiz-missed-item" key={topic._id}>
                    <span className="quiz-missed-term">{topic.term}</span>
                    <button
                      type="button"
                      className="quiz-button quiz-button--primary"
                      onClick={() => handlePracticeTopic(topic._id)}
                      disabled={practiceLoadingId === topic._id}
                    >
                      {practiceLoadingId === topic._id
                        ? "Writing quiz..."
                        : "Practice this topic"}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {error && (
            <p className="quiz-inline-error" role="alert">
              {error}
            </p>
          )}

          <div className="quiz-result-actions">
            <Link to="/home" className="quiz-restart-button">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-page">
      <div className="quiz-header">
        <h1>Review Quiz</h1>
        <p className="quiz-subtitle">
          One question from each of your recent flashcards
        </p>
      </div>

      {error && (
        <p className="quiz-inline-error" role="alert">
          {error}
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
            {currentQuestion?.term ? ` · ${currentQuestion.term}` : ""}
          </p>
        </div>
      )}

      {total > 0 && currentQuestion && (
        <div className="quiz-question">
          <p className="quiz-topic-chip">{currentQuestion.term}</p>
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

export default ReviewQuizPage;
