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
    const containerRect = container.getBoundingClientRect();
    let newLeftWidth = e.clientX - containerRect.left;

    // Prevent dragging if it would push the chat container (right) off screen
    // We'll require at least 20% of the container width for the right column
    const minRightWidth = containerRect.width * 0.2;
    const maxLeftWidth = containerRect.width - minRightWidth;
    const minLeftWidth = 100; // Or containerRect.width * 0.2 for symmetry

    if (newLeftWidth < minLeftWidth) newLeftWidth = minLeftWidth;
    if (newLeftWidth > maxLeftWidth) newLeftWidth = maxLeftWidth;

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