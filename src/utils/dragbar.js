const dragbar = document.getElementById('dragbar');
const left = document.getElementById('left-column');
const right = document.getElementById('right-column');
const container = document.querySelector('.main-container');

let dragging = false;

dragbar.addEventListener('mousedown', function(e) {
    e.preventDefault();
    dragging = true;
    document.body.style.cursor = 'ew-resize';
});

document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    // Calculate new width for left column
    const containerRect = container.getBoundingClientRect();
    let newLeftWidth = e.clientX - containerRect.left;
    // Set min/max widths if desired
    if (newLeftWidth < 100) newLeftWidth = 100;
    if (newLeftWidth > containerRect.width - 100) newLeftWidth = containerRect.width - 100;
    left.style.flex = 'none';
    left.style.width = newLeftWidth + 'px';
    right.style.flex = '1';
});

document.addEventListener('mouseup', function() {
    if (dragging) {
        dragging = false;
        document.body.style.cursor = '';
    }
});