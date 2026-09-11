// Voice is tap-to-talk navigation, not a chatbot and not a stand-in for
// buttons. The mic listens once and opens the page they named. Hear it
// on cards is separate (playback in speech.js).
//
// Phrases listed on /voice are the ones we promise. Tests check every one.

const POLITE_PREFIXES = [
  "where is the",
  "where are the",
  "where are my",
  "where is my",
  "where are",
  "where is",
  "donde esta la pagina de",
  "donde estan las paginas de",
  "donde esta la pagina",
  "pagina de",
  "donde estan mis",
  "donde esta mi",
  "donde estan",
  "donde esta",
  "can you please",
  "could you please",
  "can you",
  "could you",
  "would you",
  "i want to go to",
  "i want to",
  "i wanna",
  "i want the",
  "please take me to the",
  "please take me to",
  "take me to the",
  "take me to",
  "take me",
  "bring me to the",
  "bring me to",
  "bring up the",
  "bring up",
  "navigate to the",
  "navigate to",
  "go to the",
  "go to",
  "open the",
  "show me my",
  "show me the",
  "show me",
  "go",
  "open",
  "show",
  "please",
  "por favor",
  "quiero ir a",
  "quiero ir",
  "quiero",
  "llevame a la pagina de",
  "llevame a la",
  "llevame al",
  "llevame a",
  "llevame",
  "ir a",
  "abre",
  "mostrar",
].sort((a, b) => b.length - a.length);

const LEADING_ARTICLES = ["the", "a", "an", "el", "la", "los", "las"];

const TRAILING_PLACE = [
  "page",
  "pages",
  "box",
  "bar",
  "screen",
  "tab",
  "pagina",
  "pantalla",
  "caja",
];

const SEARCH_PLACE_WORDS = new Set([
  "page",
  "box",
  "bar",
  "screen",
  "tab",
  "here",
  "pagina",
  "caja",
]);

const FILLERS = new Set([
  "hello",
  "hi",
  "hey",
  "yo",
  "thanks",
  "thank you",
  "ok",
  "okay",
  "yes",
  "no",
  "wait",
  "stop",
  "nevermind",
  "never mind",
  "um",
  "uh",
  "hola",
  "gracias",
  "vale",
  "si",
  "bueno",
]);

const DESTINATIONS = [
  {
    match:
      /^(saved topics?|saved|topics?|my cards?|cards?|flashcards?|my topics?|temas guardados|guardados|mis temas|temas)$/,
    path: "/saved",
    cueKey: "voice.goingSaved",
  },
  {
    match: /^(games?|juegos?)$/,
    path: "/games",
    cueKey: "voice.goingGames",
  },
  {
    match: /^(home(page)?|dashboard|panel)$/,
    path: "/home",
    cueKey: "voice.goingHome",
  },
  {
    match: /^(welcome|start|inicio)$/,
    path: "/",
    cueKey: "voice.goingWelcome",
  },
  {
    match: /^(settings?|ajustes?)$/,
    path: "/settings",
    cueKey: "voice.goingSettings",
  },
  {
    match: /^(about|acerca( de)?)$/,
    path: "/about",
    cueKey: "voice.goingAbout",
  },
  {
    match: /^(legal)$/,
    path: "/legal",
    cueKey: "voice.goingLegal",
  },
  {
    match: /^(feedback|comentarios?)$/,
    path: "/feedback",
    cueKey: "voice.goingFeedback",
  },
  {
    match: /^(voice|phrases|voz|frases)$/,
    path: "/voice",
    cueKey: "voice.goingVoice",
  },
  {
    match: /^(search|buscar|busqueda)$/,
    path: "/search",
    cueKey: "voice.goingSearch",
  },
];

const SEARCH_LEAD =
  /^(search for|search|look up|look for|find|busca de|busca|buscar)\s+(.+)$/;

