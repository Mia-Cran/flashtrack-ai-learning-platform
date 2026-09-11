// Multiple-choice options should be the answer text only. The quiz page
// already prints "A. " in front of each one, so if the model returns
// "A. A function..." the student sees "A. A. A function...".
function normalizeMcOptions(options = []) {
  return options.map((option, index) => {
    const letter = String.fromCharCode(65 + index);
    return String(option || "")
      .replace(new RegExp(`^\\s*${letter}\\s*[.):\\-–]\\s*`, "i"), "")
      .trim();
  });
}

function optionsLookLikeLettersOnly(options = []) {
  if (options.length !== 4) {
    return false;
  }

  return options.every((option) => /^[A-Da-d]$/.test(String(option).trim()));
}

function isPlaceholderQuestionText(text) {
  const cleaned = String(text || "").trim();
  return /^(Q(uestion)?\s*\d+\s*\??)$/i.test(cleaned);
}

function isUnusableMcQuestion(question) {
  const options = question?.options || [];
  return (
    isPlaceholderQuestionText(question?.text) ||
    optionsLookLikeLettersOnly(options)
  );
}

// The quiz page grades letters A–D. The model may send a letter, an index
// 0–3, or the exact option text — store a letter either way.
function letterFromModelAnswer(question) {
  const raw = String(question?.correctAnswer ?? "").trim();
  if (/^[A-D]$/i.test(raw)) {
    return raw.toUpperCase();
  }

  const index = Number(question?.correctIndex);
  if (Number.isInteger(index) && index >= 0 && index <= 3) {
    return String.fromCharCode(65 + index);
  }

  const options = question?.options || [];
  const found = options.findIndex(
    (option) => String(option).trim().toLowerCase() === raw.toLowerCase(),
  );
  if (found >= 0) {
    return String.fromCharCode(65 + found);
  }

  return "A";
}

module.exports = {
  normalizeMcOptions,
  optionsLookLikeLettersOnly,
  isPlaceholderQuestionText,
  isUnusableMcQuestion,
  letterFromModelAnswer,
};
