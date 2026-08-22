# Software Engineering Study Tracker

## Project Overview

Software Engineering Study Tracker is a frontend React application that helps users search, save, and review software engineering concepts.

The goal of this project is to make coding concepts easier to understand by combining Wikipedia topic summaries with beginner-friendly explanations and examples for selected software engineering terms.

## Features

* Search software engineering topics
* Fetch topic summaries from the Wikipedia API
* Display results as study cards
* Show beginner-friendly explanations for selected coding terms
* Save topics for later review
* Persist saved topics with localStorage
* Prevent duplicate saved topics
* Navigate between multiple pages using React Router
* Display loading and error states
* Responsive design for desktop and mobile

## Pages

* Welcome Page
* Search Topics Page
* Saved Topics Page
* About Page

## Tech Stack

* React
* React Router
* JavaScript
* CSS
* Vite
* Wikipedia REST API
* localStorage
* Vercel

## API Used

This project uses the Wikipedia REST API to fetch topic summaries based on the user’s search.

Example API endpoint:

```txt
https://en.wikipedia.org/api/rest_v1/page/summary/{topic}
```

## Local Storage Note

For this stage, saved topics are stored using localStorage. This means saved topics persist only on the same device and browser where they were saved.

Since this version does not include login, authentication, or a backend yet, saved topics do not transfer across devices. In a future full-stack version, I plan to add user accounts and database storage so users can access saved topics from any device.

## Future Improvements

* Add user authentication
* Store saved topics in a database
* Allow saved topics to sync across devices
* Add difficulty levels
* Add AI-generated study help
* Add flashcards or spaced repetition
* Add delete/edit options for saved topics

## Live Demo

https://software-engineering-study-tracker-e6lsshs9z-mia34.vercel.app/

## Project Video

https://www.loom.com/share/f26ab3845b6343eaa4e1c6ee966c2527

## Author

Maria Cranford
