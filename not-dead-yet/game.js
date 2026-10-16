/**
 * ====================================================================
 * NOT DEAD YET - 2D Zombie Campus Lockdown Survival
 * ====================================================================
 * Built for hackathons: Clean, modular, zero-dependency HTML5 Canvas.
 * Supports 3 Progressive Difficulty Levels & Animated Character Sprites.
 */

// Level Configurations (Easy -> Medium -> Hard)
const LEVEL_CONFIGS = [
  {
    level: 1,
    title: "LEVEL 1: CLASSROOM OUTBREAK",
    difficulty: "Easy",
    badgeClass: "easy",
    timeLimit: 200,          // 3 minutes 20s
    zombieCount: 3,
    zombieDamage: 16,
    zombiePatrolSpeed: 1.15,
    zombieChaseSpeed: 1.95,
    noiseRadiusWalk: 110,
    noiseRadiusSprint: 280,
    flashlightBeamDist: 320,
    flashlightBeamAngle: 0.52,
    description: "Initial containment breach. Evacuate Classroom 101, locate the Lab Keycard, and reach the emergency exit.",
    nextSectorHint: "Power grid failure detected in Sector 2. Expect pitch-black corridors and faster stalkers."
  },
  {
    level: 2,
    title: "LEVEL 2: THE BLACKOUT",
    difficulty: "Medium",
    badgeClass: "medium",
    timeLimit: 160,          // 2 minutes 40s
    zombieCount: 5,
    zombieDamage: 22,
    zombiePatrolSpeed: 1.35,
    zombieChaseSpeed: 2.35,
    noiseRadiusWalk: 125,
    noiseRadiusSprint: 380,
    flashlightBeamDist: 260,
    flashlightBeamAngle: 0.46,
    description: "Generators offline. Auxiliary emergency lighting only. Aggressive infected roaming the main corridor.",
    nextSectorHint: "Quarantine decontamination sequence initiated in Sector 3! Lethal mutated specimens incoming."
  },
  {
    level: 3,
    title: "LEVEL 3: QUARANTINE PURGE",
    difficulty: "Hard",
    badgeClass: "hard",
    timeLimit: 120,          // 2 minutes flat!
    zombieCount: 7,
    zombieDamage: 30,
    zombiePatrolSpeed: 1.50,
    zombieChaseSpeed: 2.70,
    noiseRadiusWalk: 140,
    noiseRadiusSprint: 460,
    flashlightBeamDist: 220,
    flashlightBeamAngle: 0.42,
    description: "Quarantine purge active! A swarm of mutated stalkers has overrun the sector. Escape or be erased!",
    nextSectorHint: ""
  }
];

const CONFIG = {
  // World dimensions
  WORLD_WIDTH: 1300,
  WORLD_HEIGHT: 900,
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 600,

  // Player Settings
  PLAYER_SPEED: 2.7,
  PLAYER_SPRINT_SPEED: 4.8,
  PLAYER_RADIUS: 14,
  MAX_HEALTH: 100,
  MAX_STAMINA: 100,
  STAMINA_DRAIN: 28,      // Stamina drain per second of sprint
  STAMINA_RECOVERY: 22,   // Stamina recovery per second
  INVULN_TIME: 0.8,       // Immunity seconds after getting hit

  // Base Noise Radii
  NOISE_RADIUS_IDLE: 45,

  // Zombie Settings
  ZOMBIE_RADIUS: 15,
  ZOMBIE_SIGHT_RANGE: 210,
};

// Preload Character Animated Sprite Frames
const playerSpriteImages = {
  idle: [],
  run: [],
  hit: [],
  hurt: []
};

function preloadPlayerSprites() {
  if (typeof PLAYER_FRAMES !== 'undefined') {
    for (const key in PLAYER_FRAMES) {
      playerSpriteImages[key] = PLAYER_FRAMES[key].map(b64 => {
        const img = new Image();
        img.src = b64;
        return img;
      });
    }
  }
}
preloadPlayerSprites();

/* ====================================================================
 * 1. WEB AUDIO SYNTHESIZER (Pure Code - No External Files Needed)
 * ==================================================================== */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playStep(isSprint = false) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSprint ? 120 : 80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(isSprint ? 0.15 : 0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {}
  }

  playBite() {
    if (this.muted || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();
    } catch (e) {}
  }

  playZombieAlert() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(65, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    } catch (e) {}
  }

  playPickupKeycard() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.22);
      });
    } catch (e) {}
  }

  playHeal() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [330, 440, 550].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.27);
      });
    } catch (e) {}
  }

  playLevelClear() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [350, 440, 523, 659].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0.22, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.32);
      });
    } catch (e) {}
  }

  playVictory() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [392, 523, 659, 784, 1046];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.18, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.38);
      });
    } catch (e) {}
  }

  playGameOver() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [200, 160, 120, 80];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.2);

        gain.gain.setValueAtTime(0.25, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.45);
      });
    } catch (e) {}
  }

  playHeartbeat() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (e) {}
  }
}

const audio = new SoundEngine();

