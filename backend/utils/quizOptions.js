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

module.exports = {
  normalizeMcOptions,
  optionsLookLikeLettersOnly,
};
