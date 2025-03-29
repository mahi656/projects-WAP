// Game Configuration
const puzzles = {
    easy: [
        'https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=300&h=300&fit=crop'
    ],
    medium: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&h=300&fit=crop'
    ],
    hard: [
        'https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1429087969512-1e85aab2683d?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1517486808906-6ca8b3f8e1c1?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=300&h=300&fit=crop'
    ]
};

// Game State
let currentLevel = 'easy';
let currentPuzzleIndex = 0;
let moves = 0;
let time = 0;
let timer;
let hints = 3;
let gridSize = 3;
let totalPieces = gridSize * gridSize;
let imageUrl = puzzles[currentLevel][currentPuzzleIndex];
let draggedPiece = null;

// DOM Elements
const piecesContainer = document.getElementById('pieces-container');
const board = document.getElementById('board');
const moveCount = document.getElementById('move-count');
const timeDisplay = document.getElementById('time-display');
const hintBtn = document.getElementById('hint-btn');
const hintsDisplay = document.getElementById('hints-display');
const levelDisplay = document.getElementById('current-level');
const puzzleCountDisplay = document.getElementById('puzzle-count');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const resetBtn = document.getElementById('reset-btn');
const nextPuzzleBtn = document.getElementById('next-puzzle-btn');
const levelCompleteModal = document.querySelector('.level-complete-modal');
const finalMoves = document.getElementById('final-moves');
const finalTime = document.getElementById('final-time');

// Initialize Game
function initGame() {
    createPuzzle();
    startTimer();
    updateUI();
}

// Create Puzzle
function createPuzzle() {
    piecesContainer.innerHTML = '';
    board.innerHTML = '';
    moves = 0;
    time = 0;
    hints = 3;
    updateUI();

    // Set grid size based on difficulty
    switch(currentLevel) {
        case 'easy': gridSize = 3; break;
        case 'medium': gridSize = 4; break;
        case 'hard': gridSize = 5; break;
    }
    totalPieces = gridSize * gridSize;

    // Update board grid
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    board.style.width = `${gridSize * 100}px`;
    board.style.height = `${gridSize * 100}px`;

    // Create puzzle slots
    for (let i = 0; i < totalPieces; i++) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.position = i;
        
        // Add drop events
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
        
        board.appendChild(slot);
    }

    // Create puzzle pieces
    const positions = [...Array(totalPieces).keys()];
    shuffleArray(positions);
    
    for (let i = 0; i < totalPieces; i++) {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.id = `piece-${i}`;
        piece.draggable = true;
        piece.dataset.correctPosition = positions[i];
        piece.dataset.number = i + 1;
        
        // Set background position
        const row = Math.floor(positions[i] / gridSize);
        const col = positions[i] % gridSize;
        piece.style.backgroundImage = `url(${imageUrl})`;
        piece.style.backgroundSize = `${gridSize * 100}px ${gridSize * 100}px`;
        piece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;
        
        // Add drag events
        piece.addEventListener('dragstart', handleDragStart);
        piece.addEventListener('dragend', handleDragEnd);
        
        piecesContainer.appendChild(piece);
    }
}

// Drag and Drop Handlers
function handleDragStart(e) {
    draggedPiece = this;
    setTimeout(() => {
        this.style.opacity = '0.4';
    }, 0);
}

function handleDragEnd() {
    this.style.opacity = '1';
    draggedPiece = null;
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('highlight');
}

function handleDragLeave() {
    this.classList.remove('highlight');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('highlight');
    
    if (draggedPiece && !this.hasChildNodes()) {
        this.appendChild(draggedPiece);
        moves++;
        updateUI();
        
        // Check if puzzle is complete
        if (checkPuzzleComplete()) {
            completePuzzle();
        }
    }
}

// Check if puzzle is complete
function checkPuzzleComplete() {
    const slots = board.children;
    
    for (let i = 0; i < slots.length; i++) {
        if (!slots[i].hasChildNodes()) return false;
        
        const piece = slots[i].firstChild;
        const correctPosition = parseInt(piece.dataset.correctPosition);
        
        if (i !== correctPosition) return false;
    }
    
    return true;
}

// Show Hint
function showHint() {
    if (hints <= 0) return;
    
    hints--;
    updateUI();
    
    // Find first incorrect piece
    const slots = board.children;
    for (let i = 0; i < slots.length; i++) {
        if (!slots[i].hasChildNodes()) {
            // Highlight empty slot
            slots[i].classList.add('hint-active');
            setTimeout(() => {
                slots[i].classList.remove('hint-active');
            }, 2000);
            break;
        } else {
            const piece = slots[i].firstChild;
            const correctPosition = parseInt(piece.dataset.correctPosition);
            
            if (i !== correctPosition) {
                // Highlight correct slot
                slots[correctPosition].classList.add('hint-active');
                setTimeout(() => {
                    slots[correctPosition].classList.remove('hint-active');
                }, 2000);
                break;
            }
        }
    }
}

// Complete puzzle
function completePuzzle() {
    clearInterval(timer);
    finalMoves.textContent = moves;
    finalTime.textContent = `${time}s`;
    levelCompleteModal.classList.add('active');
}

// Next puzzle
function nextPuzzle() {
    levelCompleteModal.classList.remove('active');
    currentPuzzleIndex++;
    
    if (currentPuzzleIndex >= puzzles[currentLevel].length) {
        currentPuzzleIndex = 0;
    }
    imageUrl = puzzles[currentLevel][currentPuzzleIndex];
    initGame();
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start timer
function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        time++;
        timeDisplay.textContent = `${time}s`;
    }, 1000);
}

// Update UI
function updateUI() {
    moveCount.textContent = moves;
    hintsDisplay.textContent = hints;
    hintBtn.disabled = hints <= 0;
    levelDisplay.textContent = `Level: ${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}`;
    puzzleCountDisplay.textContent = `Puzzle: ${currentPuzzleIndex + 1}/${puzzles[currentLevel].length}`;
}

// Reset game
function resetGame() {
    clearInterval(timer);
    initGame();
}

// Event Listeners
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentLevel = btn.dataset.level;
        currentPuzzleIndex = 0;
        imageUrl = puzzles[currentLevel][currentPuzzleIndex];
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        initGame();
    });
});

resetBtn.addEventListener('click', resetGame);
hintBtn.addEventListener('click', showHint);
nextPuzzleBtn.addEventListener('click', nextPuzzle);

// Initialize game
initGame();