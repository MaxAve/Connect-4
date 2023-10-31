let winner = 0; // Current game winner
let gameRunning = true;

// Generate row masks
function generateRowMasks() {
    let masks = [];
    // Vertical
    for(let i = 0n; i < 21n; i += 1n) {
        masks.push(0x204081n << i);
    }
    // Horizontal
    for(let y = 0n; y < 6n; y += 1n) {
        for(let i = 0n; i < 4n; i += 1n) {
            masks.push(0xfn << (i + y*7n));
        }
    }
    // Diagonal (downward slope from left to right)
    for(let i = 0n; i < 3; i += 1n) {
        for(let j = 0n; j < 4n; j += 1n) {
            masks.push(0x1010101n << (j + i*7n));
        }
    }
    // Diagonal (upward slope from left to right)
    for(let i = 0n; i < 3; i += 1n) {
        for(let j = 0n; j < 4n; j += 1n) {
            masks.push(0x208208n << (j + i*7n));
        }
    }
    return masks;
}

const rowMasks = generateRowMasks(); // Row mask (4 in a row)

class Board {
    constructor() {
        this.bitboardPlayer1 = BigInt(0);
        this.bitboardPlayer2 = BigInt(0);
        this.flags = 1;
    }

    // Returns winner (1 = player1, 0 = draw, -1 = player2)
    getWinner() {
        // Apply row masks to bitboards to check for winner
        for(let i = 0; i < rowMasks.length; i++) {
            if((this.bitboardPlayer1 & rowMasks[i]) === rowMasks[i]) {
                return 1;
            }
        }
        for(let i = 0; i < rowMasks.length; i++) {
            if((this.bitboardPlayer2 & rowMasks[i]) === rowMasks[i]) {
                return -1;
            }
        }
        return 0;
    }

    // Returns true if the board is full
    isFull() {
        return (this.bitboardPlayer1 | this.bitboardPlayer2) >= 0x3ffffffffffn;
    }

    // Returns the y coordinate of the top-most disc
    getTop(x) {
        let mask = BigInt(1n << BigInt(x));
        for(let i = 0; i < 6; i++) {
            if((this.bitboardPlayer1 | this.bitboardPlayer2) & mask) {
                mask <<= 7n;
            } else {
                return 6 - i;
            }
        }
    }

    // Places a disk at a column
    placeDisc(x) {
        let mask = BigInt(1n << BigInt(x));
        if(this.flags & 1) {
            for(let i = 0; i < 6; i++) {
                if((this.bitboardPlayer1 | this.bitboardPlayer2) & mask) {
                    mask <<= 7n;
                } else {
                    this.bitboardPlayer1 |= mask;
                    break;
                }
            }
        } else {
            for(let i = 0; i < 6; i++) {
                if((this.bitboardPlayer1 | this.bitboardPlayer2) & mask) {
                    mask <<= 7n;
                } else {
                    this.bitboardPlayer2 |= mask;
                    break;
                }
            }
        }
    }
}

let gameBoard = new Board(); // Main game board

// HTML canvas and browser context
let canvas = document.getElementById("game");
let context = canvas.getContext("2d");

// Connect 4 disc size
const discRadius = 50;
const distanceBetweenCells = 15;

// Grid X, Y positions relative to the canvas
const gridX = discRadius + (canvas.width - 7*(discRadius*2+distanceBetweenCells))/2;
const gridY = discRadius + (canvas.height - 6*(discRadius*2+distanceBetweenCells))/2;

let selectedColumn = 0; // Current selected column on the connect 4 grid

// Gets selected column
canvas.addEventListener("mousemove", (event) => {
    if(gameRunning) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;
        if(mouseY > (gridY - discRadius) && mouseY < gridY+6*(discRadius*2 + distanceBetweenCells)) {
            selectedColumn = Math.floor((mouseX - gridX - discRadius) / (discRadius*2 + distanceBetweenCells)) + 1;
        } else {
            selectedColumn = -1;
        }
    }
});

// Throws in a disc
canvas.addEventListener("click", (event) => {
    if(winner === 0 && gameRunning) {
        gameBoard.placeDisc(6 - selectedColumn);
        gameBoard.flags ^= 1; // Swap turns
        winner = gameBoard.getWinner(); // Check for 4 in a row
    }
});

// Draws a disk on the connect 4 grid
function drawDisc(xPos, yPos) {
    const x = Number(xPos);
    const y = Number(yPos);
    context.beginPath();
    context.arc(x * (discRadius*2 + distanceBetweenCells) + gridX, y * (discRadius*2 + distanceBetweenCells) + gridY, discRadius, 0, 2 * Math.PI);
    context.fill();
}

function drawDiscs(board) {
    context.fillStyle ='red';
    for(var i = BigInt(0); i < BigInt(42); i++) {
        if((board.bitboardPlayer1 & (1n << i))) {
            drawDisc(6n - i % 7n, 5n - i / 7n);
        }
    }
    context.fillStyle ='yellow';
    for(var i = BigInt(0); i < BigInt(42); i++) {
        if((board.bitboardPlayer2 & (1n << i))) {
            drawDisc(6n - i % 7n, 5n - i / 7n);
        }
    }
}

// Main game loop
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw empty cells
    context.fillStyle = 'rgb(56, 53, 53)';
    for(var y = 0; y < 6; y++) {
        for(var x = 0; x < 7; x++) {
            drawDisc(x, y);
        }
    }

    // Draw discs
    drawDiscs(gameBoard);

    if(winner === 0) {
        // Check for draws
        if(gameBoard.isFull()) {
            context.fillStyle = 'gray';
            context.font = "bold 40px Arial";
            context.fillText("It's a draw!", canvas.width/2 - 110, 50);
            gameRunning = false;
        } else {
            // Highlight selected column
            if(selectedColumn >= 0 && selectedColumn < 7) {
                context.fillStyle = (gameBoard.flags === 1) ? 'rgba(255, 127, 127, 0.3)' : 'rgba(255, 255, 0, 0.3)';
                drawDisc(selectedColumn, gameBoard.getTop(6 - selectedColumn)-1);
            }
        }
    } else {
        // Display a message saying who the winner is
        if(winner === 1) {
            context.fillStyle = 'red';
            context.font = "bold 40px Arial";
            context.fillText("Player 1 wins!", canvas.width/2 - 140, 50);
            gameRunning = false;
        } else {
            context.fillStyle = 'yellow';
            context.font = "bold 40px Arial";
            context.fillText("Player 2 wins!", canvas.width/2 - 140, 50);
            gameRunning = false;
        }
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
