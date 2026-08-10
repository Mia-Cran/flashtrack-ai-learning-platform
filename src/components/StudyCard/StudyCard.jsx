import "./StudyCard.css";
import { useState } from "react";

function StudyCard({ topic, onSaveTopic, onDeleteTopic }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <article className="study-card">
      <h2 className="study-card__title">{topic.title}</h2>
      <div className="study-card__simple-info">
        <h3 className="study-card__subtitle">Simple Definition</h3>
        <p className="study-card__simple-definition">
          {topic.simpleDefinition}
        </p>
      </div>
      <h3 className="study-card__subtitle">Beginner-Friendly Explanation</h3>
      <p>{topic.beginnerExplanation}</p>
      <h3 className="study-card__subtitle">Technical Definition</h3>
      <p>{topic.technicalDefinition}</p>
      <h3 className="study-card__subtitle">Real-World Analogy</h3>
      <p>{topic.analogy}</p>
      <h3 className="study-card__subtitle">Code Example</h3>
      <pre className="study-card__code">
        <code>{topic.codeExample}</code>
      </pre>
      <h3 className="study-card__subtitle">Common Beginner Mistake</h3>
      <p>{topic.commonMistake}</p>
      <h3 className="study-card__subtitle">Category</h3>
      <p>{topic.category}</p>
      <h3 className="study-card__subtitle">Difficulty</h3>
      <p>{topic.difficulty}</p>
      <h3 className="study-card__subtitle">Related Topics</h3>
      <ul>
        {topic.relatedTopics?.map((relatedTopic) => (
          <li key={relatedTopic}>{relatedTopic}</li>
        ))}
      </ul>
     
      {onSaveTopic && (
        <button
          className="study-card__save-button"
          type="button"
          onClick={handleSaveTopic}
          disabled={isSaving || isSaved}
        >
          {isSaving ? "Saving..." : isSaved ? "Saved ✓" : "Save Topic"}
        </button>
      )}

      {onDeleteTopic && (
        <button
          className="study-card__delete-button"
          type="button"
          onClick={() => onDeleteTopic(topic._id)}
        >
          Delete Topic
        </button>
      )}
    </article>
  );
}

export default StudyCard;
