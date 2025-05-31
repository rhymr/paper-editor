import {countTotalSyllables} from "../utils/syllableCounter";
import {gutter, GutterMarker} from "@codemirror/view";

export const syllableCountCache = new Map();

export function countLineSyllables(view, line) {
    let text = view.state.doc.lineAt(line.from).text;

    if (!syllableCountCache.has(text)) {
        let count = countTotalSyllables(text);
        syllableCountCache.set(text, count);
    }

    let count = syllableCountCache.get(text);
    return new class extends GutterMarker {
        toDOM = () => document.createTextNode(count <= 0 ? 'ø' : count);
    };
}

export function syllableCounter() {
    return gutter({
        class: "cm-syllableCounter",
        lineMarker(view, line) {
            const viewport = view.viewport;
            // Check if the line is within the viewport (visible)
            if (line.from !== line.to && line.from >= viewport.from && line.to <= viewport.to && view.state.doc.lines <= 1000) {
                return countLineSyllables(view, line);
            }
            return null;  // Do not show syllable counter for lines outside the viewport
        }
    });
}