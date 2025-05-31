// src/rhymezone.js
// Handles the advanced rhyme zone UI and logic for #rhymezone
import { getPerfectRhymes, getNearRhymes, getSimilarSounds, getSynonyms, getPhrases, getNames, getRareWords, datamuseQuery } from "./utils/datamuse.js";

// Add all Datamuse rhyme-related options as checkboxes
const rhymeTypeOptions = [
    { id: "cb-perfect", label: "Perfect rhymes", value: "rel_rhy", default: true },
    { id: "cb-near", label: "Near rhymes", value: "rel_nry", default: true },
    { id: "cb-phrases", label: "Phrases", value: "phrases", default: true },
    { id: "cb-names", label: "Names", value: "names", default: true },
    { id: "cb-rare", label: "Rare words", value: "rare", default: false },
    { id: "cb-hom", label: "Homophones", value: "rel_hom", default: false },
    { id: "cb-cns", label: "Same consonants", value: "rel_cns", default: false },
    { id: "cb-relphr", label: "Phrase rhymes", value: "rel_phr", default: false },
    { id: "cb-sl", label: "Similar sound", value: "sl", default: false }
];

// Remove dropdown from table rendering
// Remove renderTable function and replace with a function that updates the static table's tbody and message div
function updateResultsTable(results, sortBy = "score", sortDir = "desc") {
    const table = document.getElementById("rz-adv-table");
    const tbody = document.getElementById("rz-adv-tbody");
    const msg = document.getElementById("rz-adv-message");
    tbody.innerHTML = '';
    if (!results.length) {
        table.style.display = 'none';
        msg.textContent = 'No results found.';
        msg.style.display = '';
        return;
    }
    table.style.display = '';
    msg.style.display = 'none';
    // Sort results
    let sorted = results.slice();
    if (sortBy === "score") {
        sorted.sort((a, b) => (sortDir === "desc" ? (b.score ?? 0) - (a.score ?? 0) : (a.score ?? 0) - (b.score ?? 0)));
    } else if (sortBy === "word") {
        sorted.sort((a, b) => sortDir === "asc" ? a.word.localeCompare(b.word) : b.word.localeCompare(a.word));
    }
    for (const r of sorted) {
        const tr = document.createElement('tr');
        // Word cell (copyable)
        const tdWord = document.createElement('td');
        const wordDiv = document.createElement('div');
        wordDiv.className = 'rz-word-copy';
        wordDiv.setAttribute('data-word', r.word);
        wordDiv.setAttribute('title', 'Click to copy');
        wordDiv.textContent = r.word;
        tdWord.appendChild(wordDiv);
        tr.appendChild(tdWord);
        // Rhyme rating
        const tdRhyme = document.createElement('td');
        tdRhyme.textContent = r.score ?? '';
        tr.appendChild(tdRhyme);
        // Meter
        const tdMeter = document.createElement('td');
        tdMeter.textContent = r.numSyllables ? `[${'x/'.repeat(r.numSyllables)}]` : '';
        tr.appendChild(tdMeter);
        // Popularity
        const tdPop = document.createElement('td');
        tdPop.textContent = r.tags?.find(t => t.startsWith('f:'))?.slice(2) ?? '';
        tr.appendChild(tdPop);
        // Categories
        const tdCats = document.createElement('td');
        tdCats.textContent = r.tags?.filter(t => !t.startsWith('f:')).join(', ') ?? '';
        tr.appendChild(tdCats);
        tbody.appendChild(tr);
    }
}

