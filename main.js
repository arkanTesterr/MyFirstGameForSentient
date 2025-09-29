const API_KEY = 'AIzaSyCKkqyUbW9kT3O9AmWmSI2CWdxG4bll89g';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjustable game settings
const GAME_HEIGHT = 640; // Change this value to set custom game height

// Load images
const playerImg = new Image();
playerImg.src = 'player.png';

const obstacleImg = new Image();
obstacleImg.src = 'obstacle.png';

let imagesLoaded = 0;
function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === 2) {
    init(); // Start game after images are loaded
  }
}
playerImg.onload = onImageLoad;
obstacleImg.onload = onImageLoad;

let W, H;
let keys = { left: false, right: false };
let player, obstacles = [], score = 0, high = 0, running = false, muted = false;
let spawnTimer = 0, spawnInterval = 60, gravitySpeed = 2;

// Game setup
function init() {
  resize();
  high = localStorage.getItem('dodge_high') || 0;
  player = {
    x: W / 2 - 35,
    y: H - 120,
    w: 70,
    h: 70,
    speed: 5
  };
  fetchTheme();
}

// Fetch theme from Gemini
async function fetchTheme() {
  document.getElementById('theme-info').style.display = 'block';
  document.getElementById('theme-title').textContent = 'Loading Theme...';
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Generate a creative theme for a simple obstacle-dodging game. Provide a short, exciting title and a one-sentence backstory. Format it as Title: [Title]\\nBackstory: [Backstory]" }]
        }]
      })
    });
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const titleMatch = text.match(/Title: (.*)/);
    const backstoryMatch = text.match(/Backstory: (.*)/);
    
    if (titleMatch && backstoryMatch) {
      document.getElementById('theme-title').textContent = titleMatch[1];
      document.getElementById('theme-backstory').textContent = backstoryMatch[1];
    }
    
    setTimeout(() => {
      document.getElementById('theme-info').style.display = 'none';
      restart();
    }, 4000);

  } catch (error) {
    console.error('Error fetching theme:', error);
    document.getElementById('theme-title').textContent = 'Dodge Them!';
    document.getElementById('theme-backstory').textContent = 'Avoid the falling blocks.';
    setTimeout(() => {
      document.getElementById('theme-info').style.display = 'none';
      restart();
    }, 2000);
  }
}

// Resize canvas
function resize() {
  W = canvas.clientWidth;
  H = GAME_HEIGHT; // Dynamic value from constant
  fixPixelRatio();
}

// Keyboard events
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

// Touch events
canvas.addEventListener('touchstart', (e) => {
  const touchX = e.touches[0].clientX;
  if (touchX < W / 2) keys.left = true;
  else keys.right = true;
});
canvas.addEventListener('touchend', () => {
  keys.left = false;
  keys.right = false;
});

// Spawn obstacles
function spawn() {
  const size = Math.random() * 20 + 40; // random size between 40 and 60
  obstacles.push({
    x: Math.random() * (W - size),
    y: -size,
    w: size,
    h: size,
    speed: gravitySpeed
  });
}

// Update game state
function update() {
  if (!running) return;
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  player.x = Math.max(6, Math.min(W - player.w - 6, player.x));

  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawn();
    if (spawnInterval > 18) spawnInterval -= 0.7;
    gravitySpeed += 0.03;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.speed * (W / 900);
    if (o.y + o.h > player.y && o.y < player.y + player.h &&
        o.x < player.x + player.w && o.x + o.w > player.x) {
      gameOver();
    }
    if (o.y > H + 50) {
      obstacles.splice(i, 1);
      score += 1;
    }
  }
}

// Draw everything
function draw() {
  ctx.fillStyle = '#04162a';
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 60; i++) {
    const sx = (i * 37) % W, sy = (i * 23) % H;
    ctx.fillStyle = 'rgba(160,200,255,0.02)';
    ctx.fillRect((sx + (score % 100)) / 1.1 % W, sy, 1, 1);
  }

  // Draw player
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // Draw obstacles
  for (const o of obstacles) {
    ctx.drawImage(obstacleImg, o.x, o.y, o.w, o.h);
  }

  document.getElementById('score').textContent = score;
  document.getElementById('high').textContent = high;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function gameOver() {
  running = false;
  if (score > high) {
    high = score;
    localStorage.setItem('dodge_high', high);
  }
  setTimeout(() => {
    const again = confirm(`Game Over\\nScore: ${score}\\nHigh: ${high}\\n\\nPlay again?`);
    if (again) restart();
  }, 60);
}

function restart() {
  obstacles = [];
  spawnTimer = 0;
  spawnInterval = 60;
  gravitySpeed = 2;
  score = 0;
  running = true;
  player.x = W / 2 - player.w / 2;
  loop();
}

let rafId;
function loop() {
  update();
  draw();
  if (running) rafId = requestAnimationFrame(loop);
  else cancelAnimationFrame(rafId);
}

document.getElementById('restartBtn').addEventListener('click', () => { restart(); });
document.getElementById('muteBtn').addEventListener('click', () => {
  muted = !muted;
  document.getElementById('muteBtn').textContent = muted ? 'Unmute' : 'Mute';
});

function fixPixelRatio() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * ratio);
  canvas.height = Math.round(H * ratio);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

window.addEventListener('resize', () => { resize(); fixPixelRatio(); });
