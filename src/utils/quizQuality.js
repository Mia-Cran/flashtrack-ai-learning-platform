export function isPlaceholderQuestionText(text) {
  const cleaned = String(text || "").trim();
  return /^(Q(uestion)?\s*\d+\s*\??)$/i.test(cleaned);
}

export function optionsLookLikeLettersOnly(options = []) {
  if (options.length !== 4) {
    return false;
  }

  return options.every((option) => /^[A-Da-d]$/.test(String(option).trim()));
}

export function isUnusableMcQuestion(question) {
  const options = question?.options || [];
  return (
    isPlaceholderQuestionText(question?.text) ||
    optionsLookLikeLettersOnly(options)
  );
}

export function quizHasUnusableQuestions(questions = []) {
  return questions.some(isUnusableMcQuestion);
}
