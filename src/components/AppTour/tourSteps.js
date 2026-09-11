export function getTourSteps(isLoggedIn) {
  if (isLoggedIn) {
    return [
      { id: "search", titleKey: "tour.searchTitle", bodyKey: "tour.searchBody" },
      { id: "saved", titleKey: "tour.savedTitle", bodyKey: "tour.savedBody" },
      { id: "games", titleKey: "tour.gamesTitle", bodyKey: "tour.gamesBody" },
      { id: "home", titleKey: "tour.homeTitle", bodyKey: "tour.homeBody" },
      { id: "settings", titleKey: "tour.settingsTitle", bodyKey: "tour.settingsBody" },
    ];
  }

  return [
    { id: "search", titleKey: "tour.searchTitle", bodyKey: "tour.searchBody" },
    { id: "feedback", titleKey: "tour.feedbackTitle", bodyKey: "tour.feedbackBody" },
  ];
}
