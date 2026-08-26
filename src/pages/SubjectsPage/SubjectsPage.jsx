import "./SubjectsPage.css";
import { Navigate } from "react-router";

// Groups saved topics by subject (falling back to the AI-generated category
// for older topics saved before Subjects existed -- same fallback as the
// Dashboard's subject count), sorted by how many topics fall under each one.
function groupBySubject(savedTopics) {
  const groupsByName = {};

  savedTopics.forEach((topic) => {
    const name = topic.subject?.name || topic.category || "Uncategorized";

    if (!groupsByName[name]) {
      groupsByName[name] = [];
    }

    groupsByName[name].push(topic);
  });

  return Object.entries(groupsByName)
    .map(([name, topics]) => ({ name, topics }))
    .sort((a, b) => b.topics.length - a.topics.length);
}

function SubjectsPage({ isLoggedIn, savedTopics = [] }) {
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const subjectGroups = groupBySubject(savedTopics);

  return (
    <section className="subjects">
      <h1 className="subjects__title">Your Subjects</h1>
      <p className="subjects__subtitle">
        {subjectGroups.length === 0
          ? "Save a topic to see it show up here."
          : `You're studying across ${subjectGroups.length} ${
              subjectGroups.length === 1 ? "subject" : "subjects"
            }.`}
      </p>

      {subjectGroups.length === 0 ? (
        <p className="subjects__empty">
          No saved topics yet — search for something to get started.
        </p>
      ) : (
        <div className="subjects__groups">
          {subjectGroups.map((group) => (
            <div className="subjects__group" key={group.name}>
              <div className="subjects__group-header">
                <h2 className="subjects__group-name">{group.name}</h2>
                <span className="subjects__group-count">
                  {group.topics.length}{" "}
                  {group.topics.length === 1 ? "topic" : "topics"}
                </span>
              </div>

              <div className="subjects__group-topics">
                {group.topics.map((topic) => (
                  <div className="subjects__topic-card" key={topic._id}>
                    <span className="subjects__topic-title">
                      {topic.term}
                    </span>
                    <span className="subjects__topic-simple">
                      {topic.simpleDefinition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SubjectsPage;
