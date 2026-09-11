const openai = require("../utils/openai");
const DailyQuote = require("../models/dailyQuote");

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function generateQuote() {
  const response = await openai.responses.create({
    model: "gpt-5.5",
    instructions: `
      You write short, original, encouraging quotes about learning, growth, or persistence.
      Return only the quote itself: one or two sentences, no attribution, no quotation marks.
    `,
    input: "Write today's encouraging quote.",
  });

  return response.output_text.trim();
}

const getDailyQuote = async (req, res) => {
  const date = getTodayKey();

  try {
    const existing = await DailyQuote.findOne({ date });

    if (existing) {
      return res.status(200).send({ quote: existing.quote, date });
    }

    const quote = await generateQuote();

    try {
      const created = await DailyQuote.create({ date, quote });
      return res.status(200).send({ quote: created.quote, date });
    } catch (err) {
      if (err.code === 11000) {
        const winner = await DailyQuote.findOne({ date });
        return res.status(200).send({ quote: winner.quote, date });
      }

      throw err;
    }
  } catch (err) {
    console.error(err);

    return res.status(500).send({
      message: "Failed to get today's quote",
    });
  }
};

module.exports = {
  getDailyQuote,
};
