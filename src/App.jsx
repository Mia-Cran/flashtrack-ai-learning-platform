import "./App.css";
import { Routes, Route } from "react-router";
import WelcomePage from "./pages/WelcomePage/WelcomePage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import SearchPage from "./pages/SearchPage/SearchPage";
import SavedTopicsPage from "./pages/SavedTopicsPage/SavedTopicsPage";
import AboutPage from "./pages/AboutPage/AboutPage";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import FeedbackPage from "./pages/FeedbackPage/FeedbackPage";
import SubjectsPage from "./pages/SubjectsPage/SubjectsPage";
import Header from "./components/Header/Header";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "./utils/api";

function App() {
  const [savedTopics, setSavedTopics] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("jwt")),
  );
  const [userName, setUserName] = useState(
    localStorage.getItem("name") || "",
  );
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [learnerProfile, setLearnerProfile] = useState(null);

  const sectionsCollapsedByDefault =
    learnerProfile?.accessibilityPreferences?.sectionsCollapsedByDefault ??
    true;
  const hasLargerText = learnerProfile?.accessibilityPreferences?.largerText ?? false;
  const hasReducedMotion =
    learnerProfile?.accessibilityPreferences?.reduceMotion ?? false;

  function loadTopics(token) {
    return fetch(`${API_BASE_URL}/topics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load topics");
        }

        return res.json();
      })
      .then((topics) => {
        setSavedTopics(topics);
        return topics;
      });
  }

  function loadLearnerProfile(token) {
    return fetch(`${API_BASE_URL}/learner-profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load learner profile");
        }

        return res.json();
      })
      .then((profile) => {
        setLearnerProfile(profile);
        return profile;
      });
  }

  function handleUpdateLearnerProfile(updates) {
    const token = localStorage.getItem("jwt");

    return fetch(`${API_BASE_URL}/learner-profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update learner profile");
        }

        return res.json();
      })
      .then((profile) => {
        setLearnerProfile(profile);
        return profile;
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }

  useEffect(() => {
    const token = localStorage.getItem("jwt");

    if (!token) {
      return;
    }

    loadTopics(token).catch((err) => {
      console.error(err);
    });

    loadLearnerProfile(token).catch((err) => {
      console.error(err);
    });
  }, []);

  function handleSignin(email, password) {
    return fetch(`${API_BASE_URL}/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Signin failed");
        }

        return res.json();
      })
      .then((data) => {
        localStorage.setItem("jwt", data.token);
        localStorage.setItem("name", data.name || "");
        setIsLoggedIn(true);
        setUserName(data.name || "");

        loadLearnerProfile(data.token).catch((err) => {
          console.error(err);
        });

        return loadTopics(data.token).then(() => {
          return data.token;
        });
      });
  }

  function handleSignup(name, email, password) {
    return fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Signup failed");
        }

        return res.json();
      })
      .then(() => {
        return handleSignin(email, password);
      });
  }

  function handleSignout() {
    localStorage.removeItem("jwt");
    localStorage.removeItem("name");
    setSavedTopics([]);
    setIsLoggedIn(false);
    setUserName("");
    setLearnerProfile(null);
  }

  function handleSaveTopic(topic) {
    const token = localStorage.getItem("jwt");

    const backendTopic = {
      term: topic.title,
      searchTerm: topic.searchTerm,
      simpleDefinition: topic.simpleDefinition,
      beginnerDefinition: topic.beginnerExplanation,
      technicalDefinition: topic.technicalDefinition,
      category: topic.category,
      difficulty: topic.difficulty,
      analogy: topic.analogy,
      codeExample: topic.codeExample,
      commonMistake: topic.commonMistake,
      relatedTopics: topic.relatedTopics,
      subject: topic.subject,
    };

    return fetch(`${API_BASE_URL}/topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(backendTopic),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to save topic");
        }

        return res.json();
      })
      .then((savedTopic) => {
        setSavedTopics((prevTopics) => {
          const alreadySaved = prevTopics.some(
            (topic) => topic._id === savedTopic._id,
          );

          if (alreadySaved) {
            return prevTopics;
          }

          return [...prevTopics, savedTopic];
        });

        return savedTopic;
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }

  function handleAssignSubject(topicId, subjectId) {
    const token = localStorage.getItem("jwt");

    return fetch(`${API_BASE_URL}/topics/${topicId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subject: subjectId }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update topic");
        }

        return res.json();
      })
      .then((updatedTopic) => {
        setSavedTopics((prevTopics) =>
          prevTopics.map((topic) =>
            topic._id === updatedTopic._id ? updatedTopic : topic,
          ),
        );

        return updatedTopic;
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }

  function handleDeleteTopic(topicId) {
    const token = localStorage.getItem("jwt");

    return fetch(`${API_BASE_URL}/topics/${topicId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete topic");
        }

        return res.json();
      })
      .then(() => {
        setSavedTopics((prevTopics) =>
          prevTopics.filter((topic) => topic._id !== topicId),
        );
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }
  return (
    <main
      className={`app${hasLargerText ? " app--larger-text" : ""}${
        hasReducedMotion ? " app--reduce-motion" : ""
      }`}
    >
      <Header
        isLoggedIn={isLoggedIn}
        onSignout={handleSignout}
        isSearchLoading={isSearchLoading}
      />
      <Routes>
        <Route
          path="/"
          element={
            <WelcomePage
              onSignin={handleSignin}
              onSignup={handleSignup}
              isLoggedIn={isLoggedIn}
              userName={userName}
              savedTopics={savedTopics}
            />
          }
        />
        <Route
          path="/home"
          element={
            <DashboardPage
              isLoggedIn={isLoggedIn}
              userName={userName}
              savedTopics={savedTopics}
              learnerProfile={learnerProfile}
              onUpdateLearnerProfile={handleUpdateLearnerProfile}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchPage
              onSaveTopic={handleSaveTopic}
              isLoggedIn={isLoggedIn}
              onSignup={handleSignup}
              onSignin={handleSignin}
              onLoadingChange={setIsSearchLoading}
              sectionsCollapsedByDefault={sectionsCollapsedByDefault}
            />
          }
        />
        <Route
          path="/saved"
          element={
            <SavedTopicsPage
              savedTopics={savedTopics}
              onDeleteTopic={handleDeleteTopic}
              onAssignSubject={handleAssignSubject}
              sectionsCollapsedByDefault={sectionsCollapsedByDefault}
            />
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/settings"
          element={
            <SettingsPage
              isLoggedIn={isLoggedIn}
              learnerProfile={learnerProfile}
              onUpdateLearnerProfile={handleUpdateLearnerProfile}
            />
          }
        />
        <Route
          path="/feedback"
          element={<FeedbackPage isLoggedIn={isLoggedIn} />}
        />
        <Route
          path="/subjects"
          element={
            <SubjectsPage isLoggedIn={isLoggedIn} savedTopics={savedTopics} />
          }
        />
      </Routes>
    </main>
  );
}

export default App;
