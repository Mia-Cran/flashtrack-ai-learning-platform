// Single source of truth for the backend's URL. Used to be copy-pasted as a
// literal string in every file that calls fetch() directly -- 14 places
// across 6 files -- so changing hosts or environments meant hunting all of
// them down by hand instead of editing one constant.
//
// In development this falls back to the local backend. In production (Vercel)
// set VITE_API_BASE_URL to the deployed backend's URL. Vite only exposes
// variables that start with VITE_ to the browser, and reads them from
// import.meta.env (process.env does not exist in the browser bundle).
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
