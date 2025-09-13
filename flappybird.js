let board;
let boardWidth;
let boardHeight;
let context;
let flappyBestScore;

let birdImg;
let bird = { x: 0, y: 0, width: 0, height: 0 };

// pipes
let pipeArray = [];
let pipeWidth;
let pipeHeight;
let pipeX;
let pipeY = 0;
let topPipeImg;
let bottomPipeImg;

// game physics
let velocityX = -2; // pipes move left
let velocityY = 0;  // bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;

window.onload = function () {
  board = document.getElementById("board");
  context = board.getContext("2d");

  resizeBoard(); // set initial size
  window.addEventListener("resize", resizeBoard); // update on resize

  flappyBestScore = parseInt(localStorage.getItem("flappyBestScore") || 0);

  // bird image
  birdImg = new Image();
  birdImg.src = "./flappybird.png";

  // pipe images
  topPipeImg = new Image();
  topPipeImg.src = "./toppipe.png";
  bottomPipeImg = new Image();
  bottomPipeImg.src = "./bottompipe.png";

  const startBtn = document.getElementById("start-btn");
  startBtn.addEventListener("click", () => {
    startBtn.style.display = "none";

    // keyboard controls
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") flap(e);
    });

    // touch / mouse controls
    document.addEventListener("touchstart", flap);
    document.addEventListener("mousedown", flap);

    requestAnimationFrame(update);
    setInterval(placePipes, 1500);
  });
};

// resize canvas and scale bird/pipes
function resizeBoard() {
  const container = board.parentElement;
  boardWidth = container.clientWidth;
  boardHeight = container.clientHeight;
  board.width = boardWidth;
  board.height = boardHeight;

  // scale bird
  bird.width = boardWidth * 0.09;
  bird.height = bird.width * 0.7;
  bird.x = boardWidth / 8;
  bird.y = boardHeight / 2;

  // scale pipes
  pipeWidth = boardWidth * 0.18;
  pipeHeight = boardHeight * 0.8;
  pipeX = boardWidth;
}

function update() {
  requestAnimationFrame(update);

  if (gameOver) {
    drawScores();
    context.fillStyle = "white";
    context.font = "bold 40px sans-serif";
    context.textAlign = "center";
    context.fillText("GAME OVER", boardWidth / 2, boardHeight / 2);
    context.textAlign = "left";
    return;
  }

  context.clearRect(0, 0, board.width, board.height);

  // gravity
  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0);
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  if (bird.y > board.height) {
    gameOver = true;
  }

  // pipes
  for (let i = 0; i < pipeArray.length; i++) {
    const pipe = pipeArray[i];
    pipe.x += velocityX;
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      score += 0.5;
      pipe.passed = true;
    }

    if (detectCollision(bird, pipe)) {
      gameOver = true;
    }
  }

  // remove offscreen pipes
  while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift();
  }

  drawScores();
}

// display current score and best score
function drawScores() {
  context.fillStyle = "white";
  context.font = "28px sans-serif";
  context.textAlign = "left";
  context.fillText("Score: " + Math.floor(score), 10, 35);

  context.textAlign = "right";
  context.fillText("Best: " + flappyBestScore, boardWidth - 10, 35);
  context.textAlign = "left";
}

// flap / jump function
function flap(e) {
  if (e) e.preventDefault(); // stop scrolling on mobile
  velocityY = -6;

  // reset game if over
  if (gameOver) {
    if (score > flappyBestScore) {
      flappyBestScore = score;
      localStorage.setItem("flappyBestScore", flappyBestScore);
    }
    bird.y = boardHeight / 2;
    pipeArray = [];
    score = 0;
    gameOver = false;
  }
}

// generate pipes
function placePipes() {
  if (gameOver) return;

  let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
  let openingSpace = boardHeight / 4;

  const topPipe = {
    img: topPipeImg,
    x: pipeX,
    y: randomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };
  pipeArray.push(topPipe);

  const bottomPipe = {
    img: bottomPipeImg,
    x: pipeX,
    y: randomPipeY + pipeHeight + openingSpace,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };
  pipeArray.push(bottomPipe);
}

// collision detection
function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