// Insert sort dropdown into the input area on init
export function initBottomSectionRhymeZone() {
    const form = document.getElementById("rz-adv-search-bar");
    const input = document.getElementById("rz-word-input");
    // Set default checkbox states and render all checkboxes
    // (Checkboxes and column toggles are now rendered in HTML, not JS)
    // Remove all code that generates or inserts HTML for checkboxes and column toggles
    // Only attach listeners and restore state for checkboxes and column toggles
    const cbxRow = form.querySelector('.rz-adv-checkboxes');
    // Restore checkbox state from localStorage if available
    const savedCheckboxes = JSON.parse(localStorage.getItem('rz-adv-checkboxes' || '{}'));
    for (const opt of rhymeTypeOptions) {
        const cb = document.getElementById(opt.id);
        if (cb) {
            if (savedCheckboxes.hasOwnProperty(opt.id)) {
                cb.checked = !!savedCheckboxes[opt.id];
            } else {
                cb.checked = !!opt.default;
            }
            // Save state on change
            cb.addEventListener('change', () => {
                const state = {};
                for (const opt2 of rhymeTypeOptions) {
                    const cb2 = document.getElementById(opt2.id);
                    if (cb2) state[opt2.id] = cb2.checked;
                }
                localStorage.setItem('rz-adv-checkboxes', JSON.stringify(state));
            });
        }
    }
    // Remove all code that generates or inserts HTML for column toggles in JS
    // Remove all code that generates or inserts HTML for rhyme type checkboxes in JS
    // Remove all code that generates or inserts HTML for the sort dropdown in JS
    // Only attach listeners and restore state for checkboxes, column toggles, and sort dropdown, which are now rendered in the HTML file
    // Column toggles (define only if not already defined)
    const colTogglesArr = [
        { id: 'col-rhyme', col: 1 },
        { id: 'col-meter', col: 2 },
        { id: 'col-pop', col: 3 },
        { id: 'col-cats', col: 4 }
    ];
    // Restore column toggle state from localStorage
    const savedColsObj = JSON.parse(localStorage.getItem('rz-adv-cols' || '{}'));
    colTogglesArr.forEach(opt => {
        const cb = document.getElementById(opt.id);
        if (cb && savedColsObj.hasOwnProperty(opt.id)) {
            cb.checked = !!savedColsObj[opt.id];
        }
        if (cb) {
            cb.addEventListener('change', () => {
                const state = {};
                colTogglesArr.forEach(opt2 => {
                    const cb2 = document.getElementById(opt2.id);
                    if (cb2) state[opt2.id] = cb2.checked;
                });
                localStorage.setItem('rz-adv-cols', JSON.stringify(state));
                updateColVisibility();
            });
        }
    });
    // Remove all code that generates or inserts HTML for the sort dropdown in JS
    // Only attach listeners and restore state for the sort dropdown, which is now rendered in the HTML file
    // Instead, just attach event listeners to the sort dropdown if it exists
    const sortSelect = document.getElementById("rz-sort-select");
    // Add sort handler (re-render only, no re-query)
    if (sortSelect) {
        sortSelect.onchange = () => {
            const val = sortSelect.value;
            let sortBy = "score", sortDir = "desc";
            if (val === "score-asc") { sortBy = "score"; sortDir = "asc"; }
            else if (val === "score-desc") { sortBy = "score"; sortDir = "desc"; }
            else if (val === "word-asc") { sortBy = "word"; sortDir = "asc"; }
            else if (val === "word-desc") { sortBy = "word"; sortDir = "desc"; }
            resultsDiv.innerHTML = renderTable(allResults, sortBy, sortDir);
        };
    }
    form.addEventListener("submit", handleRhymeSearch);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") handleRhymeSearch(e);
    });
    // Remove checkbox listeners for live search (only search on submit)
    // Initial search is not run automatically

    // Add copy-to-clipboard event after rendering results
    const resultsDiv = document.getElementById("rz-adv-results");
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.rz-word-copy').forEach(el => {
            el.onclick = function() {
                const word = this.getAttribute('data-word');
                if (word) {
                    navigator.clipboard.writeText(word);
                    this.classList.add('copied');
                    setTimeout(() => this.classList.remove('copied'), 600);
                }
            };
        });
    });
    observer.observe(resultsDiv, { childList: true, subtree: true });
    // Function to update column visibility
    function updateColVisibility() {
        const colState = {};
        colTogglesArr.forEach((opt, i) => {
            const cb = document.getElementById(opt.id);
            colState[opt.col] = cb && cb.checked;
        });
        document.querySelectorAll('.rz-adv-table').forEach(table => {
            // Table header
            table.querySelectorAll('thead th').forEach((th, i) => {
                if (i === 0) return; // Word column always shown
                th.style.display = colState[i] ? '' : 'none';
            });
            // Table body
            table.querySelectorAll('tbody tr').forEach(tr => {
                tr.querySelectorAll('td').forEach((td, i) => {
                    if (i === 0) return;
                    td.style.display = colState[i] ? '' : 'none';
                });
            });
        });
    }
    // Update on initial load and after every table render
    const rzResultsDiv = document.getElementById("rz-adv-results");
    const colObs = new MutationObserver(updateColVisibility);
    colObs.observe(rzResultsDiv, { childList: true, subtree: true });
    setTimeout(updateColVisibility, 0);
}

