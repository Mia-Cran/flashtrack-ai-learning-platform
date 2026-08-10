import StudyCard from "../../components/StudyCard/StudyCard";
import "./SavedTopicsPage.css";

function SavedTopicsPage({ savedTopics, onDeleteTopic }) {
  return (
    <section className="saved">
      <h1 className="saved__title">Saved Topics</h1>
      <p className="saved__description">
        View and review your saved software engineering concepts.
      </p>
      {savedTopics.length === 0 ? (
        <p className="saved__empty">No saved topics yet.</p>
      ) : (
        <div className="saved__topics">
          {savedTopics.map((topic) => (
            <StudyCard
              key={topic._id}
              topic={{
                ...topic,
                title: topic.term,
                beginnerExplanation: topic.beginnerDefinition,
              }}
              onDeleteTopic={onDeleteTopic}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default SavedTopicsPage;