// Robust Circle vs AABB Rect Collision Helper
function resolveCircleRect(entity, rect) {
  const closestX = Math.max(rect.x, Math.min(entity.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(entity.y, rect.y + rect.h));
  const distX = entity.x - closestX;
  const distY = entity.y - closestY;
  const distSq = distX * distX + distY * distY;

  if (distSq < entity.r * entity.r) {
    const dist = Math.sqrt(distSq);
    if (dist > 0.0001) {
      const overlap = entity.r - dist;
      entity.x += (distX / dist) * overlap;
      entity.y += (distY / dist) * overlap;
      return true;
    } else {
      entity.y -= entity.r;
      return true;
    }
  }
  return false;
}

/* ====================================================================
 * 2. MAP ARCHITECTURE & ROOMS (Atmospheric University Campus)
 * ==================================================================== */
class CampusMap {
  constructor(levelNum = 1) {
    this.walls = [];
    this.rooms = [];
    this.decorations = [];
    this.lights = [];
    this.levelNum = levelNum;
    this.setupCampus();
  }

  setupCampus() {
    const W = CONFIG.WORLD_WIDTH;
    const H = CONFIG.WORLD_HEIGHT;

    // Outer Boundary Walls
    this.addWall(0, 0, W, 25);
    this.addWall(0, H - 25, W, 25);
    this.addWall(0, 0, 25, H);
    this.addWall(W - 25, 0, 25, H);

    // Room Definitions
    this.rooms = [
      { name: "CLASSROOM 101 (Safe Zone)", x: 25, y: 25, w: 350, h: 280, color: "#141920" },
      { name: "RESEARCH LAB B (Infected)", x: 820, y: 25, w: 455, h: 320, color: "#101e18" },
      { name: "INFIRMARY / MEDICAL BAY", x: 25, y: 460, w: 350, h: 415, color: "#181a1d" },
      { name: "CAMPUS EMERGENCY EXIT", x: 850, y: 550, w: 425, h: 325, color: "#211516" },
      { name: "MAIN CORRIDORS", x: 375, y: 150, w: 445, h: 560, color: "#0c0f13" }
    ];

    // Classroom Walls & Furniture
    this.addWall(375, 25, 20, 105);
    this.addWall(375, 230, 20, 75);
    this.addWall(25, 305, 370, 20);

    this.addDecor({ type: "chalkboard", x: 60, y: 27, w: 200, h: 10, text: `SECTOR ${this.levelNum} - EVACUATE IMMEDIATELY` });
    this.addDecor({ type: "teacher_desk", x: 130, y: 70, w: 80, h: 35 });
    this.addObstacle(70, 140, 65, 30);
    this.addObstacle(170, 140, 65, 30);
    this.addObstacle(270, 140, 65, 30);
    this.addObstacle(70, 210, 65, 30);
    this.addObstacle(170, 210, 65, 30);
    this.addObstacle(270, 210, 65, 30);

    // Research Lab B Walls & Tables
    this.addWall(820, 25, 20, 105);
    this.addWall(820, 230, 20, 115);
    this.addWall(820, 345, 455, 20);

    this.addObstacle(880, 80, 150, 40);
    this.addObstacle(1070, 80, 140, 40);
    this.addObstacle(880, 180, 140, 40);
    this.addObstacle(1060, 180, 150, 40);
    this.addObstacle(940, 260, 180, 40);
    this.addDecor({ type: "biohazard_tank", x: 1200, y: 260, r: 24 });

    // Medical Bay Walls & Beds
    this.addWall(25, 460, 370, 20);
    this.addWall(375, 460, 20, 80);
    this.addWall(375, 640, 20, 235);

    this.addObstacle(60, 520, 45, 75);
    this.addObstacle(140, 520, 45, 75);
    this.addObstacle(60, 670, 45, 75);
    this.addObstacle(140, 670, 45, 75);
    this.addObstacle(270, 750, 85, 35);

    // Exit Gate Walls
    this.addWall(820, 550, 110, 20);
    this.addWall(1040, 550, 235, 20);
    this.addWall(820, 550, 20, 325);

    // Corridor Pillars
    this.addObstacle(560, 260, 40, 40);
    this.addObstacle(560, 420, 40, 40);
    this.addObstacle(560, 580, 40, 40);

    // Atmospheric Lights per level
    const lightMultiplier = this.levelNum === 1 ? 1.0 : (this.levelNum === 2 ? 0.75 : 0.55);
    this.lights = [
      { x: 200, y: 150, radius: 160 * lightMultiplier, color: "rgba(255, 230, 180, 0.15)", flicker: 0.05 },
      { x: 580, y: 180, radius: 140 * lightMultiplier, color: "rgba(255, 70, 70, 0.18)", flicker: 0.25 },
      { x: 580, y: 380, radius: 150 * lightMultiplier, color: "rgba(255, 200, 100, 0.14)", flicker: 0.12 },
      { x: 580, y: 640, radius: 150 * lightMultiplier, color: "rgba(255, 70, 70, 0.18)", flicker: 0.30 },
      { x: 1050, y: 160, radius: 180 * lightMultiplier, color: "rgba(100, 240, 180, 0.18)", flicker: 0.15 },
      { x: 200, y: 600, radius: 170 * lightMultiplier, color: "rgba(180, 230, 255, 0.15)", flicker: 0.08 },
      { x: 1050, y: 700, radius: 200 * lightMultiplier, color: "rgba(255, 100, 100, 0.20)", flicker: 0.15 }
    ];

    // Floor Blood & Hazard signs
    this.decorations.push(
      { type: "blood_stain", x: 395, y: 180, size: 28 },
      { type: "blood_trail", x: 480, y: 180, w: 280, h: 10 },
      { type: "blood_stain", x: 800, y: 180, size: 36 },
      { type: "blood_stain", x: 580, y: 480, size: 40 },
      { type: "hazard_sign", x: 830, y: 110 },
      { type: "exit_sign", x: 985, y: 535 }
    );
  }

  addWall(x, y, w, h) {
    this.walls.push({ x, y, w, h, isWall: true });
  }

  addObstacle(x, y, w, h) {
    this.walls.push({ x, y, w, h, isObstacle: true });
  }

  addDecor(decor) {
    this.decorations.push(decor);
  }

  draw(ctx) {
    // 1. Draw Room Floors
    for (const room of this.rooms) {
      ctx.fillStyle = room.color;
      ctx.fillRect(room.x, room.y, room.w, room.h);

      // Floor grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      const tileSize = 40;
      for (let tx = room.x; tx < room.x + room.w; tx += tileSize) {
        ctx.beginPath();
        ctx.moveTo(tx, room.y);
        ctx.lineTo(tx, room.y + room.h);
        ctx.stroke();
      }
      for (let ty = room.y; ty < room.y + room.h; ty += tileSize) {
        ctx.beginPath();
        ctx.moveTo(room.x, ty);
        ctx.lineTo(room.x + room.w, ty);
        ctx.stroke();
      }

      // Room Name Label
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.font = "bold 13px Consolas, monospace";
      ctx.fillText(room.name, room.x + 20, room.y + 35);
    }

    // 2. Draw Floor Blood & Hazards
    for (const d of this.decorations) {
      if (d.type === "blood_stain") {
        ctx.fillStyle = "rgba(140, 15, 25, 0.65)";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(d.x + 12, d.y - 8, d.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === "blood_trail") {
        ctx.fillStyle = "rgba(130, 15, 25, 0.45)";
        ctx.fillRect(d.x, d.y, d.w, d.h);
      } else if (d.type === "chalkboard") {
        ctx.fillStyle = "#1e3328";
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = "#8d6e63";
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, d.w, d.h);
        ctx.fillStyle = "#d4ebd0";
        ctx.font = "9px monospace";
        ctx.fillText(d.text, d.x + 10, d.y + 8);
      } else if (d.type === "biohazard_tank") {
        ctx.fillStyle = "#0f382c";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2ecc71";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#2ecc71";
        ctx.font = "14px sans-serif";
        ctx.fillText("☣", d.x - 7, d.y + 5);
      } else if (d.type === "exit_sign") {
        ctx.fillStyle = "#ff2233";
        ctx.fillRect(d.x - 45, d.y - 12, 90, 24);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.fillText("EXIT GATE", d.x - 33, d.y + 4);
      }
    }

    // 3. Draw Solid Walls & Obstacles
    for (const w of this.walls) {
      if (w.isObstacle) {
        ctx.fillStyle = "#222a36";
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = "#384556";
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      } else {
        ctx.fillStyle = "#1b212a";
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = "#3f4d62";
        ctx.lineWidth = 1;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      }
    }

    // 4. Draw Exit Gate Barrier
    const exitOpen = gameState.hasKeycard;
    ctx.fillStyle = exitOpen ? "#2ecc71" : "#c0392b";
    ctx.fillRect(930, 550, 110, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.fillText(exitOpen ? "[ UNLOCKED - ESCAPE! ]" : "[ LOCKED - SCANNER ]", 935, 563);

    // Evacuation Zone Markings
    ctx.fillStyle = "rgba(46, 204, 113, 0.08)";
    ctx.fillRect(920, 600, 200, 150);
    ctx.strokeStyle = "rgba(46, 204, 113, 0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(920, 600, 200, 150);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(46, 204, 113, 0.6)";
    ctx.font = "bold 14px monospace";
    ctx.fillText("EVACUATION ZONE", 955, 680);
  }
}

/* ====================================================================
 * 3. PLAYER ENTITY (Animated Pixel Sprite Character)
 * ==================================================================== */
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = CONFIG.PLAYER_RADIUS;
    this.health = CONFIG.MAX_HEALTH;
    this.stamina = CONFIG.MAX_STAMINA;
    this.angle = 0;
    this.invulnTimer = 0;
    this.isSprinting = false;
    this.noiseTimer = 0;
    this.stepTimer = 0;
    this.heartbeatTimer = 0;

    // Sprite Animation Properties
    this.animState = "idle"; // "idle", "run", "hurt"
    this.animFrame = 0;
    this.animTimer = 0;
    this.facingLeft = false;
  }

  update(dt, keys, mouse, map, currentLevelCfg) {
    // 1. Invulnerability countdown
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
    }

    // 2. Sprinting & Stamina Logic
    const shiftPressed = keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight'];
    const hasMovement = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
                        keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'];

    if (shiftPressed && hasMovement && this.stamina > 5) {
      this.isSprinting = true;
      this.stamina = Math.max(0, this.stamina - CONFIG.STAMINA_DRAIN * dt);
    } else {
      this.isSprinting = false;
      this.stamina = Math.min(CONFIG.MAX_STAMINA, this.stamina + CONFIG.STAMINA_RECOVERY * dt);
    }

    // 3. Movement with Sliding Wall Collision Resolution
    let speed = this.isSprinting ? CONFIG.PLAYER_SPRINT_SPEED : CONFIG.PLAYER_SPEED;
    let dx = 0;
    let dy = 0;

    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    // Move horizontally
    if (dx !== 0) {
      this.x += dx * speed;
      this.resolveWallCollisions(map);
    }

    // Move vertically
    if (dy !== 0) {
      this.y += dy * speed;
      this.resolveWallCollisions(map);
    }

    // Boundary clamping
    this.x = Math.max(this.r + 25, Math.min(CONFIG.WORLD_WIDTH - this.r - 25, this.x));
    this.y = Math.max(this.r + 25, Math.min(CONFIG.WORLD_HEIGHT - this.r - 25, this.y));

    // 4. Update Rotation towards Mouse & Facing Direction
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

    if (worldMouseX < this.x - 4) {
      this.facingLeft = true;
    } else if (worldMouseX > this.x + 4) {
      this.facingLeft = false;
    }

    // 5. Update Sprite Animation Frames
    if (this.invulnTimer > 0) {
      this.animState = "hurt";
      this.animTimer += dt;
      if (this.animTimer >= 0.12) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else if (hasMovement) {
      this.animState = "run";
      this.animTimer += dt;
      const frameSpeed = this.isSprinting ? 0.07 : 0.11;
      if (this.animTimer >= frameSpeed) {
        this.animFrame = (this.animFrame + 1) % 6;
        this.animTimer = 0;
      }
    } else {
      this.animState = "idle";
      this.animTimer += dt;
      if (this.animTimer >= 0.18) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    }

    // 6. Sound & Noise generation
    let currentNoiseRadius = CONFIG.NOISE_RADIUS_IDLE;
    if (hasMovement) {
      if (this.isSprinting) {
        currentNoiseRadius = currentLevelCfg.noiseRadiusSprint;
        this.stepTimer += dt;
        if (this.stepTimer >= 0.22) {
          audio.playStep(true);
          this.stepTimer = 0;
        }

        // Emit visible sound ripple rings
        this.noiseTimer += dt;
        if (this.noiseTimer >= 0.25) {
          gameState.soundRipples.push({
            x: this.x,
            y: this.y,
            currentRadius: 10,
            maxRadius: currentLevelCfg.noiseRadiusSprint,
            alpha: 0.6
          });
          this.noiseTimer = 0;
        }
      } else {
        currentNoiseRadius = currentLevelCfg.noiseRadiusWalk;
        this.stepTimer += dt;
        if (this.stepTimer >= 0.38) {
          audio.playStep(false);
          this.stepTimer = 0;
        }
      }
    }
    gameState.currentNoiseRadius = currentNoiseRadius;

    // 7. Low Health Heartbeat
    if (this.health <= 35 && this.health > 0) {
      this.heartbeatTimer += dt;
      if (this.heartbeatTimer >= 0.8) {
        audio.playHeartbeat();
        this.heartbeatTimer = 0;
      }
    }
  }

  resolveWallCollisions(map) {
    for (const wall of map.walls) {
      resolveCircleRect(this, wall);
    }
    if (!gameState.hasKeycard) {
      if (resolveCircleRect(this, { x: 930, y: 550, w: 110, h: 20 })) {
        showBanner("LOCKED! LAB SECURITY KEYCARD REQUIRED", "urgent");
      }
    }
  }

  takeDamage(amount) {
    if (this.invulnTimer > 0) return;
    this.health = Math.max(0, this.health - amount);
    this.invulnTimer = CONFIG.INVULN_TIME;
    audio.playBite();

    const damageOverlay = document.getElementById('damage-overlay');
    damageOverlay.classList.add('damaged');
    setTimeout(() => damageOverlay.classList.remove('damaged'), 180);

    for (let i = 0; i < 8; i++) {
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: "#c0392b",
        radius: Math.random() * 3 + 2,
        life: 0.5
      });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Invulnerability flashing effect
    if (this.invulnTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Directional shadow on floor
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Check if character sprite frames are loaded
    const frames = playerSpriteImages[this.animState] || playerSpriteImages.idle;
    if (frames && frames.length > 0) {
      const curImg = frames[this.animFrame % frames.length];
      if (curImg && curImg.complete && curImg.naturalWidth > 0) {
        ctx.save();
        if (this.facingLeft) {
          ctx.scale(-1, 1);
        }
        // Draw character sprite (height ~46px, width scaled proportionally)
        const drawH = 46;
        const drawW = (curImg.width / curImg.height) * drawH;
        ctx.drawImage(curImg, -drawW / 2, -drawH / 2 - 4, drawW, drawH);
        ctx.restore();
      } else {
        this.drawProcedural(ctx);
      }
    } else {
      this.drawProcedural(ctx);
    }

    ctx.restore();
  }

  drawProcedural(ctx) {
    ctx.save();
    ctx.rotate(this.angle);
    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2980b9";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#f39c12";
    ctx.fillRect(this.r - 2, -4, 8, 8);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(6, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ====================================================================
 * 4. ZOMBIE ENEMY (FSM: Patrol, Alert/Investigate, Chase)
 * ==================================================================== */
class Zombie {
  constructor(waypoints, label = "Zombie", damage = 20, patrolSpeed = 1.25, chaseSpeed = 2.2) {
    this.waypoints = waypoints;
    this.currentWpIndex = 0;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.r = CONFIG.ZOMBIE_RADIUS;
    this.patrolSpeed = patrolSpeed;
    this.chaseSpeed = chaseSpeed;
    this.speed = patrolSpeed;
    this.damage = damage;
    this.state = "PATROL";
    this.targetPos = { x: this.x, y: this.y };
    this.alertTimer = 0;
    this.lostTimer = 0;
    this.angle = 0;
    this.label = label;
  }

  update(dt, player, map) {
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    // 1. Noise check
    if (distToPlayer <= gameState.currentNoiseRadius) {
      if (this.state !== "CHASE") {
        if (this.state !== "INVESTIGATE") {
          audio.playZombieAlert();
          showBanner("A ZOMBIE HEARD YOUR FOOTSTEPS!", "urgent");
        }
        this.state = "INVESTIGATE";
        this.targetPos = { x: player.x, y: player.y };
        this.alertTimer = 4.0;
      }
    }

    // 2. Line of sight check
    if (distToPlayer < CONFIG.ZOMBIE_SIGHT_RANGE) {
      if (this.state !== "CHASE") {
        audio.playZombieAlert();
      }
      this.state = "CHASE";
      this.lostTimer = 0;
    }

    // 3. FSM Update
    if (this.state === "CHASE") {
      this.speed = this.chaseSpeed;
      this.targetPos = { x: player.x, y: player.y };

      if (distToPlayer > CONFIG.ZOMBIE_SIGHT_RANGE * 1.6) {
        this.lostTimer += dt;
        if (this.lostTimer > 2.0) {
          this.state = "INVESTIGATE";
          this.alertTimer = 3.0;
        }
      }
    } else if (this.state === "INVESTIGATE") {
      this.speed = this.patrolSpeed * 1.3;
      this.alertTimer -= dt;
      if (this.alertTimer <= 0 || Math.hypot(this.targetPos.x - this.x, this.targetPos.y - this.y) < 20) {
        this.state = "PATROL";
      }
    } else {
      this.speed = this.patrolSpeed;
      const targetWp = this.waypoints[this.currentWpIndex];
      this.targetPos = targetWp;

      if (Math.hypot(targetWp.x - this.x, targetWp.y - this.y) < 25) {
        this.currentWpIndex = (this.currentWpIndex + 1) % this.waypoints.length;
      }
    }

    // 4. Movement
    const toTargetX = this.targetPos.x - this.x;
    const toTargetY = this.targetPos.y - this.y;
    const distToTarget = Math.hypot(toTargetX, toTargetY);

    if (distToTarget > 4) {
      this.angle = Math.atan2(toTargetY, toTargetX);
      const moveX = (toTargetX / distToTarget) * this.speed;
      const moveY = (toTargetY / distToTarget) * this.speed;

      this.x += moveX;
      this.resolveWallCollisions(map);
      this.y += moveY;
      this.resolveWallCollisions(map);
    }

    // 5. Contact Damage
    if (distToPlayer < this.r + player.r) {
      player.takeDamage(this.damage);
    }
  }

  resolveWallCollisions(map) {
    for (const wall of map.walls) {
      resolveCircleRect(this, wall);
    }
    if (!gameState.hasKeycard) {
      resolveCircleRect(this, { x: 930, y: 550, w: 110, h: 20 });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = "#27ae60";
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#196f3d";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#1e8449";
    ctx.fillRect(this.r - 2, -10, 10, 4);
    ctx.fillRect(this.r - 2, 6, 10, 4);

    ctx.fillStyle = this.state === "CHASE" ? "#ff0033" : "#f1c40f";
    ctx.beginPath();
    ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(6, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (this.state === "CHASE") {
      ctx.fillStyle = "#ff2233";
      ctx.font = "bold 18px monospace";
      ctx.fillText("!", this.x - 4, this.y - 20);
    } else if (this.state === "INVESTIGATE") {
      ctx.fillStyle = "#f39c12";
      ctx.font = "bold 16px monospace";
      ctx.fillText("?", this.x - 4, this.y - 20);
    }
  }
}

/* ====================================================================
 * 5. COLLECTIBLES & ITEMS
 * ==================================================================== */
class Item {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.r = 16;
    this.collected = false;
    this.bobAngle = 0;
  }

  update(dt, player) {
    if (this.collected) return;
    this.bobAngle += dt * 4;

    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < this.r + player.r) {
      this.collected = true;
      if (this.type === "keycard") {
        gameState.hasKeycard = true;
        audio.playPickupKeycard();
        showBanner("LAB SECURITY KEYCARD ACQUIRED! PROCEED TO EXIT!", "success");
        updateObjectivesUI();
      } else if (this.type === "health") {
        player.health = Math.min(CONFIG.MAX_HEALTH, player.health + 45);
        audio.playHeal();
        showBanner("FIRST AID KIT USED! +45 HEALTH", "success");
      }
    }
  }

  draw(ctx) {
    if (this.collected) return;
    const bobOffset = Math.sin(this.bobAngle) * 3;

    ctx.save();
    ctx.translate(this.x, this.y + bobOffset);

    if (this.type === "keycard") {
      ctx.fillStyle = "#00d2ff";
      ctx.shadowColor = "#00d2ff";
      ctx.shadowBlur = 12;
      ctx.fillRect(-10, -7, 20, 14);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-6, -3, 6, 6);
      ctx.fillStyle = "#09131d";
      ctx.font = "bold 7px monospace";
      ctx.fillText("ID", 2, 3);
    } else if (this.type === "health") {
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#2ecc71";
      ctx.shadowBlur = 10;
      ctx.fillRect(-11, -11, 22, 22);

      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(-3, -8, 6, 16);
      ctx.fillRect(-8, -3, 16, 6);
    }

    ctx.restore();
  }
}

/* ====================================================================
 * 6. GLOBAL GAME STATE & CONTROLS
 * ==================================================================== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const darkCanvas = document.createElement('canvas');
darkCanvas.width = CONFIG.CANVAS_WIDTH;
darkCanvas.height = CONFIG.CANVAS_HEIGHT;
const darkCtx = darkCanvas.getContext('2d');

const camera = { x: 0, y: 0 };
const keys = {};
const mouse = { x: CONFIG.CANVAS_WIDTH / 2, y: CONFIG.CANVAS_HEIGHT / 2 };

let gameState = {
  mode: "START", // "START", "PLAYING", "LEVEL_COMPLETE", "GAMEOVER", "WIN"
  currentLevel: 1,
  totalTimeElapsed: 0,
  timeRemaining: 200,
  hasKeycard: false,
  escapedClassroom: false,
  zombiesEvaded: 0,
  currentNoiseRadius: CONFIG.NOISE_RADIUS_IDLE,
  soundRipples: [],
  particles: [],
};

let map = new CampusMap(1);
let player = new Player(120, 160);
let zombies = [];
let items = [];
let bannerTimeout = null;

function getCurrentLevelConfig() {
  return LEVEL_CONFIGS[gameState.currentLevel - 1] || LEVEL_CONFIGS[0];
}

// Spawn Zombies and Items based on Level
function setupLevelEntities(lvl) {
  const cfg = LEVEL_CONFIGS[lvl - 1];

  if (lvl === 1) {
    // Level 1: 3 Zombies, 2 Medkits
    zombies = [
      new Zombie([{ x: 450, y: 180 }, { x: 760, y: 180 }], "Corridor Guard", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 920, y: 140 }, { x: 1140, y: 140 }, { x: 1140, y: 260 }, { x: 920, y: 260 }], "Infected Scientist", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 580, y: 260 }, { x: 580, y: 560 }], "Hallway Stalker", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed)
    ];
    items = [
      new Item("keycard", 1120, 180),
      new Item("health", 180, 720),
      new Item("health", 80, 80)
    ];
  } else if (lvl === 2) {
    // Level 2: 5 Zombies, 1 Medkit
    zombies = [
      new Zombie([{ x: 420, y: 180 }, { x: 780, y: 180 }], "Corridor Guard", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 900, y: 100 }, { x: 1160, y: 100 }, { x: 1160, y: 280 }], "Infected Chemist", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 580, y: 220 }, { x: 580, y: 580 }], "Hallway Stalker", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 680, y: 640 }, { x: 880, y: 640 }], "Exit Checkpoint Guard", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 200, y: 520 }, { x: 300, y: 640 }], "Infirmary Infected", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed)
    ];
    items = [
      new Item("keycard", 1160, 260),
      new Item("health", 180, 720)
    ];
  } else {
    // Level 3: 7 Zombies (Lethal Horde), 1 Medkit
    zombies = [
      new Zombie([{ x: 420, y: 180 }, { x: 780, y: 180 }], "Corridor Sprinter", cfg.zombieDamage, cfg.zombiePatrolSpeed * 1.15, cfg.zombieChaseSpeed),
      new Zombie([{ x: 920, y: 120 }, { x: 1180, y: 120 }], "Mutant Scientist", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 940, y: 260 }, { x: 1180, y: 260 }], "Lab Berserker", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 580, y: 200 }, { x: 580, y: 440 }], "Main Hall Prowler", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 580, y: 460 }, { x: 580, y: 680 }], "South Hall Hunter", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 720, y: 640 }, { x: 920, y: 640 }], "Exit Gate Sentinel", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed),
      new Zombie([{ x: 180, y: 560 }, { x: 320, y: 720 }], "Morgue Specimen", cfg.zombieDamage, cfg.zombiePatrolSpeed, cfg.zombieChaseSpeed)
    ];
    items = [
      new Item("keycard", 1210, 110),
      new Item("health", 580, 380)
    ];
  }
}

// Start Level / Campaign
function startLevel(lvl, keepHealth = false) {
  gameState.currentLevel = lvl;
  const cfg = getCurrentLevelConfig();

  gameState.timeRemaining = cfg.timeLimit;
  gameState.hasKeycard = false;
  gameState.escapedClassroom = false;
  gameState.soundRipples = [];
  gameState.particles = [];

  map = new CampusMap(lvl);
  const oldHealth = player ? player.health : CONFIG.MAX_HEALTH;
  player = new Player(120, 160);
  if (keepHealth && oldHealth > 0) {
    player.health = Math.min(CONFIG.MAX_HEALTH, oldHealth + 20); // Small bonus for clearing level
  }

  setupLevelEntities(lvl);
  gameState.mode = "PLAYING";
  hideModals();
  updateObjectivesUI();
  updateHUD(0);
  showBanner(`${cfg.title} - ${cfg.description}`, "urgent");
}

function initGame(startGameplay = true) {
  gameState.currentLevel = 1;
  gameState.totalTimeElapsed = 0;
  const cfg = getCurrentLevelConfig();

  gameState.timeRemaining = cfg.timeLimit;
  gameState.hasKeycard = false;
  gameState.escapedClassroom = false;
  gameState.zombiesEvaded = 0;
  gameState.soundRipples = [];
  gameState.particles = [];

  map = new CampusMap(1);
  player = new Player(120, 160);
  setupLevelEntities(1);

  if (startGameplay) {
    gameState.mode = "PLAYING";
    hideModals();
    showBanner(`${cfg.title} - ${cfg.description}`, "normal");
  } else {
    gameState.mode = "START";
  }

  updateObjectivesUI();
  updateHUD(0);
}

/* ====================================================================
 * 7. USER INTERFACE & NOTIFICATIONS
 * ==================================================================== */
function showBanner(message, type = "normal") {
  const banner = document.getElementById('banner');
  banner.textContent = message;
  banner.className = `banner-active ${type}`;

  if (bannerTimeout) clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => {
    banner.className = "hidden";
  }, 3400);
}

function updateObjectivesUI() {
  const objClassroom = document.getElementById('obj-classroom');
  const objKeycard = document.getElementById('obj-keycard');
  const objExit = document.getElementById('obj-exit');
  const slotKeycard = document.getElementById('slot-keycard');

  if (gameState.escapedClassroom) {
    objClassroom.className = "completed";
  } else {
    objClassroom.className = "active";
  }

  if (gameState.hasKeycard) {
    objKeycard.className = "completed";
    objExit.className = "active";
    slotKeycard.classList.add('acquired');
  } else {
    if (gameState.escapedClassroom) {
      objKeycard.className = "active";
    }
    slotKeycard.classList.remove('acquired');
  }
}

function updateHUD(dt) {
  const cfg = getCurrentLevelConfig();

  // Level Badge
  const levelBadge = document.getElementById('level-badge');
  if (levelBadge) {
    levelBadge.textContent = `${cfg.title} (${cfg.difficulty.toUpperCase()})`;
    levelBadge.className = `level-badge ${cfg.badgeClass}`;
  }

  // Health Bar
  const healthPercent = Math.max(0, (player.health / CONFIG.MAX_HEALTH) * 100);
  document.getElementById('health-bar').style.width = healthPercent + "%";
  document.getElementById('health-text').textContent = Math.ceil(player.health) + "%";

  // Stamina Bar
  const staminaPercent = Math.max(0, (player.stamina / CONFIG.MAX_STAMINA) * 100);
  document.getElementById('stamina-bar').style.width = staminaPercent + "%";
  document.getElementById('stamina-text').textContent = Math.ceil(player.stamina) + "%";

  // Noise Meter
  const noiseMeter = document.getElementById('noise-meter');
  const noiseText = document.getElementById('noise-level-text');

  if (gameState.currentNoiseRadius >= cfg.noiseRadiusSprint) {
    noiseMeter.style.setProperty('--noise-width', '100%');
    noiseMeter.style.setProperty('--noise-color', '#ff3344');
    noiseText.textContent = "LOUD!";
    noiseText.style.color = "#ff3344";
  } else if (gameState.currentNoiseRadius >= cfg.noiseRadiusWalk) {
    noiseMeter.style.setProperty('--noise-width', '45%');
    noiseMeter.style.setProperty('--noise-color', '#f1c40f');
    noiseText.textContent = "WALK";
    noiseText.style.color = "#f1c40f";
  } else {
    noiseMeter.style.setProperty('--noise-width', '12%');
    noiseMeter.style.setProperty('--noise-color', '#2ecc71');
    noiseText.textContent = "QUIET";
    noiseText.style.color = "#2ecc71";
  }

  // Countdown Timer
  const timerDisplay = document.getElementById('timer-display');
  const mins = Math.floor(Math.max(0, gameState.timeRemaining) / 60);
  const secs = Math.floor(Math.max(0, gameState.timeRemaining) % 60);
  timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (gameState.timeRemaining < 40) {
    timerDisplay.classList.add('panic');
  } else {
    timerDisplay.classList.remove('panic');
  }
}

function triggerLevelComplete() {
  gameState.mode = "LEVEL_COMPLETE";
  audio.playLevelClear();

  const cfg = getCurrentLevelConfig();
  const nextCfg = LEVEL_CONFIGS[gameState.currentLevel];

  document.getElementById('stat-level-num').textContent = `Level ${cfg.level} (${cfg.difficulty})`;
  document.getElementById('stat-next-level').textContent = `${nextCfg.title} (${nextCfg.difficulty})`;
  document.getElementById('stat-level-health').textContent = `${Math.ceil(player.health)}%`;
  document.getElementById('level-next-hint').textContent = cfg.nextSectorHint;

  document.getElementById('screen-start').classList.add('hidden');
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('screen-win').classList.add('hidden');
  document.getElementById('screen-level-complete').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.add('modal-active');
}

function triggerGameOver(cause) {
  gameState.mode = "GAMEOVER";
  audio.playGameOver();

  document.getElementById('gameover-cause').textContent = cause;
  const cfg = getCurrentLevelConfig();
  const timeSpent = cfg.timeLimit - gameState.timeRemaining;
  const mins = Math.floor(timeSpent / 60);
  const secs = Math.floor(timeSpent % 60);
  document.getElementById('stat-time-survived').textContent = `${mins}m ${secs}s (on Level ${gameState.currentLevel})`;
  document.getElementById('stat-keycard-found').textContent = gameState.hasKeycard ? "Yes" : "No";
  document.getElementById('stat-zombies-evaded').textContent = zombies.filter(z => z.state === "CHASE").length;

  document.getElementById('screen-start').classList.add('hidden');
  document.getElementById('screen-win').classList.add('hidden');
  document.getElementById('screen-level-complete').classList.add('hidden');
  document.getElementById('screen-gameover').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.add('modal-active');
}

function triggerVictory() {
  gameState.mode = "WIN";
  audio.playVictory();

  const totalSecs = Math.floor(gameState.totalTimeElapsed);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  document.getElementById('stat-win-time').textContent = `${mins}m ${secs}s`;
  document.getElementById('stat-win-health').textContent = `${Math.ceil(player.health)}%`;

  let rating = "S - INFILTRATION MASTER";
  if (player.health < 40) rating = "A - SURVIVOR";
  document.getElementById('stat-win-rating').textContent = rating;

  document.getElementById('screen-start').classList.add('hidden');
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('screen-level-complete').classList.add('hidden');
  document.getElementById('screen-win').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.add('modal-active');
}

function hideModals() {
  document.getElementById('modal-overlay').classList.remove('modal-active');
  document.getElementById('screen-start').classList.add('hidden');
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('screen-level-complete').classList.add('hidden');
  document.getElementById('screen-win').classList.add('hidden');
}

/* ====================================================================
 * 8. RENDERING & DARK ATMOSPHERIC LIGHTING
 * ==================================================================== */
function renderLighting() {
  const cfg = getCurrentLevelConfig();

  darkCtx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  // Pitch darkness level increases on higher difficulties
  const darknessAlpha = gameState.currentLevel === 1 ? "rgba(4, 6, 10, 0.92)" : (gameState.currentLevel === 2 ? "rgba(3, 4, 8, 0.95)" : "rgba(2, 3, 6, 0.97)");
  darkCtx.fillStyle = darknessAlpha;
  darkCtx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  darkCtx.globalCompositeOperation = 'destination-out';

  const screenPlayerX = player.x - camera.x;
  const screenPlayerY = player.y - camera.y;

  // Personal radial light glow
  const personalLight = darkCtx.createRadialGradient(
    screenPlayerX, screenPlayerY, 10,
    screenPlayerX, screenPlayerY, 80
  );
  personalLight.addColorStop(0, "rgba(0, 0, 0, 1)");
  personalLight.addColorStop(1, "rgba(0, 0, 0, 0)");
  darkCtx.fillStyle = personalLight;
  darkCtx.beginPath();
  darkCtx.arc(screenPlayerX, screenPlayerY, 80, 0, Math.PI * 2);
  darkCtx.fill();

  // Directional Flashlight Beam Cone
  const beamDist = cfg.flashlightBeamDist;
  const beamAngle = cfg.flashlightBeamAngle;
  const startAngle = player.angle - beamAngle / 2;
  const endAngle = player.angle + beamAngle / 2;

  const flashGrad = darkCtx.createRadialGradient(
    screenPlayerX, screenPlayerY, 20,
    screenPlayerX, screenPlayerY, beamDist
  );
  flashGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
  flashGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.7)");
  flashGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  darkCtx.fillStyle = flashGrad;
  darkCtx.beginPath();
  darkCtx.moveTo(screenPlayerX, screenPlayerY);
  darkCtx.arc(screenPlayerX, screenPlayerY, beamDist, startAngle, endAngle);
  darkCtx.closePath();
  darkCtx.fill();

  // Campus Emergency Lamps
  for (const lamp of map.lights) {
    const lampScreenX = lamp.x - camera.x;
    const lampScreenY = lamp.y - camera.y;

    if (lampScreenX >= -lamp.radius && lampScreenX <= CONFIG.CANVAS_WIDTH + lamp.radius &&
        lampScreenY >= -lamp.radius && lampScreenY <= CONFIG.CANVAS_HEIGHT + lamp.radius) {
      
      const flickerFactor = 1 - (Math.random() < lamp.flicker ? 0.35 : 0);
      const lampGrad = darkCtx.createRadialGradient(
        lampScreenX, lampScreenY, 5,
        lampScreenX, lampScreenY, lamp.radius * flickerFactor
      );
      lampGrad.addColorStop(0, "rgba(0, 0, 0, 0.85)");
      lampGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      darkCtx.fillStyle = lampGrad;
      darkCtx.beginPath();
      darkCtx.arc(lampScreenX, lampScreenY, lamp.radius * flickerFactor, 0, Math.PI * 2);
      darkCtx.fill();
    }
  }

  // Glowing Items
  for (const item of items) {
    if (!item.collected) {
      const isx = item.x - camera.x;
      const isy = item.y - camera.y;
      const itemLight = darkCtx.createRadialGradient(isx, isy, 5, isx, isy, 50);
      itemLight.addColorStop(0, "rgba(0, 0, 0, 0.7)");
      itemLight.addColorStop(1, "rgba(0, 0, 0, 0)");
      darkCtx.fillStyle = itemLight;
      darkCtx.beginPath();
      darkCtx.arc(isx, isy, 50, 0, Math.PI * 2);
      darkCtx.fill();
    }
  }

  darkCtx.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkCanvas, 0, 0);
}