async function handleRhymeSearch(e) {
    if (e) e.preventDefault();
    const word = document.getElementById("rz-word-input").value.trim();
    const table = document.getElementById("rz-adv-table");
    const tbody = document.getElementById("rz-adv-tbody");
    const msg = document.getElementById("rz-adv-message");
    if (!word) {
        table.style.display = 'none';
        msg.textContent = 'Please enter a word.';
        msg.style.display = '';
        tbody.innerHTML = '';
        return;
    }
    table.style.display = 'none';
    msg.textContent = 'Searching...';
    msg.style.display = '';
    tbody.innerHTML = '';
    let allResults = [];
    const fetches = [];
    // Only fetch for checked options, and wrap each in a try/catch to prevent a single failed endpoint from freezing the UI
    if (document.getElementById("cb-perfect")?.checked) fetches.push(getPerfectRhymes(word).catch(() => []));
    if (document.getElementById("cb-near")?.checked) fetches.push(getNearRhymes(word).catch(() => []));
    if (document.getElementById("cb-phrases")?.checked) fetches.push(getPhrases(word).catch(() => []));
    if (document.getElementById("cb-names")?.checked) fetches.push(getNames(word).catch(() => []));
    if (document.getElementById("cb-rare")?.checked) fetches.push(getRareWords(word).catch(() => []));
    if (document.getElementById("cb-hom")?.checked) fetches.push(datamuseQuery({rel_hom: word, max: 1000}).catch(() => []));
    if (document.getElementById("cb-cns")?.checked) fetches.push(datamuseQuery({rel_cns: word, max: 1000}).catch(() => []));
    if (document.getElementById("cb-relphr")?.checked) fetches.push(datamuseQuery({rel_phr: word, max: 1000}).catch(() => []));
    if (document.getElementById("cb-sl")?.checked) fetches.push(getSimilarSounds(word).catch(() => []));
    let results = [];
    try {
        results = await Promise.all(fetches);
    } catch {}
    for (const arr of results) {
        allResults = allResults.concat(arr);
    }
    // Remove duplicates by word and filter out junk results (empty, only asterisks, or non-words)
    allResults = allResults.filter((r, i, arr) =>
        arr.findIndex(x => x.word === r.word) === i &&
        r.word &&
        r.word.trim() &&
        !/^\*+$/.test(r.word.trim()) &&
        /[a-zA-Z]/.test(r.word)
    );
    // Get sort selection
    let sortBy = "score", sortDir = "desc";
    const sortSelect = document.getElementById("rz-sort-select");
    if (sortSelect) {
        const val = sortSelect.value;
        if (val === "score-asc") { sortBy = "score"; sortDir = "asc"; }
        else if (val === "score-desc") { sortBy = "score"; sortDir = "desc"; }
        else if (val === "word-asc") { sortBy = "word"; sortDir = "asc"; }
        else if (val === "word-desc") { sortBy = "word"; sortDir = "desc"; }
    }
    updateResultsTable(allResults, sortBy, sortDir);
}

// Optionally, auto-init on load:
// initBottomSectionRhymeZone();
