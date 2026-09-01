import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { API_BASE_URL } from "../../utils/api";
import "./QuizPage.css";

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

  useEffect(() => {
    fetchQuiz();
  }, [topicId]);

  function fetchQuiz() {
    fetch(`${API_BASE_URL}/quizzes/${topicId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Quiz not found");
        return res.json();
      })
      .then((data) => {
        setQuiz(data);
        setResponses(new Array(5).fill(null));
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  if (isLoading) {
    return <div className="quiz-page">Loading quiz...</div>;
  }

  if (error || !quiz) {
    return <div className="quiz-page">Error: {error || "Quiz not found"}</div>;
  }

  const questions = quiz.questions[difficulty];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

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
            <div className="score-number">{score}/5</div>
            <div className="score-percentage">{(score / 5) * 100}%</div>
          </div>
          <p className="score-message">
            {score === 5 && "Perfect score! 🎉"}
            {score >= 4 && score < 5 && "Great job! 🌟"}
            {score >= 3 && score < 4 && "Good effort! Keep practicing."}
            {score < 3 && "Review the material and try again."}
          </p>
          <button
            className="quiz-restart-button"
            onClick={() => {
              setSubmitted(false);
              setCurrentQuestionIndex(0);
              setResponses(new Array(5).fill(null));
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
                setResponses(new Array(5).fill(null));
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

      <div className="quiz-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((currentQuestionIndex + 1) / 5) * 100}%`,
            }}
          />
        </div>
        <p className="progress-text">
          Question {currentQuestionIndex + 1} of 5
        </p>
      </div>

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
    </section>
  );
}

export default QuizPage;
