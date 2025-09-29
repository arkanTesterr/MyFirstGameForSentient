// ====== Canvas Setup ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 600;

// ====== Game Variables ======
let keys = {};
let bullets = [];
let enemies = [];
let logos = [];
let score = 0;
let hp = 100;
let bossTimer = 30;
let gameOver = false;
let enemySpawnRate = 1000; // ms
let lastEnemySpawn = 0;

// ====== Assets ======
const playerImg = new Image();
playerImg.src = "player.png";

const enemyImg = new Image();
enemyImg.src = "obstacle.png";

const bulletImg = new Image();
bulletImg.src = "bullets.png";

const logoImg = new Image();
logoImg.src = "logo.png";

// ====== Player Object ======
let player = {
  x: canvas.width / 2 - 30,
  y: canvas.height - 100,
  w: 60,
  h: 60,
  speed: 5,
  shooting: false,
  shootCooldown: 200, // ms
  lastShot: 0,
};

// ====== Events ======
document.addEventListener("keydown", (e) => { keys[e.key] = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });
document.getElementById("restartBtn").addEventListener("click", resetGame);

// ====== Utility Functions ======
function resetGame() {
  score = 0;
  hp = 100;
  bossTimer = 30;
  bullets = [];
  enemies = [];
  gameOver = false;
  player.x = canvas.width / 2 - 30;
  player.y = canvas.height - 100;
  generateLogos();
  loop();
}

function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - 50),
        y: -50,
        w: 50,
        h: 50,
        speed: 2 + Math.random() * 2
    });
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
    );
}

// ====== Background Logos ======
function generateLogos() {
  logos = [];
  for (let i = 0; i < 10; i++) {
    logos.push({
      x: Math.random() * (canvas.width - 80),
      y: Math.random() * (canvas.height - 80),
      size: 60 + Math.random() * 40
    });
  }
}

function drawBackground() {
  logos.forEach((l) => {
    ctx.globalAlpha = 0.07; // light watermark effect
    ctx.drawImage(logoImg, l.x, l.y, l.size, l.size);
    ctx.globalAlpha = 1.0;
  });
}

// ====== Core Game Loop ======
function update(timestamp) {
    if (gameOver) return;

    // Player movement
    if (keys["ArrowLeft"] || keys["a"]) {
        if (player.x > 0) player.x -= player.speed;
    }
    if (keys["ArrowRight"] || keys["d"]) {
        if (player.x < canvas.width - player.w) player.x += player.speed;
    }
    if (keys["ArrowUp"] || keys["w"]) {
        if (player.y > 0) player.y -= player.speed;
    }
    if (keys["ArrowDown"] || keys["s"]) {
        if (player.y < canvas.height - player.h) player.y += player.speed;
    }

    // Shooting
    if (keys[" "] && timestamp - player.lastShot > player.shootCooldown) {
        bullets.push({
            x: player.x + player.w / 2 - 5,
            y: player.y,
            w: 10,
            h: 20,
            speed: 10
        });
        player.lastShot = timestamp;
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.y -= b.speed;
        if (b.y < 0) {
            bullets.splice(i, 1);
        }
    }

    // Enemy spawning
    if (timestamp - lastEnemySpawn > enemySpawnRate) {
        spawnEnemy();
        lastEnemySpawn = timestamp;
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += e.speed;
        if (e.y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
    
    // Collision detection
    // Bullets vs Enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], enemies[j])) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 10;
                break; 
            }
        }
    }

    // Player vs Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (checkCollision(player, enemies[i])) {
            enemies.splice(i, 1);
            hp -= 20;
            if (hp <= 0) {
                hp = 0;
                gameOver = true;
            }
        }
    }
    
    // Update boss timer
    bossTimer -= 1/60; // Assuming 60 FPS
    if(bossTimer < 0) bossTimer = 0;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  drawBackground();

  // Player
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // Bullets
  bullets.forEach(b => {
      ctx.drawImage(bulletImg, b.x, b.y, b.w, b.h);
  });

  // Enemies
  enemies.forEach(e => {
      ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
  });

  // HUD Update
  document.getElementById("score").textContent = score;
  document.getElementById("hp").textContent = hp;
  document.getElementById("boss").textContent = Math.floor(bossTimer);
  
  if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "50px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  }
}

function loop(timestamp) {
  update(timestamp);
  draw();
  if (!gameOver) {
    requestAnimationFrame(loop);
  }
}

// ====== Init ======
generateLogos();
loop(0);
