import {showPanel} from "@codemirror/view";

export let englishWords = [];

export function fetchWordList() {
    fetch('../../api/words.json')
        .then(response => response.json())
        .then(data => {
            englishWords = data;
        })
        .catch(error => {
            console.error('Error fetching word list:', error);
        });
}

export function countTotalDocumentWords(doc) {
    let count = 0, iter = doc.iter()
    while (!iter.next().done) {
        let inWord = false
        for (let i = 0; i < iter.value.length; i++) {
            let word = /\w/.test(iter.value[i])
            if (word && !inWord) count++
            inWord = word
        }
    }
    return `Word Count: ${count}`
}

export function wordCounter() {
    function wordCountPanel(view) {
        let dom = document.createElement("div")
        dom.id = "word-count"
        dom.textContent = countTotalDocumentWords(view.state.doc)
        return {
            dom,
            update(update) {
                if (update.docChanged)
                    dom.textContent = countTotalDocumentWords(update.state.doc)
            }
        }
    }
    return showPanel.of(wordCountPanel)
}