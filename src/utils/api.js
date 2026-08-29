// Single source of truth for the backend's URL. Used to be copy-pasted as a
// literal string in every file that calls fetch() directly -- 14 places
// across 6 files -- so changing hosts or environments meant hunting all of
// them down by hand instead of editing one constant.
export const API_BASE_URL = "https://software-engineering-study-tracker.onrender.com";
