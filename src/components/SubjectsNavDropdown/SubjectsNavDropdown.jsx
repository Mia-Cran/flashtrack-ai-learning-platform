import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../utils/api";
import { useNavigate } from "react-router";
import "./SubjectsNavDropdown.css";

// Session 10, entry point 2: for a student who knows the subject they want
// but not a specific term to search. Picking a subject here is purely a
// discovery aid -- it drops them on Search with that subject's curated
// example topics, not a filter. Whatever they actually search still gets
// classified by its own true content afterward, same as any other search.
function SubjectsNavDropdown({ disabled = false }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedValue, setSelectedValue] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/subjects`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load subjects");
        }

        return res.json();
      })
      .then((data) => {
        setSubjects(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  function handleChange(event) {
    const subjectId = event.target.value;

    setSelectedValue(subjectId);

    if (!subjectId) {
      return;
    }

    const subject = subjects.find((item) => item._id === subjectId);

    if (!subject) {
      return;
    }

    navigate("/search", {
      state: {
        browseSubjectId: subject._id,
        browseSubjectName: subject.name,
        browseExampleTopics: subject.exampleTopics ?? [],
      },
    });

    setSelectedValue("");
  }

  return (
    <select
      className="header__subjects-dropdown"
      value={selectedValue}
      onChange={handleChange}
      disabled={disabled || subjects.length === 0}
      aria-label="Browse by subject"
    >
      <option value="">Browse Subjects</option>
      {subjects.map((subject) => (
        <option key={subject._id} value={subject._id}>
          {subject.name}
        </option>
      ))}
    </select>
  );
}

export default SubjectsNavDropdown;