/* ====================================================================
 * 9. MAIN GAME LOOP
 * ==================================================================== */
let lastTime = performance.now();

function gameLoop(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  if (gameState.mode === "PLAYING") {
    gameState.totalTimeElapsed += dt;
    gameState.timeRemaining -= dt;

    if (gameState.timeRemaining <= 0) {
      triggerGameOver("Quarantine decontamination purge initiated. No survivors.");
    }

    if (player.health <= 0) {
      triggerGameOver("Overrun and mauled by the infected.");
    }

    const cfg = getCurrentLevelConfig();
    player.update(dt, keys, mouse, map, cfg);

    if (!gameState.escapedClassroom && player.x > 380) {
      gameState.escapedClassroom = true;
      showBanner("EXITED CLASSROOM! SEARCH LAB B FOR SECURITY KEYCARD");
      updateObjectivesUI();
    }

    for (const zombie of zombies) {
      zombie.update(dt, player, map);
    }

    for (const item of items) {
      item.update(dt, player);
    }

    // Check Victory / Sector Cleared Condition
    if (gameState.hasKeycard && player.x >= 860 && player.y >= 570) {
      if (gameState.currentLevel < 3) {
        triggerLevelComplete();
      } else {
        triggerVictory();
      }
    }

    // Sound Ripples
    for (let i = gameState.soundRipples.length - 1; i >= 0; i--) {
      const rip = gameState.soundRipples[i];
      rip.currentRadius += 280 * dt;
      rip.alpha -= 1.2 * dt;
      if (rip.alpha <= 0 || rip.currentRadius >= rip.maxRadius) {
        gameState.soundRipples.splice(i, 1);
      }
    }

    // Blood Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const p = gameState.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) {
        gameState.particles.splice(i, 1);
      }
    }

    // Smooth Camera Follow
    camera.x = Math.max(0, Math.min(CONFIG.WORLD_WIDTH - CONFIG.CANVAS_WIDTH, player.x - CONFIG.CANVAS_WIDTH / 2));
    camera.y = Math.max(0, Math.min(CONFIG.WORLD_HEIGHT - CONFIG.CANVAS_HEIGHT, player.y - CONFIG.CANVAS_HEIGHT / 2));

    updateHUD(dt);
  }

  // Render Pass
  ctx.save();
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  ctx.translate(-camera.x, -camera.y);

  if (map) {
    map.draw(ctx);
  }

  for (const item of items) {
    item.draw(ctx);
  }

  for (const rip of gameState.soundRipples) {
    ctx.strokeStyle = `rgba(231, 76, 60, ${rip.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rip.x, rip.y, rip.currentRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const p of gameState.particles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (player) {
    player.draw(ctx);
  }

  for (const zombie of zombies) {
    zombie.draw(ctx);
  }

  ctx.restore();

  // Lighting & Darkness Pass
  if (gameState.mode === "PLAYING") {
    renderLighting();
  }

  requestAnimationFrame(gameLoop);
}

/* ====================================================================
 * 10. INPUT LISTENERS & BUTTON HOOKS
 * ==================================================================== */
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  // Space / Enter starts game from Start Screen
  if ((e.code === 'Space' || e.code === 'Enter') && gameState.mode === 'START') {
    audio.init();
    initGame(true);
  }

  // Space / Enter advances to next level from Level Complete screen
  if ((e.code === 'Space' || e.code === 'Enter') && gameState.mode === 'LEVEL_COMPLETE') {
    audio.init();
    startLevel(gameState.currentLevel + 1, true);
  }

  // 'R' restarts campaign from Game Over or Campaign Win
  if (e.code === 'KeyR' && (gameState.mode === 'GAMEOVER' || gameState.mode === 'WIN')) {
    audio.init();
    initGame(true);
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mouse.x = (e.clientX - rect.left) * scaleX;
  mouse.y = (e.clientY - rect.top) * scaleY;
});

// Start button on title screen
document.getElementById('btn-start').addEventListener('click', () => {
  audio.init();
  initGame(true);
});

// Next level button on Level Complete screen
const btnNextLevel = document.getElementById('btn-next-level');
if (btnNextLevel) {
  btnNextLevel.addEventListener('click', () => {
    audio.init();
    startLevel(gameState.currentLevel + 1, true);
  });
}

// Retry button on Game Over screen
document.getElementById('btn-retry').addEventListener('click', () => {
  audio.init();
  initGame(true);
});

// Play Again button on Win screen
document.getElementById('btn-play-again').addEventListener('click', () => {
  audio.init();
  initGame(true);
});

// Quick Restart Button in footer
document.getElementById('btn-restart-quick').addEventListener('click', () => {
  audio.init();
  initGame(true);
});

// Audio Toggle Button
const btnAudio = document.getElementById('btn-audio');
btnAudio.addEventListener('click', () => {
  audio.init();
  const isMuted = audio.toggleMute();
  btnAudio.textContent = isMuted ? "🔇 MUTED" : "🔊 AUDIO";
});

// Setup Initial State & Start Loop
initGame(false);
requestAnimationFrame(gameLoop);
