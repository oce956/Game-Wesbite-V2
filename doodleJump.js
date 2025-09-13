//board
let board;
let boardWidth;
let boardHeight;
let context;

//doodler
let doodlerWidth;
let doodlerHeight;
let doodlerX;
let doodlerY;
let doodlerRightImg;
let doodlerLeftImg;
let doodler = { img: null, x: 0, y: 0, width: 0, height: 0 };

//physics
let velocityX = 0;
let velocityY = 0;
let initialVelocityY = -8;
let gravity = 0.4;

//platforms
let platformsArray = [];
let platformWidth;
let platformHeight;
let platformImg;

let score = 0;
let maxScore = 0;
let doodleJumpbestScore;
let gameOver = false;

// drag controls
let isDragging = false;
let lastX = 0;

// flag to avoid multiple animation loops
let gameLoopStarted = false;

window.onload = function () {
  board = document.getElementById("board");
  context = board.getContext("2d");

  resizeBoard(); // initial responsive size
  window.addEventListener("resize", resizeBoard);

  doodleJumpbestScore = parseInt(localStorage.getItem("doodleJumpbestScore") || 0);

  // load images
  doodlerRightImg = new Image();
  doodlerRightImg.src = "doodler-right.png";
  doodler.img = doodlerRightImg;

  doodlerLeftImg = new Image();
  doodlerLeftImg.src = "doodler-left.png";

  platformImg = new Image();
  platformImg.src = "platform.png";

  velocityY = initialVelocityY;

  placePlatforms();

  document.getElementById("start-btn").addEventListener("click", startGame);

  // touch drag
  board.addEventListener("touchstart", (e) => {
    isDragging = true;
    lastX = e.touches[0].clientX;
  });
  board.addEventListener("touchmove", (e) => {
    if (isDragging) {
      const deltaX = e.touches[0].clientX - lastX;
      doodler.x += deltaX;
      lastX = e.touches[0].clientX;
    }
  });
  board.addEventListener("touchend", () => { isDragging = false; });

  // mouse drag
  board.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.clientX;
  });
  board.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const deltaX = e.clientX - lastX;
      doodler.x += deltaX;
      lastX = e.clientX;
    }
  });
  board.addEventListener("mouseup", () => { isDragging = false; });
  board.addEventListener("mouseleave", () => { isDragging = false; });

  // keyboard restart
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && gameOver) {
      startGame();
    }
  });
};

function resizeBoard() {
  let container = board.parentElement;
  boardWidth = container.clientWidth;
  boardHeight = container.clientHeight;
  board.width = boardWidth;
  board.height = boardHeight;

  // scale doodler
  doodlerWidth = boardWidth * 0.12;
  doodlerHeight = doodlerWidth;
  doodlerX = boardWidth / 2 - doodlerWidth / 2;
  doodlerY = boardHeight * 7/8 - doodlerHeight;

  doodler = {
    img: doodler.img || doodlerRightImg,
    x: doodlerX,
    y: doodlerY,
    width: doodlerWidth,
    height: doodlerHeight
  };

  // scale platforms
  platformWidth = boardWidth * 0.15;
  platformHeight = boardHeight * 0.035;
}

function startGame() {
  document.getElementById("start-btn").style.display = "none";

  // reset variables
  gameOver = false;
  resizeBoard();

  velocityX = 0;
  velocityY = initialVelocityY;
  score = 0;
  maxScore = 0;

  doodler.x = doodlerX;
  doodler.y = doodlerY;
  doodler.img = doodlerRightImg;

  platformsArray = [];
  placePlatforms();

  // remove old listeners to avoid duplicates
  document.removeEventListener("keydown", moveDoodler);
  document.addEventListener("keydown", moveDoodler);

  // start update loop once
  if (!gameLoopStarted) {
    requestAnimationFrame(update);
    gameLoopStarted = true;
  }
}

function update() {
  requestAnimationFrame(update);

  context.clearRect(0, 0, boardWidth, boardHeight);

  if (gameOver) {
    context.fillStyle = "black";
    context.font = "20px sans-serif";
    context.fillText("Game Over! Press Space to restart", boardWidth / 6, boardHeight / 2);
    context.fillText("Score: " + score, boardWidth / 6, boardHeight / 2 + 30);
    context.fillText("Best: " + doodleJumpbestScore, boardWidth / 6, boardHeight / 2 + 60);
    return;
  }

  // doodler movement
  doodler.x += velocityX;
  if (doodler.x > boardWidth) doodler.x = 0;
  else if (doodler.x + doodler.width < 0) doodler.x = boardWidth;

  velocityY += gravity;
  doodler.y += velocityY;
  if (doodler.y > boardHeight) gameOver = true;

  context.drawImage(doodler.img, doodler.x, doodler.y, doodler.width, doodler.height);

  // platforms
  for (let i = 0; i < platformsArray.length; i++) {
    let platform = platformsArray[i];
    if (velocityY < 0 && doodler.y < boardHeight * 3/4) {
      platform.y -= initialVelocityY; // move platforms down
    }
    if (detectCollision(doodler, platform) && velocityY >= 0) {
      velocityY = initialVelocityY; // jump
    }
    context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
  }

  // clear old platforms and add new
  while (platformsArray.length > 0 && platformsArray[0].y >= boardHeight) {
    platformsArray.shift();
    newPlatform();
  }

  // update score
  updateScore();
  context.fillStyle = "black";
  context.font = "14px sans-serif";
  context.fillText("Score: " + score, 5, 20);
  context.fillText("Best: " + doodleJumpbestScore, 5, 40);

  if (gameOver && score > doodleJumpbestScore) {
    doodleJumpbestScore = score;
    localStorage.setItem("doodleJumpbestScore", doodleJumpbestScore);
  }
}

function moveDoodler(e) {
  if (e.code === "ArrowRight" || e.code === "KeyD") {
    velocityX = 4;
    doodler.img = doodlerRightImg;
  } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
    velocityX = -4;
    doodler.img = doodlerLeftImg;
  }
}

function placePlatforms() {
  platformsArray = [];

  let startingPlatform = {
    img: platformImg,
    x: boardWidth / 2,
    y: boardHeight - 50,
    width: platformWidth,
    height: platformHeight
  };
  platformsArray.push(startingPlatform);

  for (let i = 0; i < 6; i++) {
    let randomX = Math.floor(Math.random() * (boardWidth - platformWidth));
    let platform = {
      img: platformImg,
      x: randomX,
      y: boardHeight - 75 * i - 150,
      width: platformWidth,
      height: platformHeight
    };
    platformsArray.push(platform);
  }
}

function newPlatform() {
  let randomX = Math.floor(Math.random() * (boardWidth - platformWidth));
  let platform = {
    img: platformImg,
    x: randomX,
    y: -platformHeight,
    width: platformWidth,
    height: platformHeight
  };
  platformsArray.push(platform);
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updateScore() {
  let points = Math.floor(30 * Math.random());
  if (velocityY < 0) {
    maxScore += points;
    if (score < maxScore) score = maxScore;
  } else if (velocityY >= 0) {
    maxScore -= points;
  }
}
