const dragbarFile = document.getElementById('dragbar-file');
const dragbarEditor = document.getElementById('dragbar-editor');
const fileColumn = document.getElementById('file-column');
const leftColumn = document.getElementById('left-column');
const rightColumn = document.getElementById('right-column');
const container = document.querySelector('.main-container');

let dragging = null;

function isStacked() {
    // If main-container is column, we are stacked (mobile)
    return getComputedStyle(container).flexDirection === 'column';
}

dragbarFile.addEventListener('mousedown', function(e) {
    if (isStacked()) return;
    e.preventDefault();
    dragging = 'file';
    document.body.style.cursor = 'ew-resize';
});

dragbarEditor.addEventListener('mousedown', function(e) {
    if (isStacked()) return;
    e.preventDefault();
    dragging = 'editor';
    document.body.style.cursor = 'ew-resize';
});

document.addEventListener('mousemove', function(e) {
    if (!dragging || isStacked()) return;
    const containerRect = container.getBoundingClientRect();
    if (dragging === 'file') {
        let newFileWidth = e.clientX - containerRect.left;
        const minFileWidth = 120;
        const maxFileWidth = 360;
        if (newFileWidth < minFileWidth) newFileWidth = minFileWidth;
        if (newFileWidth > maxFileWidth) newFileWidth = maxFileWidth;
        fileColumn.style.flex = 'none';
        fileColumn.style.width = newFileWidth + 'px';
        leftColumn.style.flex = '1 1 0';
    } else if (dragging === 'editor') {
        let fileWidth = fileColumn.offsetWidth;
        // Subtract a small buffer (e.g. 8px) to stop before pushing
        const buffer = 200;
        let newEditorWidth = e.clientX - containerRect.left - fileWidth;
        const minEditorWidth = 180;
        const minChatWidth = 200;
        // Stop BEFORE the chat would be pushed out (leave buffer)
        const maxEditorWidth = containerRect.width - fileWidth - minChatWidth - buffer;
        if (newEditorWidth < minEditorWidth) newEditorWidth = minEditorWidth;
        if (newEditorWidth > maxEditorWidth) newEditorWidth = maxEditorWidth;
        leftColumn.style.flex = 'none';
        leftColumn.style.width = newEditorWidth + 'px';
        rightColumn.style.flex = '1 1 0';
    }
});

document.addEventListener('mouseup', function() {
    if (dragging) {
        dragging = null;
        document.body.style.cursor = '';
    }
});

// On resize, reset widths if stacked
window.addEventListener('resize', function() {
    if (isStacked()) {
        fileColumn.style.width = '';
        fileColumn.style.flex = '';
        leftColumn.style.width = '';
        leftColumn.style.flex = '';
        rightColumn.style.width = '';
        rightColumn.style.flex = '';
    }
});