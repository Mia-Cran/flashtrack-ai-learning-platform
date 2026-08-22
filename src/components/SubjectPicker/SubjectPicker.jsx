import { useEffect, useState } from "react";
import "./SubjectPicker.css";

function SubjectPicker({ id, value, onChange, className, disabled = false }) {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("https://software-engineering-study-tracker.onrender.com/subjects")
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
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <select
      id={id}
      className={`subject-picker${className ? ` ${className}` : ""}`}
      value={value || ""}
      onChange={(event) => onChange(event.target.value || null)}
      disabled={isLoading || disabled}
    >
      <option value="">
        {isLoading ? "Loading subjects..." : "Choose a subject..."}
      </option>
      {subjects.map((subject) => (
        <option key={subject._id} value={subject._id}>
          {subject.name}
        </option>
      ))}
    </select>
  );
}

export default SubjectPicker;
