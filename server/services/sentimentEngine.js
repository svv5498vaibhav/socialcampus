/**
 * Sentiment Analysis Engine - Heuristic sentiment polarity scorer
 */

const LEXICON = {
  positive: [
    /\bgreat\b/i, /\bexcellent\b/i, /\bimproved\b/i, /\bhappy\b/i, /\bhelpful\b/i,
    /\bawesome\b/i, /\blove\b/i, /\bpositive\b/i, /\bresolve\b/i, /\bsolve\b/i,
    /\bnice\b/i, /\bgood\b/i, /\bclean\b/i, /\bperfect\b/i, /\bsatisfied\b/i,
    /\bappreciate\b/i, /\bthanks\b/i, /\bthank you\b/i, /\bfantastic\b/i, /\bprogess\b/i
  ],
  negative: [
    /\bbad\b/i, /\bterrible\b/i, /\bworst\b/i, /\bbroken\b/i, /\bdirty\b/i,
    /\bslow\b/i, /\bdelay\b/i, /\bcomplain\b/i, /\bunhappy\b/i, /\bunfair\b/i,
    /\bissue\b/i, /\bconflict\b/i, /\bproblem\b/i, /\bfailure\b/i, /\btoxic\b/i,
    /\bdisappointed\b/i, /\bpoor\b/i, /\bannoyed\b/i, /\bworst\b/i, /\bfrustrated\b/i,
    /\bcareless\b/i, /\bleak\b/i, /\bdamaged\b/i, /\brefused\b/i, /\bexpensive\b/i
  ]
};

class SentimentEngine {
  /**
   * Analyze sentiment score and category of a text
   * @param {string} text 
   * @returns {object} { score: number, sentiment: 'positive'|'neutral'|'negative' }
   */
  static analyze(text) {
    if (!text || typeof text !== 'string') {
      return { score: 0, sentiment: 'neutral' };
    }

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    for (const pattern of LEXICON.positive) {
      const matches = text.match(pattern);
      if (matches) {
        positiveCount += matches.length;
      }
    }

    for (const pattern of LEXICON.negative) {
      const matches = text.match(pattern);
      if (matches) {
        negativeCount += matches.length;
      }
    }

    const totalKeywords = positiveCount + negativeCount;
    if (totalKeywords === 0) {
      return { score: 0, sentiment: 'neutral' };
    }

    // Polarity score between -1.0 and +1.0
    const score = (positiveCount - negativeCount) / totalKeywords;

    let sentiment = 'neutral';
    if (score > 0.15) {
      sentiment = 'positive';
    } else if (score < -0.15) {
      sentiment = 'negative';
    }

    return {
      score: parseFloat(score.toFixed(2)),
      sentiment
    };
  }
}

module.exports = SentimentEngine;
