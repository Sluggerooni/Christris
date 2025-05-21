const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 32;
const tetrominoSequence = [];
const playfield = [];
let paused = false;

const colors = {
  'I': 'cyan', 'O': 'yellow', 'T': 'purple',
  'S': 'green', 'Z': 'red', 'J': 'blue', 'L': 'orange'
};

for (let row = -2; row < 20; row++) {
  playfield[row] = [];
  for (let col = 0; col < 10; col++) playfield[row][col] = 0;
}

const tetrominos = {
  'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  'J': [[1,0,0],[1,1,1],[0,0,0]],
  'L': [[0,0,1],[1,1,1],[0,0,0]],
  'O': [[1,1],[1,1]],
  'S': [[0,1,1],[1,1,0],[0,0,0]],
  'Z': [[1,1,0],[0,1,1],[0,0,0]],
  'T': [[0,1,0],[1,1,1],[0,0,0]]
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSequence() {
  const sequence = ['I','J','L','O','S','T','Z'];
  while (sequence.length) {
    const rand = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(name);
  }
}

function getNextTetromino() {
  if (tetrominoSequence.length === 0) generateSequence();
  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
  const row = name === 'I' ? -1 : -2;
  return { name, matrix, row, col };
}

function rotate(matrix) {
  const N = matrix.length - 1;
  return matrix.map((row, i) =>
    row.map((_, j) => matrix[N - j][i])
  );
}

function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (
        matrix[row][col] &&
        (cellCol + col < 0 ||
         cellCol + col >= playfield[0].length ||
         cellRow + row >= playfield.length ||
         playfield[cellRow + row][cellCol + col])
      ) return false;
    }
  }
  return true;
}

function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        if (tetromino.row + row < 0) return showGameOver();
        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    }
  }

  let linesCleared = 0;
  for (let row = playfield.length - 1; row >= 0;) {
    if (playfield[row].every(cell => !!cell)) {
      linesCleared++;
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r-1][c];
        }
      }
    } else row--;
  }

  if (linesCleared > 0) {
    lineCount += linesCleared;
    combo++;
    score += linesCleared * 100 + combo * 50;
  } else {
    combo = 0;
  }

  updateInfo();
  tetromino = heldThisTurn ? getNextTetromino() : nextTetromino;
  nextTetromino = getNextTetromino();
  heldThisTurn = false;
  updatePreview();
}

function updateInfo() {
  document.querySelector('#info').innerHTML = `
    <p>Score: ${score}</p>
    <p>Combo: ${combo}</p>
    <p>Lines: ${lineCount}</p>
  `;
}

function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;
  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
}

function updatePreview() {
  const canvasNext = document.createElement('canvas');
  canvasNext.width = 150;
  canvasNext.height = 150;
  const ctxNext = canvasNext.getContext('2d');
  const preview = document.getElementById('next');
  preview.innerHTML = '';
  preview.appendChild(canvasNext);

  const matrix = nextTetromino.matrix;
  const color = colors[nextTetromino.name];
  const blockSize = 30;
  ctxNext.fillStyle = color;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        ctxNext.fillRect(c * blockSize, r * blockSize, blockSize - 2, blockSize - 2);
      }
    }
  }
}

function updateHoldDisplay() {
  const holdDiv = document.getElementById('hold');
  holdDiv.innerHTML = '';
  if (!hold) return;

  const canvasHold = document.createElement('canvas');
  canvasHold.width = 150;
  canvasHold.height = 150;
  const ctxHold = canvasHold.getContext('2d');

  const matrix = hold.matrix;
  const color = colors[hold.name];
  const blockSize = 30;

  ctxHold.fillStyle = color;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        ctxHold.fillRect(c * blockSize, r * blockSize, blockSize - 2, blockSize - 2);
      }
    }
  }

  holdDiv.appendChild(canvasHold);
}

let count = 0;
let tetromino = getNextTetromino();
let nextTetromino = getNextTetromino();
let hold = null;
let heldThisTurn = false;
let rAF = null;
let gameOver = false;
let score = 0;
let combo = 0;
let lineCount = 0;

updateInfo();
updatePreview();

function loop() {
  rAF = requestAnimationFrame(loop);
  if (paused || gameOver) return;
  
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (paused) {
    context.fillStyle = 'black';
    context.globalAlpha = 0.75;
    context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
    context.globalAlpha = 1;
    context.fillStyle = 'white';
    context.font = '36px monospace';
    context.textAlign = 'center';
    context.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    return;
  }

  if (gameOver) return;
  // Draw placed blocks
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = colors[name];
        context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
      }
    }
  }

  if (tetromino) {

    let ghostRow = tetromino.row;
    while (isValidMove(tetromino.matrix, ghostRow + 1, tetromino.col)) {
      ghostRow++;
    }

    context.globalAlpha = 0.3; 
    context.fillStyle = colors[tetromino.name];
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {
          context.fillRect(
            (tetromino.col + col) * grid,
            (ghostRow + row) * grid,
            grid - 1,
            grid - 1
          );
        }
      }
    }
    context.globalAlpha = 1.0; 

    if (++count > 60) {
      tetromino.row++;
      count = 0;

      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }

    context.fillStyle = colors[tetromino.name];
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {
          context.fillRect(
            (tetromino.col + col) * grid,
            (tetromino.row + row) * grid,
            grid - 1,
            grid - 1
          );
        }
      }
    }
  }
}


document.addEventListener('keydown', function(e) {
  if (e.code === 'Escape') {
  paused = !paused;
  if (paused) {
  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
  return;
}
  return;
}
  if (gameOver) return;

  if (e.which === 37 || e.which === 39) {
    const col = e.which === 37 ? tetromino.col - 1 : tetromino.col + 1;
    if (isValidMove(tetromino.matrix, tetromino.row, col)) tetromino.col = col;
  }

  if (e.which === 38) {
    const rotated = rotate(tetromino.matrix);
    if (isValidMove(rotated, tetromino.row, tetromino.col)) tetromino.matrix = rotated;
  }

  if (e.which === 40) {
    const row = tetromino.row + 1;
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;
      placeTetromino();
    } else tetromino.row = row;
  }

if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !heldThisTurn) {
    if (!hold) {
      hold = tetromino;
      tetromino = nextTetromino;
      nextTetromino = getNextTetromino();
    } else {
      [tetromino, hold] = [hold, tetromino];
    }
    tetromino.row = tetromino.name === 'I' ? -1 : -2;
    tetromino.col = playfield[0].length / 2 - Math.ceil(tetromino.matrix[0].length / 2);
    heldThisTurn = true;
    updateHoldDisplay();
    updatePreview();
  }

  if (e.which === 32) { 
    while (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
      tetromino.row++;
      score += 2;
    }
    placeTetromino();
    updateInfo();
  }
});

rAF = requestAnimationFrame(loop);