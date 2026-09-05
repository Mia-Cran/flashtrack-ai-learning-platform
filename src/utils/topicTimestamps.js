export function getSavedAt(topicId) {
  if (typeof topicId !== "string" || topicId.length < 8) {
    return null;
  }

  const seconds = parseInt(topicId.substring(0, 8), 16);
  return Number.isNaN(seconds) ? null : seconds * 1000;
}
