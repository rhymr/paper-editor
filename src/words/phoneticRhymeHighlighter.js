// src/phoneticRhymeHighlighter.js
// CodeMirror 6 extension: Highlight words that rhyme (phonetically) with the same color
// Each new rhyme group gets a new color. E.g. cat/hat/fat = color1, dog/fog/bog = color2

import { Decoration, ViewPlugin } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

// Use named export for cmu-pronouncing-dictionary (ESM only)
import { dictionary as cmuDict } from "cmu-pronouncing-dictionary";
import { doubleMetaphone } from "double-metaphone";

// Simple color palette for rhyme groups
const RHYME_COLORS = [
    "#ffb347", // orange
    "#77dd77", // green
    "#aec6cf", // blue
    "#f49ac2", // pink
    "#b39eb5", // purple
    "#fff68f", // yellow
    "#ff6961", // red
    "#03c03c", // teal
    "#779ecb", // light blue
    "#966fd6", // violet
    "#f7cac9", // light pink
    "#cfcfc4", // light gray
    "#b284be", // lavender
    "#c23b22", // brick red
    "#03a89e", // turquoise
    "#fdfd96", // pale yellow
    "#836953", // taupe
    "#cb99c9", // mauve
    "#ffb7ce", // pastel pink
    "#b0e0e6"  // powder blue
];

// --- PHONETIC/RHYME UTILS ---
// Improved: Group words by similar phonetic ending (not just exact last 3 letters)
// This is a naive approach, but works for many English rhymes.
function getRhymeKey(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, "");
    if (word.length <= 3) return word;
    // Use last vowel and everything after as a naive rhyme key
    const match = word.match(/[aeiouy][a-z]*$/);
    return match ? match[0] : word.slice(-3);
}

// Utility: Normalize word endings for rhyme (strip s, es, ed, ing)
function normalizeEnding(word) {
    return word
        .replace(/(ing|ed|es|s)$/i, "")
        .replace(/[^a-zA-Zy]/g, "");
}

// Utility: Collapse similar phonemes (e.g., S/Z, D/T)
function collapsePhoneme(phoneme) {
    return phoneme
        .replace(/Z/g, "S")
        .replace(/D/g, "T")
        .replace(/V/g, "F")
        .replace(/B/g, "P")
        .replace(/G/g, "K");
}

// Helper: get the rhyme part from a CMUdict phoneme array
// Enhanced: include last stressed vowel and up to 2 phonemes before and after for near rhymes
function getRhymeParts(phonemes) {
    // Find the last stressed vowel (1 or 2)
    let lastStress = -1;
    for (let i = phonemes.length - 1; i >= 0; i--) {
        if (/\d/.test(phonemes[i])) {
            lastStress = i;
            break;
        }
    }
    // If found, return slices for exact and near rhymes
    if (lastStress !== -1) {
        // Exact rhyme: from last stressed vowel to end
        const exact = phonemes.slice(lastStress).join(" ");
        // Near rhyme: include one before and one after if possible
        const near = phonemes.slice(Math.max(0, lastStress - 1), lastStress + 3).join(" ");
        // Fallback: last 2 and last 3 phonemes
        const last2 = phonemes.slice(-2).join(" ");
        const last3 = phonemes.slice(-3).join(" ");
        return [exact, near, last2, last3];
    }
    // Fallback: last 2 and last 3 phonemes
    const last2 = phonemes.slice(-2).join(" ");
    const last3 = phonemes.slice(-3).join(" ");
    return [last2, last3];
}

// Helper: get the rhyme part from a CMUdict phoneme array, expanded for syllable coloring
function getRhymeSyllableParts(phonemes) {
    // Find the last vowel (including Y at end)
    let lastVowel = -1;
    for (let i = phonemes.length - 1; i >= 0; i--) {
        // Remove stress digits for vowel check
        const ph = phonemes[i].replace(/\d/, "");
        if (/[AEIOUY]/.test(ph)) {
            lastVowel = i;
            break;
        }
    }
    if (lastVowel !== -1) {
        // Return all syllable slices from last vowel to end, collapse phonemes for better matching
        // Also collapse the first consonant after the vowel for more robust matching (e.g. dog/bog/fog)
        let rhymePhonemes = phonemes.slice(lastVowel).map(collapsePhoneme);
        // Remove leading consonant if present (e.g. for "dog"/"bog"/"fog")
        if (rhymePhonemes.length > 1 && !/[AEIOUY]/.test(rhymePhonemes[0])) {
            rhymePhonemes = rhymePhonemes.slice(1);
        }
        return [rhymePhonemes.join(" ")];
    }
    // Fallback: last 2 phonemes, collapsed
    return [phonemes.slice(-2).map(collapsePhoneme).join(" ")];
}

// Get rhyme keys and syllable region for coloring
function getPhoneticRhymeKeyAndRegion(word) {
    let base = normalizeEnding(word.toLowerCase());
    let lookup = cmuDict[base];
    if (!lookup && base.endsWith("y")) {
        // Treat y as vowel at end
        lookup = cmuDict[base.slice(0, -1) + "ee"] || cmuDict[base];
    }
    if (lookup) {
        const phonemes = lookup.split(" ");
        const rhymeParts = getRhymeSyllableParts(phonemes);
        // Find the region in the word that corresponds to the rhyme part
        // Heuristic: highlight from the last vowel in the word to the end
        const vowelMatch = word.match(/[aeiouy][^aeiouy]*$/i);
        let regionStart = vowelMatch ? word.length - vowelMatch[0].length : Math.max(0, word.length - 2);
        return { rhymeKeys: rhymeParts, region: { start: regionStart, end: word.length } };
    } else {
        // Fallback: use double metaphone on ending
        const metaphones = doubleMetaphone(base);
        // Use last 3 letters as region for highlighting
        return { rhymeKeys: [metaphones[0], metaphones[1]].filter(Boolean), region: { start: Math.max(0, word.length - 3), end: word.length } };
    }
}

