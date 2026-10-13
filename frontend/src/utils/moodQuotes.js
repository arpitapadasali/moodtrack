/**
 * Motivational quotes library categorized by mood rating (1 - 5)
 */
export const MOOD_QUOTES = {
  1: [
    {
      text: "It is okay to not be okay. Give yourself permission to pause, breathe, and rest today.",
      author: "Haemin Sunim",
      theme: "Gentleness & Self-Care"
    },
    {
      text: "Every storm runs out of rain. Difficult days do not define your journey.",
      author: "Maya Angelou",
      theme: "Resilience"
    }
  ],
  2: [
    {
      text: "You don't have to carry everything all at once. Just focus on taking one gentle step forward.",
      author: "Brianna Wiest",
      theme: "One Step at a Time"
    },
    {
      text: "Be patient with yourself. Nothing in nature blooms all year round.",
      author: "Anonymous",
      theme: "Patience"
    }
  ],
  3: [
    {
      text: "Balance is not something you find, it is something you consciously nurture moment by moment.",
      author: "Jana Kingsford",
      theme: "Mindful Balance"
    },
    {
      text: "Peace is the result of retraining your mind to process life as it is, rather than as you thought it should be.",
      author: "Wayne Dyer",
      theme: "Equanimity"
    }
  ],
  4: [
    {
      text: "Notice and savor the simple joys today. They quietly anchor our happiest memories.",
      author: "Robert Brault",
      theme: "Gratitude & Joy"
    },
    {
      text: "Positive thoughts are the wings that carry you through constructive and meaningful days.",
      author: "Anonymous",
      theme: "Optimism"
    }
  ],
  5: [
    {
      text: "Your enthusiasm and joy are contagious today. Channel this energy into what you truly love!",
      author: "Oprah Winfrey",
      theme: "Thriving"
    },
    {
      text: "Joy is not simply a feeling; it is a radiant light that illuminates everything you do.",
      author: "Thich Nhat Hanh",
      theme: "Vibrant Energy"
    }
  ],
  default: [
    {
      text: "Checking in with your emotions each day is the cornerstone of mental clarity and emotional wellbeing.",
      author: "MoodTrack Daily",
      theme: "Mindful Reflection"
    }
  ]
};

/**
 * Returns a quote tailored to the user's mood level
 * @param {number|null} mood - Mood rating 1-5
 * @returns {object} { text, author, theme }
 */
export function getQuoteForMood(mood) {
  const quotes = MOOD_QUOTES[mood] || MOOD_QUOTES.default;
  return quotes[0];
}

export default {
  MOOD_QUOTES,
  getQuoteForMood
};
