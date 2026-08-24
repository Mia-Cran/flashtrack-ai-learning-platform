import { useState } from "react";
import { useNavigate } from "react-router";
import StudyCard from "../../components/StudyCard/StudyCard";
import SubjectPicker from "../../components/SubjectPicker/SubjectPicker";
import "./SavedTopicsPage.css";

function SavedTopicsPage({
  savedTopics,
  onDeleteTopic,
  onAssignSubject,
  sectionsCollapsedByDefault = true,
}) {
  const [assigningTopicId, setAssigningTopicId] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const navigate = useNavigate();

  function handleRelatedTopicClick(term) {
    navigate("/search", { state: { searchTerm: term } });
  }

  function handleAssign(topicId, subjectId) {
    if (!subjectId) {
      return;
    }

    setIsAssigning(true);

    onAssignSubject(topicId, subjectId)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsAssigning(false);
        setAssigningTopicId(null);
      });
  }

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
            <div className="saved__topic-block" key={topic._id}>
              {!topic.subject && (
                <div className="saved__uncategorized">
                  <span className="saved__uncategorized-pill">
                    Uncategorized
                  </span>

                  {assigningTopicId === topic._id ? (
                    <SubjectPicker
                      value={null}
                      onChange={(subjectId) =>
                        handleAssign(topic._id, subjectId)
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      className="saved__assign-link"
                      onClick={() => setAssigningTopicId(topic._id)}
                      disabled={isAssigning}
                    >
                      Assign subject
                    </button>
                  )}
                </div>
              )}

              <StudyCard
                topic={{
                  ...topic,
                  title: topic.term,
                  beginnerExplanation: topic.beginnerDefinition,
                }}
                onDeleteTopic={onDeleteTopic}
                onRelatedTopicClick={handleRelatedTopicClick}
                sectionsCollapsedByDefault={sectionsCollapsedByDefault}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SavedTopicsPage;
