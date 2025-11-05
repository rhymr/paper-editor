import { englishWords, fetchWordList } from './wordsCount';

fetchWordList();

/**
 *
 * @param context
 */
export function englishCompletions (context) {
  const before = context.matchBefore(/\w+/);

  if (!context.explicit && !before) return null;

  // Combine rhymes with English dictionary words
  const combinedCompletions = englishWords.map(word => ({
    label: word,
    type: 'keyword' // or as appropriate
  }));

  return {
    from: before.from,
    options: combinedCompletions,
    validFor: /^\w*$/
  };
}
