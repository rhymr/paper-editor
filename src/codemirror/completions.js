import {englishWords, fetchWordList} from "./wordsCount";

fetchWordList()

export function englishCompletions(context) {
    let before = context.matchBefore(/\w+/);

    if (!context.explicit && !before) return null;

    // Combine rhymes with English dictionary words
    let combinedCompletions = englishWords.map(word => ({
        label: word,
        type: "keyword" // or as appropriate
    }));

    return {
        from: before.from,
        options: combinedCompletions,
        validFor: /^\w*$/
    };
}