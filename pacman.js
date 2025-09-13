//board
let board;
const rowCount = 21;
const columnCount = 19;
let tileSize; // dynamic tile size
let boardWidth;
let boardHeight;
let context;
let pacmanBestScore;

//images
let blueGhostImage, orangeGhostImage, pinkGhostImage, redGhostImage;
let pacmanUpImage, pacmanDownImage, pacmanLeftImage, pacmanRightImage;
let wallImage, cherryImage;

// Map symbols
// X = wall, O = skip, P = pac man, ' ' = food, c = cherry
// Ghosts: b = blue, o = orange, p = pink, r = red
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X       cX",
    "X XX XXX X XXX XX X",
    "X   i         i   X",
    "X XX X XXXXX X XX X",
    "X    Xc      X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O   i   bpo   i   O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X   i    X    i   X",
    "X XX XXX X XXX XX X",
    "Xc X     P     X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
const cherries = new Set();
const hiddenWalls = new Set();
let pacman;

const directions = ['U', 'D', 'R', 'L'];

let score = 0;
let lives = 3;
let gameOver = false;

// Block class
class Block {
    constructor(image, x, y, width, height){
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startX = x;
        this.startY = y;
        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(direction){
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();

        this.x += this.velocityX;
        this.y += this.velocityY;

        for(let wall of walls.values()){
            if(collision(this, wall)){
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity(){
        if(this.direction == "U"){
            this.velocityX = 0;
            this.velocityY = -tileSize/4;
        } else if(this.direction == "D"){
            this.velocityX = 0;
            this.velocityY = tileSize/4;
        } else if(this.direction == "L"){
            this.velocityY = 0;
            this.velocityX = -tileSize/4;
        } else if(this.direction == "R"){
            this.velocityY = 0;
            this.velocityX = tileSize/4;
        }
    }

    reset(){
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
    }
}

// Helper functions
function collision(a, b){
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Dynamic tile size based on container width
function calculateTileSize() {
    const containerWidth = document.querySelector('.game-container').clientWidth;
    return Math.floor(containerWidth / columnCount);
}

// Scale all blocks according to new tileSize
function scaleBlocks(scale){
    for(let wall of walls) {
        wall.x *= scale;
        wall.y *= scale;
        wall.width = tileSize;
        wall.height = tileSize;
        wall.startX = wall.x;
        wall.startY = wall.y;
    }
    for(let ghost of ghosts) {
        ghost.x *= scale;
        ghost.y *= scale;
        ghost.width = tileSize;
        ghost.height = tileSize;
        ghost.startX = ghost.x;
        ghost.startY = ghost.y;
    }
    for(let cherry of cherries) {
        cherry.x *= scale;
        cherry.y *= scale;
        cherry.width = tileSize;
        cherry.height = tileSize;
        cherry.startX = cherry.x;
        cherry.startY = cherry.y;
    }
    for(let food of foods) {
        food.x *= scale;
        food.y *= scale;
        food.width = Math.max(1, Math.floor(tileSize/8));
        food.height = Math.max(1, Math.floor(tileSize/8));
    }
    pacman.x *= scale;
    pacman.y *= scale;
    pacman.width = tileSize;
    pacman.height = tileSize;
    pacman.startX = pacman.x;
    pacman.startY = pacman.y;
}

// Setup board dimensions
function setupBoard() {
    const oldTile = tileSize || 32;
    tileSize = calculateTileSize();
    const scale = tileSize / oldTile;

    boardWidth = columnCount * tileSize;
    boardHeight = rowCount * tileSize;

    board.width = boardWidth;
    board.height = boardHeight;

    if(walls.size || ghosts.size || pacman){
        scaleBlocks(scale);
    }
}

// Load images
function loadImages (){
    wallImage = new Image(); wallImage.src = "./wall.png";

    blueGhostImage = new Image(); blueGhostImage.src = "./blueGhost.png";
    orangeGhostImage = new Image(); orangeGhostImage.src = "./orangeGhost.png";
    pinkGhostImage = new Image(); pinkGhostImage.src = "./pinkGhost.png";
    redGhostImage = new Image(); redGhostImage.src = "./redGhost.png";

    pacmanDownImage = new Image(); pacmanDownImage.src = "./pacmanDown.png";
    pacmanUpImage = new Image(); pacmanUpImage.src = "./pacmanUp.png";
    pacmanLeftImage = new Image(); pacmanLeftImage.src = "./pacmanLeft.png";
    pacmanRightImage = new Image(); pacmanRightImage.src = "./pacmanRight.png";

    cherryImage = new Image(); cherryImage.src = "./cherry.png";
}

// Load map
function loadMap(){
    walls.clear(); foods.clear(); ghosts.clear(); cherries.clear(); hiddenWalls.clear();

    for(let r = 0; r < rowCount; r++){
        for(let c = 0; c < columnCount; c++){
            const tileMapChar = tileMap[r][c];
            const x = c*32;
            const y = r*32;

            if(tileMapChar == "X"){
                walls.add(new Block(wallImage, x, y, 32, 32));
            } else if(tileMapChar == "b"){
                ghosts.add(new Block(blueGhostImage, x, y, 32, 32));
            } else if(tileMapChar == "p"){
                ghosts.add(new Block(pinkGhostImage, x, y, 32, 32));
            } else if(tileMapChar == "o"){
                ghosts.add(new Block(orangeGhostImage, x, y, 32, 32));
            } else if(tileMapChar == "r"){
                ghosts.add(new Block(redGhostImage, x, y, 32, 32));
            } else if(tileMapChar == "P"){
                pacman = new Block(pacmanRightImage, x, y, 32, 32);
            } else if(tileMapChar == " "){
                foods.add(new Block(null, x+14, y+14, 4, 4));
            } else if(tileMapChar == "c"){
                cherries.add(new Block(cherryImage, x, y, 32, 32));
            } else if(tileMapChar == "i"){
                foods.add(new Block(null, x+14, y+14, 4, 4));
                hiddenWalls.add(new Block(null, x, y, 32, 32));
            }
        }
    }
}

// Update loop
function update(){
    if (!gameOver) move();
    draw();
    setTimeout(update, 50);
}

// Draw function
function draw(){
    context.clearRect(0, 0, board.width, board.height);

    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    for(let ghost of ghosts.values()){
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }
    for(let wall of walls.values()){
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }
    for(let cherry of cherries.values()){
        context.drawImage(cherry.image, cherry.x, cherry.y, cherry.width, cherry.height);
    }

    context.fillStyle = "white";
    for(let food of foods.values()){
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    context.fillStyle = 'white';
    context.font = `${Math.max(12, tileSize/2)}px sans-serif`;
    if(gameOver){
        context.fillText("Game Over: " + score + "  Best: " + pacmanBestScore, tileSize/2, tileSize/2);
    } else {
        context.fillText("x" + lives + " " + score + " Best: " + pacmanBestScore, tileSize/2, tileSize/2);
    }
}

// Movement and collisions
function move(){
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    if (pacman.y === tileSize * 9) {
        if (pacman.x < -pacman.width / 2) pacman.x = boardWidth;
        else if (pacman.x > boardWidth) pacman.x = -pacman.width / 2;
    }

    for(let wall of walls.values()){
        if(collision(pacman, wall)){
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    for (let ghost of ghosts.values()){
        if(collision(ghost, pacman)){
            lives--;
            if(lives==0){ gameOver=true; return; }
            resetPositions();
        }

        if(ghost.y == tileSize*9 && ghost.direction!='U'&&ghost.direction!='D'){
            ghost.updateDirection('U');
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;

        for (let wall of walls.values()){
            if(collision(ghost, wall) || ghost.x <=0 || ghost.x + ghost.width >= boardWidth){
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                ghost.updateDirection(directions[Math.floor(Math.random()*4)]);
            }
        }
        for (let wall of hiddenWalls.values()){
            if(collision(ghost, wall) || ghost.x <=0 || ghost.x + ghost.width >= boardWidth){
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                ghost.updateDirection(directions[Math.floor(Math.random()*4)]);
            }
        }
    }

    let foodEaten = null;
    for(let food of foods.values()){
        if(collision(pacman, food)){
            foodEaten = food;
            score += 10;
            break;
        }
    }
    foods.delete(foodEaten);

    if(foods.size == 0){
        loadMap();
        setupBoard();
        resetPositions();
    }

    let cherryEaten = null;
    for(let cherry of cherries.values()){
        if(collision(pacman, cherry)){
            cherryEaten = cherry;
            score += 100;
            break;
        }
    }
    cherries.delete(cherryEaten);
}

// Keyboard controls
function movePacman(e){
    if(gameOver){ resetGame(); return; }

    if(["ArrowUp","KeyW"].includes(e.code)) pacman.updateDirection('U');
    if(["ArrowDown","KeyS"].includes(e.code)) pacman.updateDirection('D');
    if(["ArrowLeft","KeyA"].includes(e.code)) pacman.updateDirection('L');
    if(["ArrowRight","KeyD"].includes(e.code)) pacman.updateDirection('R');

    updatePacmanImage();
}

// Update Pacman image
function updatePacmanImage() {
    if(pacman.direction=="U") pacman.image=pacmanUpImage;
    if(pacman.direction=="D") pacman.image=pacmanDownImage;
    if(pacman.direction=="L") pacman.image=pacmanLeftImage;
    if(pacman.direction=="R") pacman.image=pacmanRightImage;
}

// Reset game
function resetGame(){
    if(score > pacmanBestScore){
        pacmanBestScore = score;
        localStorage.setItem("pacmanBestScore", pacmanBestScore);
    }
    loadMap();
    setupBoard();
    resetPositions();
    lives = 3;
    score = 0;
    gameOver = false;
}

// Reset positions
function resetPositions(){
    pacman.reset();
    for(let ghost of ghosts.values()){
        ghost.reset();
        ghost.updateDirection(directions[Math.floor(Math.random()*4)]);
    }
}

// Mobile touch controls
function setupMobileControls() {
    document.getElementById("up").addEventListener("click", () => { pacman.updateDirection("U"); updatePacmanImage(); });
    document.getElementById("down").addEventListener("click", () => { pacman.updateDirection("D"); updatePacmanImage(); });
    document.getElementById("left").addEventListener("click", () => { pacman.updateDirection("L"); updatePacmanImage(); });
    document.getElementById("right").addEventListener("click", () => { pacman.updateDirection("R"); updatePacmanImage(); });
}

// On window load
window.onload = function(){
    board = document.getElementById("board");
    context = board.getContext("2d");
    pacmanBestScore = parseInt(localStorage.getItem("pacmanBestScore") || 0);

    loadImages();
    loadMap();
    setupBoard();

    for(let ghost of ghosts.values()){
        ghost.updateDirection(directions[Math.floor(Math.random()*4)]);
    }

    setupMobileControls();
    update();

    document.addEventListener("keydown", movePacman);
    document.getElementById("reset").addEventListener("click", resetGame);

    window.addEventListener("resize", () => {
        setupBoard();
        draw();
    });
};