// --- SYLLABLE SPLITTING AND PHONEME EXTRACTION ---
// Split CMUdict phoneme string into syllables using stress markers (0, 1, 2)
function splitPhonemesIntoSyllables(phonemes) {
    const syllables = [];
    let current = [];
    for (let i = 0; i < phonemes.length; i++) {
        current.push(phonemes[i]);
        if (/\d/.test(phonemes[i])) { // stress marker = syllable boundary
            syllables.push(current);
            current = [];
        }
    }
    if (current.length) syllables.push(current);
    return syllables;
}

// Get all words and their positions in the document
function getWordsWithPositions(docText) {
    const wordRegex = /\b\w+\b/g;
    let match;
    const words = [];
    while ((match = wordRegex.exec(docText)) !== null) {
        words.push({ word: match[0], from: match.index, to: match.index + match[0].length });
    }
    return words;
}

// --- Syllable-to-Text Alignment: Map phoneme syllables to word substrings ---
// Returns [{from, to, text, phonemes, key}] for each syllable in the word
function alignSyllablesToText(word, from, to, syllables) {
    // Greedy alignment: for each syllable, try to match the largest substring containing all its vowels
    const result = [];
    let charIdx = 0;
    let lastEnd = 0;
    let lowerWord = word.toLowerCase();
    // Find all vowel positions in the word
    const vowels = /[aeiouy]/g;
    let vowelIndices = [];
    let m;
    while ((m = vowels.exec(lowerWord)) !== null) {
        vowelIndices.push(m.index);
    }
    // If we have as many vowels as syllables, use vowel positions as split points
    if (vowelIndices.length >= syllables.length) {
        let splits = [0];
        // For each syllable except the last, split after the corresponding vowel
        for (let i = 1; i < syllables.length; i++) {
            splits.push(vowelIndices[i - 1] + 1);
        }
        splits.push(word.length);
        for (let i = 0; i < syllables.length; i++) {
            let start = from + splits[i];
            let end = from + splits[i + 1];
            result.push({
                text: word.slice(splits[i], splits[i + 1]),
                from: start,
                to: end,
                phonemes: syllables[i].map(collapsePhoneme),
                key: syllables[i].map(collapsePhoneme).join(" ")
            });
        }
        return result;
    }
    // Fallback: even split
    const partLen = Math.floor(word.length / syllables.length);
    for (let i = 0; i < syllables.length; i++) {
        let start = from + charIdx;
        let end = (i === syllables.length - 1) ? to : (from + charIdx + partLen);
        result.push({
            text: word.slice(start - from, end - from),
            from: start,
            to: end,
            phonemes: syllables[i].map(collapsePhoneme),
            key: syllables[i].map(collapsePhoneme).join(" ")
        });
        charIdx += end - start;
    }
    return result;
}

function buildRhymeDecorations(doc) {
    const builder = new RangeSetBuilder();
    const docText = doc.toString();
    const words = getWordsWithPositions(docText);
    // Step 1: Collect all syllables and their positions
    const syllableInstances = [];
    for (const { word, from, to } of words) {
        let base = normalizeEnding(word.toLowerCase());
        let lookup = cmuDict[base];
        if (!lookup && base.endsWith("y")) {
            lookup = cmuDict[base.slice(0, -1) + "ee"] || cmuDict[base];
        }
        if (lookup) {
            const phonemes = lookup.split(" ");
            const syllables = splitPhonemesIntoSyllables(phonemes);
            // Use improved alignment
            const wordSyllables = alignSyllablesToText(word, from, to, syllables);
            for (const syl of wordSyllables) {
                syllableInstances.push(syl);
            }
        }
    }
    // Step 2: Group syllables by rhyme key
    const rhymeGroups = new Map(); // key -> [syllableInstance]
    for (const syl of syllableInstances) {
        if (!rhymeGroups.has(syl.key)) rhymeGroups.set(syl.key, []);
        rhymeGroups.get(syl.key).push(syl);
    }
    // Step 3: Assign color to each group with >1 member
    const rhymeColorMap = new Map();
    let colorIdx = 0;
    for (const [key, group] of rhymeGroups.entries()) {
        if (group.length > 1) {
            rhymeColorMap.set(key, RHYME_COLORS[colorIdx % RHYME_COLORS.length]);
            colorIdx++;
        }
    }
    // Step 4: Highlight all matching syllables in all words
    for (const syl of syllableInstances) {
        const color = rhymeColorMap.get(syl.key);
        if (color) {
            builder.add(syl.from, syl.to, Decoration.mark({
                class: "rhyme-highlight",
                attributes: {
                    style: `background: ${color}; border-radius: 3px; padding: 0 2px;`,
                    title: `Phonemes: ${syl.key}`
                }
            }));
        }
    }
    return builder.finish();
}

export const phoneticRhymeHighlighter = ViewPlugin.fromClass(
    class {
        constructor(view) {
            this.decorations = buildRhymeDecorations(view.state.doc);
        }
        update(update) {
            if (update.docChanged)
                this.decorations = buildRhymeDecorations(update.state.doc);
        }
    },
    {
        decorations: v => v.decorations
    }
);
