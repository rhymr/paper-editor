// src/markdown.js
export function renderMarkdown(md) {
    return window.marked.parse(md);
}