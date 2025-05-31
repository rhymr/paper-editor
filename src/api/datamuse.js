// Simple Datamuse API wrapper for rhyme/similar word queries

const DATAMUSE_API = "https://api.datamuse.com/words";

/**
 * Query Datamuse API
 * @param {Object} params - Query params as key-value pairs
 * @returns {Promise<Array>} Array of word objects
 */
export async function datamuseQuery(params) {
    const url = new URL(DATAMUSE_API);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    const res = await fetch(url);
    if (!res.ok) throw new Error("Datamuse API error: " + res.statusText);
    return res.json();
}

/**
 * Get perfect rhymes for a word
 * @param {string} word
 * @returns {Promise<Array>}
 */
export function getPerfectRhymes(word) {
    return datamuseQuery({rel_rhy: word, max: 1000});
}

/**
 * Get near rhymes for a word
 * @param {string} word
 * @returns {Promise<Array>}
 */
export function getNearRhymes(word) {
    return datamuseQuery({rel_nry: word, max: 1000});
}

/**
 * Get similar sounding words
 * @param {string} word
 * @returns {Promise<Array>}
 */
export function getSimilarSounds(word) {
    return datamuseQuery({sl: word, max: 1000});
}

/**
 * Get synonyms for a word
 * @param {string} word
 * @returns {Promise<Array>}
 */
export function getSynonyms(word) {
    return datamuseQuery({rel_syn: word, max: 1000});
}

/**
 * Get phrases that rhyme with a word
 * @param {string} word
 * @returns {Promise<Array>}
 */
export function getPhrases(word) {
    // rel_rhy + "&qe=sp&sp=*_ *" returns multi-word phrases that rhyme
    return datamuseQuery({rel_rhy: word, max: 1000, qe: "sp", sp: "*_ *"});
}

/**
 * Get names that rhyme with a word
 * @param {string} word
 * @returns {Promise<Array>}
 */
export function getNames(word) {
    // rel_rhy + topics=names returns proper names that rhyme
    return datamuseQuery({rel_rhy: word, max: 1000, topics: "names"});
}

/**
 * Get rare words that rhyme with a word
 * @param {string} word
 * @returns {Promise<Array>}
 */
export function getRareWords(word) {
    // rel_rhy + md=f returns words with frequency info, filter for rare (f:1)
    return datamuseQuery({rel_rhy: word, max: 1000, md: "f"});
}
