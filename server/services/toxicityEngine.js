/**
 * Toxicity Detection Engine - Heuristic/Rule-based content moderator
 */

// Categorized Lexicons
const LEXICON = {
  blocked: {
    hate_speech: [
      /\bnigger\b/i, /\bretard\b/i, /\bfaggot\b/i, /\bchink\b/i, /\bkyke\b/i,
      /\bchamar\b/i, /\bbhangi\b/i, /\brand\b/i, /\bbeti chod\b/i, /\bmadarchod\b/i, /\bbehenchod\b/i
    ],
    harassment: [
      /kill yourself/i, /kys/i, /go die/i, /hang yourself/i, /hope you die/i,
      /rape/i, /sexual assault/i, /molest/i, /stab you/i, /beat you up/i
    ],
    toxicity: [
      /\bterrorist\b/i, /\bbomb\b/i, /\bshoot up\b/i, /\bmurder\b/i, /\bkill all\b/i
    ]
  },
  review: {
    profanity: [
      /\bshit\b/i, /\bfuck\b/i, /\bass\b/i, /\bbitch\b/i, /\bbastard\b/i, /\bcunt\b/i,
      /\bcrap\b/i, /\bdick\b/i, /\bpussy\b/i, /\bchutiya\b/i, /\bgaand\b/i, /\bsala\b/i,
      /\bkamina\b/i, /\bharami\b/i, /\bhalamin\b/i
    ],
    personal_attack: [
      /\bidiot\b/i, /\bstupid\b/i, /\bmoron\b/i, /\bcheat\b/i, /\bliar\b/i, /\bjerk\b/i,
      /\bdumbass\b/i, /\bcorrupt\b/i, /\bthief\b/i, /\bughly\b/i, /\bfool\b/i
    ],
    bullying: [
      /you are a loser/i, /nobody likes you/i, /get out of this/i, /worthless/i,
      /you should be expelled/i, /failure/i, /waste of space/i
    ]
  }
};

class ToxicityEngine {
  /**
   * Evaluate a text string for toxic content
   * @param {string} text 
   * @returns {object} { status: 'safe'|'review_required'|'blocked', flags: string[] }
   */
  static evaluate(text) {
    if (!text || typeof text !== 'string') {
      return { status: 'safe', flags: [] };
    }

    const cleanText = text.trim();
    const flags = new Set();

    // 1. Scan for immediately Blocked criteria (hate speech, violence, severe slurs)
    for (const [flagType, patterns] of Object.entries(LEXICON.blocked)) {
      for (const pattern of patterns) {
        if (pattern.test(cleanText)) {
          flags.add(flagType);
        }
      }
    }

    if (flags.size > 0) {
      return {
        status: 'blocked',
        flags: Array.from(flags),
      };
    }

    // 2. Scan for Review Required criteria (minor profanity, personal insults, bullying language)
    for (const [flagType, patterns] of Object.entries(LEXICON.review)) {
      for (const pattern of patterns) {
        if (pattern.test(cleanText)) {
          flags.add(flagType);
        }
      }
    }

    if (flags.size > 0) {
      return {
        status: 'review_required',
        flags: Array.from(flags),
      };
    }

    return {
      status: 'safe',
      flags: [],
    };
  }
}

module.exports = ToxicityEngine;