// The formulas on /voice. Every phrase here must parse to that path.
export const VOICE_PAGES = [
  { path: "/", nameEn: "Welcome", nameEs: "Inicio" },
  { path: "/home", nameEn: "Home", nameEs: "Panel" },
  { path: "/search", nameEn: "Search", nameEs: "Buscar" },
  { path: "/saved", nameEn: "Saved Topics", nameEs: "Temas guardados" },
  { path: "/games", nameEn: "Games", nameEs: "Juegos" },
  { path: "/about", nameEn: "About", nameEs: "Acerca de" },
  { path: "/settings", nameEn: "Settings", nameEs: "Ajustes" },
  { path: "/legal", nameEn: "Legal", nameEs: "Legal" },
  { path: "/feedback", nameEn: "Feedback", nameEs: "Comentarios" },
];

export const VOICE_PHRASE_GROUPS = VOICE_PAGES.map((page) => ({
  path: page.path,
  phrases: {
    en: [
      `Take me to the ${page.nameEn} page`,
      `Where is the ${page.nameEn} page?`,
      `${page.nameEn} page`,
    ],
    es: [
      `Llévame a la página de ${page.nameEs}`,
      `¿Dónde está la página de ${page.nameEs}?`,
      `página de ${page.nameEs}`,
    ],
  },
}));

export function getSpeechRecognition() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function canUseVoiceRecognition() {
  return Boolean(getSpeechRecognition());
}

export function normalizeVoiceText(raw) {
  return String(raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripListFromStart(text, words) {
  let current = text;
  let changed = true;

  while (changed && current) {
    changed = false;
    for (const word of words) {
      if (current === word) {
        current = "";
        changed = true;
        break;
      }
      if (current.startsWith(`${word} `)) {
        current = current.slice(word.length).trim();
        changed = true;
        break;
      }
    }
  }

  return current;
}

function stripTrailingPlace(text) {
  for (const place of TRAILING_PLACE) {
    if (text === place) {
      return "";
    }
    if (text.endsWith(` ${place}`)) {
      return text.slice(0, -(place.length + 1)).trim();
    }
  }
  return text;
}

function asSearch(term) {
  const cleaned = String(term || "").trim();
  if (!cleaned || FILLERS.has(cleaned) || SEARCH_PLACE_WORDS.has(cleaned)) {
    return null;
  }

  return { type: "search", term: cleaned };
}

function matchDestination(text) {
  for (const destination of DESTINATIONS) {
    if (destination.match.test(text)) {
      return {
        type: "navigate",
        path: destination.path,
        cueKey: destination.cueKey,
      };
    }
  }
  return null;
}

function unstickGluedPage(text) {
  // Chrome often hears "home page" as the one word "homepage".
  const glued = {
    homepage: "home",
    welcomepage: "welcome",
    searchpage: "search",
    searchbox: "search",
    settingspage: "settings",
    aboutpage: "about",
    legalpage: "legal",
    feedbackpage: "feedback",
    gamespage: "games",
    gamepage: "games",
    savedtopicspage: "saved topics",
    savedtopicpage: "saved topics",
  };
  if (glued[text]) {
    return glued[text];
  }
  if (text.endsWith("page") && !text.includes(" ") && text.length > 4) {
    return text.slice(0, -4);
  }
  return text;
}

export function parseVoiceCommand(raw) {
  let text = stripListFromStart(normalizeVoiceText(raw), POLITE_PREFIXES);
  text = stripListFromStart(text, LEADING_ARTICLES);
  if (!text) {
    return null;
  }

  const candidates = [text];
  const withoutPlace = stripTrailingPlace(text);
  if (withoutPlace && withoutPlace !== text) {
    candidates.push(withoutPlace);
  }
  const unstuck = unstickGluedPage(text);
  if (unstuck !== text) {
    candidates.push(unstuck);
  }

  for (const candidate of candidates) {
    const found = matchDestination(candidate);
    if (found) {
      return found;
    }
  }

  const searchLead = text.match(SEARCH_LEAD);
  if (searchLead) {
    const term = searchLead[2].trim();
    if (!term || SEARCH_PLACE_WORDS.has(term)) {
      return {
        type: "navigate",
        path: "/search",
        cueKey: "voice.goingSearch",
      };
    }
    return asSearch(term);
  }

  return null;
}
