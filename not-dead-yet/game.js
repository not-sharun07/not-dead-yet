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
    timeLimit: 220,          // 3 minutes 40s (Forgiving & exploration friendly)
    zombieCount: 3,
    zombieDamage: 12,        // Low bite damage
    zombiePatrolSpeed: 1.0,
    zombieChaseSpeed: 1.70,  // Slower than player walk, easy to outrun!
    noiseRadiusWalk: 90,
    noiseRadiusSprint: 240,
    flashlightBeamDist: 340, // Wide bright beam
    flashlightBeamAngle: 0.55,
    description: "Initial containment breach. 3 slow wandering infected. Evacuate Classroom 101, locate the Lab Keycard, and reach the exit.",
    nextSectorHint: "Power grid failure detected in Sector 2! Expect blackout conditions and faster stalkers."
  },
  {
    level: 2,
    title: "LEVEL 2: THE BLACKOUT",
    difficulty: "Medium",
    badgeClass: "medium",
    timeLimit: 160,          // 2 minutes 40s (Medium pressure)
    zombieCount: 5,
    zombieDamage: 22,
    zombiePatrolSpeed: 1.35,
    zombieChaseSpeed: 2.35,  // Fast stalkers! Faster than walk (requires sprint management)
    noiseRadiusWalk: 120,
    noiseRadiusSprint: 360,  // Stalkers hear footsteps through walls
    flashlightBeamDist: 260, // Narrow amber beam
    flashlightBeamAngle: 0.46,
    description: "Generators offline. Auxiliary amber alarms only. 5 aggressive stalkers roaming the server corridors. Conserve stamina!",
    nextSectorHint: "QUARANTINE PURGE PROTOCOL ACTIVE! 7 mutated berserkers on high alert in Sector 3."
  },
  {
    level: 3,
    title: "LEVEL 3: QUARANTINE PURGE",
    difficulty: "Hard",
    badgeClass: "hard",
    timeLimit: 100,          // 1 minute 40s (Pure adrenaline panic!)
    zombieCount: 7,
    zombieDamage: 32,        // Lethal! 3 bites and you're dead
    zombiePatrolSpeed: 1.60,
    zombieChaseSpeed: 2.75,  // Near player sprint speed!
    noiseRadiusWalk: 140,
    noiseRadiusSprint: 460,  // Sprinting alerts the entire facility
    flashlightBeamDist: 210, // Short claustrophobic beam
    flashlightBeamAngle: 0.40,
    description: "Quarantine decontamination purge active! 7 mutated berserkers hunting under flashing red sirens. Escape before purge!",
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

// Preload Campus Environment Textures from uploaded photos
const envTextures = {
  floorPattern: null,
  floorImg: null,
  deskImg: null,
  doorImg: null
};

function initEnvTextures() {
  if (typeof ENV_ASSETS !== 'undefined') {
    if (ENV_ASSETS.floorTile) {
      envTextures.floorImg = new Image();
      envTextures.floorImg.src = ENV_ASSETS.floorTile;
      envTextures.floorImg.onload = () => {
        // Create seamless repeating canvas pattern
        envTextures.floorPattern = ctx.createPattern(envTextures.floorImg, 'repeat');
      };
    }
    if (ENV_ASSETS.deskTop) {
      envTextures.deskImg = new Image();
      envTextures.deskImg.src = ENV_ASSETS.deskTop;
    }
    if (ENV_ASSETS.doorTexture) {
      envTextures.doorImg = new Image();
      envTextures.doorImg.src = ENV_ASSETS.doorTexture;
    }
  }
}
initEnvTextures();

/* ====================================================================
 * 1. WEB AUDIO SYNTHESIZER (Pure Code - No External Files Needed)
 * ==================================================================== */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.volume = 0.8;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.muted;
  }

  getDestination() {
    return this.masterGain || (this.ctx ? this.ctx.destination : null);
  }

  playMenuHover() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playMenuSelect() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 880].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.12);

        osc.connect(gain);
        gain.connect(this.getDestination());
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.14);
      });
    } catch (e) {}
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
      gain.connect(this.getDestination());
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
      gain.connect(this.getDestination());
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
      gain.connect(this.getDestination());
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
        gain.connect(this.getDestination());
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
        gain.connect(this.getDestination());
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
        gain.connect(this.getDestination());
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
        gain.connect(this.getDestination());
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
        gain.connect(this.getDestination());
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
      gain.connect(this.getDestination());
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

    // Outer Boundary Walls (Consistent across all sectors)
    this.addWall(0, 0, W, 25);
    this.addWall(0, H - 25, W, 25);
    this.addWall(0, 0, 25, H);
    this.addWall(W - 25, 0, 25, H);

    if (this.levelNum === 1) {
      this.setupLevel1();
    } else if (this.levelNum === 2) {
      this.setupLevel2();
    } else {
      this.setupLevel3();
    }
  }

  /* ------------------------------------------------------------------
   * LEVEL 1 (EASY): Classroom Outbreak - Open lecture hall & wide halls
   * ------------------------------------------------------------------ */
  setupLevel1() {
    this.rooms = [
      { name: "CLASSROOM 101 (Safe Zone)", x: 25, y: 25, w: 350, h: 280, color: "#141920" },
      { name: "SECURITY & FACULTY WING", x: 820, y: 25, w: 455, h: 320, color: "#101e18" },
      { name: "STUDENT INFIRMARY", x: 25, y: 460, w: 350, h: 415, color: "#181a1d" },
      { name: "CAMPUS EMERGENCY EXIT", x: 850, y: 550, w: 425, h: 325, color: "#211516" },
      { name: "MAIN CORRIDORS", x: 375, y: 120, w: 445, h: 590, color: "#0c0f13" }
    ];

    // Classroom Walls & Desks
    this.addWall(375, 25, 20, 105);
    this.addWall(375, 230, 20, 75);
    this.addWall(25, 305, 370, 20);

    this.addDecor({ type: "chalkboard", x: 60, y: 27, w: 220, h: 10, text: "SECTOR 1: CLASSROOM OUTBREAK [EASY - TUTORIAL]" });
    this.addDecor({ type: "teacher_desk", x: 130, y: 70, w: 80, h: 35 });
    this.addObstacle(70, 140, 65, 30, "desk");
    this.addObstacle(170, 140, 65, 30, "desk");
    this.addObstacle(270, 140, 65, 30, "desk");
    this.addObstacle(70, 210, 65, 30, "desk");
    this.addObstacle(170, 210, 65, 30, "desk");
    this.addObstacle(270, 210, 65, 30, "desk");

    // Security Wing Walls & Desks
    this.addWall(820, 25, 20, 105);
    this.addWall(820, 230, 20, 115);
    this.addWall(820, 345, 455, 20);

    this.addObstacle(880, 80, 150, 40, "desk");
    this.addObstacle(1070, 80, 140, 40, "desk");
    this.addObstacle(880, 180, 140, 40, "desk");
    this.addObstacle(1060, 180, 150, 40, "desk");
    this.addObstacle(940, 260, 180, 40, "desk");

    // Student Infirmary Walls & Cots
    this.addWall(25, 460, 370, 20);
    this.addWall(375, 460, 20, 80);
    this.addWall(375, 640, 20, 235);

    this.addObstacle(60, 520, 45, 75, "cot");
    this.addObstacle(140, 520, 45, 75, "cot");
    this.addObstacle(60, 670, 45, 75, "cot");
    this.addObstacle(140, 670, 45, 75, "cot");
    this.addObstacle(270, 750, 85, 35, "desk");

    // Exit Gate Walls
    this.addWall(820, 550, 110, 20);
    this.addWall(1040, 550, 235, 20);
    this.addWall(820, 550, 20, 325);

    // Wide Corridor Pillars
    this.addObstacle(560, 250, 40, 40);
    this.addObstacle(560, 420, 40, 40);
    this.addObstacle(560, 590, 40, 40);

    // Warm, welcoming lighting for easy exploration
    this.lights = [
      { x: 200, y: 150, radius: 190, color: "rgba(255, 235, 190, 0.18)", flicker: 0.03 },
      { x: 580, y: 180, radius: 170, color: "rgba(255, 220, 160, 0.16)", flicker: 0.08 },
      { x: 580, y: 380, radius: 180, color: "rgba(255, 220, 160, 0.16)", flicker: 0.05 },
      { x: 580, y: 620, radius: 170, color: "rgba(255, 200, 140, 0.15)", flicker: 0.08 },
      { x: 1050, y: 160, radius: 210, color: "rgba(200, 255, 220, 0.18)", flicker: 0.05 },
      { x: 200, y: 600, radius: 190, color: "rgba(200, 230, 255, 0.16)", flicker: 0.04 },
      { x: 1050, y: 700, radius: 220, color: "rgba(255, 120, 120, 0.20)", flicker: 0.08 }
    ];

    this.decorations.push(
      { type: "blood_stain", x: 395, y: 180, size: 24 },
      { type: "blood_trail", x: 480, y: 180, w: 260, h: 8 },
      { type: "blood_stain", x: 800, y: 180, size: 30 },
      { type: "exit_sign", x: 985, y: 535 }
    );
  }

  /* ------------------------------------------------------------------
   * LEVEL 2 (MEDIUM): The Blackout - Server Aisles & S-Curve Chokepoints
   * ------------------------------------------------------------------ */
  setupLevel2() {
    this.rooms = [
      { name: "SERVER CONTROL 201 (Safe Zone)", x: 25, y: 25, w: 350, h: 280, color: "#0d1117" },
      { name: "COOLING & BACKUP POWER HUB", x: 820, y: 25, w: 455, h: 320, color: "#0d1824" },
      { name: "ARCHIVE STORAGE & BATTERY BAY", x: 25, y: 460, w: 350, h: 415, color: "#11161d" },
      { name: "DATA VAULT AIRLOCK EXIT", x: 850, y: 550, w: 425, h: 325, color: "#1b1411" },
      { name: "SERVER AISLES (S-Curve Labyrinth)", x: 375, y: 120, w: 445, h: 590, color: "#080b0f" }
    ];

    // Control Room Walls & Terminal
    this.addWall(375, 25, 20, 115);
    this.addWall(375, 225, 20, 80);
    this.addWall(25, 305, 370, 20);

    this.addDecor({ type: "chalkboard", x: 60, y: 27, w: 240, h: 10, text: "SECTOR 2: DATA ARCHIVE BLACKOUT [MEDIUM]" });
    this.addObstacle(130, 80, 90, 35, "desk");

    // Cooling & Backup Hub Walls & Server Racks
    this.addWall(820, 25, 20, 105);
    this.addWall(820, 230, 20, 115);
    this.addWall(820, 345, 455, 20);

    this.addObstacle(890, 75, 140, 32, "server_rack");
    this.addObstacle(1070, 75, 140, 32, "server_rack");
    this.addObstacle(890, 175, 140, 32, "server_rack");
    this.addObstacle(1070, 175, 140, 32, "server_rack");
    this.addObstacle(970, 260, 150, 32, "server_rack");

    // Archive Bay Walls & Battery Banks
    this.addWall(25, 460, 370, 20);
    this.addWall(375, 460, 20, 80);
    this.addWall(375, 640, 20, 235);

    this.addObstacle(70, 520, 120, 32, "server_rack");
    this.addObstacle(70, 620, 120, 32, "server_rack");
    this.addObstacle(70, 720, 120, 32, "server_rack");
    this.addObstacle(250, 560, 32, 180, "server_rack");

    // Exit Gate Walls
    this.addWall(820, 550, 110, 20);
    this.addWall(1040, 550, 235, 20);
    this.addWall(820, 550, 20, 325);

    // S-Curve Server Racks in Main Corridor (Winding path forces strategic evasion)
    this.addObstacle(460, 120, 32, 170, "server_rack");
    this.addObstacle(620, 220, 32, 180, "server_rack");
    this.addObstacle(460, 390, 32, 170, "server_rack");
    this.addObstacle(620, 480, 32, 180, "server_rack");

    // Amber Auxiliary Lighting with heavier flicker
    this.lights = [
      { x: 200, y: 150, radius: 140, color: "rgba(255, 160, 40, 0.20)", flicker: 0.15 },
      { x: 540, y: 180, radius: 130, color: "rgba(255, 140, 30, 0.18)", flicker: 0.35 },
      { x: 670, y: 350, radius: 130, color: "rgba(255, 140, 30, 0.18)", flicker: 0.30 },
      { x: 540, y: 550, radius: 130, color: "rgba(255, 140, 30, 0.18)", flicker: 0.38 },
      { x: 1050, y: 160, radius: 160, color: "rgba(0, 210, 255, 0.16)", flicker: 0.20 },
      { x: 200, y: 600, radius: 130, color: "rgba(255, 160, 40, 0.16)", flicker: 0.25 },
      { x: 1050, y: 700, radius: 170, color: "rgba(255, 100, 40, 0.22)", flicker: 0.20 }
    ];

    this.decorations.push(
      { type: "blood_stain", x: 420, y: 190, size: 32 },
      { type: "blood_trail", x: 460, y: 190, w: 240, h: 10 },
      { type: "blood_stain", x: 620, y: 440, size: 36 },
      { type: "hazard_sign", x: 830, y: 110 },
      { type: "warning_text", x: 470, y: 340, text: "AUXILIARY POWER // BLACKOUT", color: "rgba(245, 158, 11, 0.45)" },
      { type: "exit_sign", x: 985, y: 535 }
    );
  }

  /* ------------------------------------------------------------------
   * LEVEL 3 (HARD): Quarantine Purge - Bulkheads, specimen tanks & sirens
   * ------------------------------------------------------------------ */
  setupLevel3() {
    this.rooms = [
      { name: "DECON AIRLOCK A (Safe Zone)", x: 25, y: 25, w: 350, h: 280, color: "#190e0e" },
      { name: "ALPHA SPECIMEN LAB (Contained)", x: 820, y: 25, w: 455, h: 320, color: "#200909" },
      { name: "BIOHAZARD AUTOPSY WING", x: 25, y: 460, w: 350, h: 415, color: "#170a0e" },
      { name: "FINAL EXTRACTION BULKHEAD", x: 850, y: 550, w: 425, h: 325, color: "#290c0c" },
      { name: "CENTRAL CHOKEPOINT LABYRINTH", x: 375, y: 120, w: 445, h: 590, color: "#120608" }
    ];

    // Decon Airlock Walls & Console
    this.addWall(375, 25, 20, 115);
    this.addWall(375, 225, 20, 80);
    this.addWall(25, 305, 370, 20);

    this.addDecor({ type: "chalkboard", x: 60, y: 27, w: 260, h: 10, text: "SECTOR 3: QUARANTINE PURGE PROTOCOL [HARD]" });
    this.addObstacle(130, 70, 80, 35, "desk");

    // Alpha Specimen Lab Walls & Biohazard Tanks
    this.addWall(820, 25, 20, 105);
    this.addWall(820, 230, 20, 115);
    this.addWall(820, 345, 455, 20);

    this.addDecor({ type: "biohazard_tank", x: 910, y: 80, r: 24 });
    this.addDecor({ type: "biohazard_tank", x: 1160, y: 80, r: 24 });
    this.addDecor({ type: "biohazard_tank", x: 910, y: 230, r: 24 });
    this.addDecor({ type: "biohazard_tank", x: 1160, y: 230, r: 24 });
    this.addObstacle(970, 140, 120, 28, "hazard_bulkhead");

    // Autopsy & Morgue Wing Walls & Tables
    this.addWall(25, 460, 370, 20);
    this.addWall(375, 460, 20, 80);
    this.addWall(375, 640, 20, 235);

    this.addObstacle(70, 520, 60, 85, "cot");
    this.addObstacle(180, 520, 60, 85, "cot");
    this.addObstacle(70, 680, 60, 85, "cot");
    this.addObstacle(180, 680, 60, 85, "cot");
    this.addDecor({ type: "biohazard_tank", x: 290, y: 740, r: 24 });

    // Exit Gate Walls
    this.addWall(820, 550, 110, 20);
    this.addWall(1040, 550, 235, 20);
    this.addWall(820, 550, 20, 325);

    // Tactical Chokepoint Bulkheads & Specimen Tanks in Central Hall
    this.addObstacle(375, 180, 110, 24, "hazard_bulkhead");
    this.addObstacle(670, 260, 150, 24, "hazard_bulkhead");
    this.addObstacle(440, 420, 140, 24, "hazard_bulkhead");
    this.addObstacle(640, 540, 180, 24, "hazard_bulkhead");
    this.addDecor({ type: "biohazard_tank", x: 420, y: 310, r: 22 });
    this.addDecor({ type: "biohazard_tank", x: 740, y: 460, r: 22 });

    // Pulsing Red Alarm Siren Klaxons
    this.lights = [
      { x: 200, y: 150, radius: 130, color: "rgba(255, 30, 30, 0.25)", isStrobe: true, flicker: 0.15 },
      { x: 560, y: 190, radius: 140, color: "rgba(255, 30, 30, 0.28)", isStrobe: true, flicker: 0.20 },
      { x: 560, y: 380, radius: 140, color: "rgba(255, 30, 30, 0.28)", isStrobe: true, flicker: 0.20 },
      { x: 560, y: 620, radius: 140, color: "rgba(255, 30, 30, 0.28)", isStrobe: true, flicker: 0.20 },
      { x: 1050, y: 160, radius: 160, color: "rgba(46, 204, 113, 0.18)", isStrobe: false, flicker: 0.10 },
      { x: 200, y: 600, radius: 130, color: "rgba(255, 30, 30, 0.25)", isStrobe: true, flicker: 0.15 },
      { x: 1050, y: 700, radius: 170, color: "rgba(255, 40, 40, 0.30)", isStrobe: true, flicker: 0.20 }
    ];

    this.decorations.push(
      { type: "blood_stain", x: 400, y: 180, size: 45 },
      { type: "blood_trail", x: 460, y: 180, w: 260, h: 14 },
      { type: "blood_stain", x: 800, y: 180, size: 50 },
      { type: "blood_stain", x: 580, y: 480, size: 55 },
      { type: "hazard_sign", x: 830, y: 110 },
      { type: "warning_text", x: 440, y: 350, text: "PURGE PROTOCOL // DECONTAMINATION", color: "rgba(239, 68, 68, 0.6)" },
      { type: "exit_sign", x: 985, y: 535 }
    );
  }

  addWall(x, y, w, h) {
    this.walls.push({ x, y, w, h, isWall: true });
  }

  addObstacle(x, y, w, h, obstacleType = "generic") {
    this.walls.push({ x, y, w, h, isObstacle: true, obstacleType });
  }

  addDecor(decor) {
    this.decorations.push(decor);
  }

  draw(ctx) {
    // 1. Draw Room Floors with Environment Tile Pattern
    for (const room of this.rooms) {
      if (envTextures.floorPattern) {
        ctx.fillStyle = envTextures.floorPattern;
        ctx.fillRect(room.x, room.y, room.w, room.h);

        // Apply room-specific atmosphere tint
        if (room.name.includes("CLASSROOM") || room.name.includes("SAFE ZONE") || room.name.includes("CONTROL") || room.name.includes("AIRLOCK A")) {
          ctx.fillStyle = this.levelNum === 3 ? "rgba(25, 14, 14, 0.65)" : (this.levelNum === 2 ? "rgba(13, 17, 23, 0.55)" : "rgba(20, 24, 30, 0.38)");
        } else if (room.name.includes("LAB") || room.name.includes("SECURITY") || room.name.includes("HUB")) {
          ctx.fillStyle = this.levelNum === 3 ? "rgba(32, 9, 9, 0.75)" : (this.levelNum === 2 ? "rgba(13, 24, 36, 0.68)" : "rgba(14, 30, 22, 0.65)");
        } else if (room.name.includes("INFIRMARY") || room.name.includes("ARCHIVE") || room.name.includes("AUTOPSY")) {
          ctx.fillStyle = this.levelNum === 3 ? "rgba(23, 10, 14, 0.72)" : (this.levelNum === 2 ? "rgba(17, 22, 29, 0.62)" : "rgba(18, 22, 26, 0.55)");
        } else if (room.name.includes("EXIT") || room.name.includes("BULKHEAD")) {
          ctx.fillStyle = this.levelNum === 3 ? "rgba(41, 12, 12, 0.75)" : "rgba(32, 16, 18, 0.62)";
        } else {
          ctx.fillStyle = this.levelNum === 3 ? "rgba(18, 6, 8, 0.78)" : (this.levelNum === 2 ? "rgba(8, 11, 15, 0.72)" : "rgba(10, 14, 18, 0.65)");
        }
        ctx.fillRect(room.x, room.y, room.w, room.h);
      } else {
        ctx.fillStyle = room.color;
        ctx.fillRect(room.x, room.y, room.w, room.h);
      }

      // Room Name Label on floor
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.font = "bold 13px Consolas, monospace";
      ctx.fillText(room.name, room.x + 20, room.y + 35);
    }

    // 2. Draw Floor Blood, Smartboard & Hazards
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
        // Digital Smartboard Display
        ctx.fillStyle = "#0c1015";
        ctx.fillRect(d.x, d.y, d.w, d.h + 2);
        ctx.strokeStyle = "#4b5868";
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, d.w, d.h + 2);

        // Glowing digital alert text
        ctx.fillStyle = "#ff4455";
        ctx.font = "bold 9px monospace";
        ctx.fillText(d.text, d.x + 8, d.y + 9);
      } else if (d.type === "biohazard_tank") {
        // Glowing Specimen Containment Cylinder
        ctx.fillStyle = "#0f382c";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2ecc71";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = "rgba(46, 204, 113, 0.35)";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#2ecc71";
        ctx.font = "14px sans-serif";
        ctx.fillText("☣", d.x - 7, d.y + 5);
      } else if (d.type === "hazard_sign") {
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 13px monospace";
        ctx.fillText("⚠ BIOHAZARD", d.x, d.y);
      } else if (d.type === "warning_text") {
        ctx.fillStyle = d.color || "rgba(239, 68, 68, 0.45)";
        ctx.font = "bold 15px Consolas, monospace";
        ctx.fillText(d.text, d.x, d.y);
      } else if (d.type === "exit_sign") {
        ctx.fillStyle = "#ff2233";
        ctx.fillRect(d.x - 45, d.y - 12, 90, 24);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.fillText("EXIT GATE", d.x - 33, d.y + 4);
      }
    }

    // 3. Draw Solid Walls & Distinct Obstacles (Desks / Server Racks / Bulkheads)
    for (const w of this.walls) {
      if (w.isObstacle) {
        if (w.obstacleType === "server_rack") {
          // Metallic Server Rack with Blinking Indicator LEDs
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(w.x, w.y, w.w, w.h);
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 2;
          ctx.strokeRect(w.x, w.y, w.w, w.h);

          // Server slots & blinking LEDs
          ctx.fillStyle = "#020617";
          const slotH = 14;
          for (let sy = w.y + 3; sy < w.y + w.h - 6; sy += slotH) {
            ctx.fillRect(w.x + 2, sy, w.w - 4, Math.min(10, w.y + w.h - sy - 3));
            const ledPhase = Math.floor((Date.now() / 320) + sy + w.x) % 3;
            ctx.fillStyle = ledPhase === 0 ? "#10b981" : (ledPhase === 1 ? "#06b6d4" : "#f59e0b");
            ctx.fillRect(w.x + 4, sy + 3, 3, 3);
            ctx.fillStyle = (ledPhase + 1) % 3 === 0 ? "#10b981" : "#0284c7";
            ctx.fillRect(w.x + 10, sy + 3, 3, 3);
            ctx.fillStyle = "#020617";
          }
        } else if (w.obstacleType === "hazard_bulkhead") {
          // Heavy Reinforced Steel Bulkhead with Yellow/Black Hazard Stripes
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(w.x, w.y, w.w, w.h);
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2;
          ctx.strokeRect(w.x, w.y, w.w, w.h);

          // Diagonal hazard warning stripes
          ctx.save();
          ctx.beginPath();
          ctx.rect(w.x, w.y, w.w, w.h);
          ctx.clip();
          ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
          ctx.lineWidth = 6;
          for (let sx = -w.h; sx < w.w + w.h; sx += 18) {
            ctx.beginPath();
            ctx.moveTo(w.x + sx, w.y);
            ctx.lineTo(w.x + sx + w.h, w.y + w.h);
            ctx.stroke();
          }
          ctx.restore();
        } else if (w.obstacleType === "cot") {
          // Medical Cot / Autopsy Slab
          ctx.fillStyle = "#334155";
          ctx.fillRect(w.x, w.y, w.w, w.h);
          ctx.strokeStyle = "#64748b";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(w.x, w.y, w.w, w.h);
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(w.x + 4, w.y + 4, w.w - 8, 14);
        } else if (envTextures.deskImg && envTextures.deskImg.complete && w.w > 50 && w.h < 50) {
          // Photo-sourced wooden student desk
          ctx.drawImage(envTextures.deskImg, w.x, w.y, w.w, w.h);
          ctx.strokeStyle = "#4b3c30";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(w.x, w.y, w.w, w.h);
          ctx.fillStyle = "#8a96a3";
          ctx.fillRect(w.x + 4, w.y + 2, 4, w.h - 4);
          ctx.fillRect(w.x + w.w - 8, w.y + 2, 4, w.h - 4);
        } else {
          // Standard obstacle
          ctx.fillStyle = "#222a36";
          ctx.fillRect(w.x, w.y, w.w, w.h);
          ctx.strokeStyle = "#384556";
          ctx.lineWidth = 2;
          ctx.strokeRect(w.x, w.y, w.w, w.h);
        }
      } else {
        // Walls with level-specific metal/concrete color
        ctx.fillStyle = this.levelNum === 3 ? "#1e1315" : (this.levelNum === 2 ? "#141c26" : "#1b212a");
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = this.levelNum === 3 ? "#6b2126" : (this.levelNum === 2 ? "#254668" : "#3f4d62");
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
    const shakeIntensity = (typeof gameSettings !== 'undefined' && gameSettings.screenShake === 'off') ? 0 :
      ((typeof gameSettings !== 'undefined' && gameSettings.screenShake === 'reduced') ? 8 : 16);
    camera.shake = shakeIntensity; // Camera impact shake
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

const camera = { x: 0, y: 0, shake: 0 };
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
  if (lvl > 3) {
    triggerVictory();
    return;
  }
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
    player.health = Math.min(CONFIG.MAX_HEALTH, oldHealth + 25); // Small bonus for clearing level
  }

  setupLevelEntities(lvl);
  gameState.mode = "PLAYING";
  hideModals();
  updateObjectivesUI();
  updateHUD(0);
  applyBrightness();
  showBanner(`${cfg.title} - ${cfg.description}`, "urgent");
}

const gameSettings = {
  volume: 0.8,
  sfx: true,
  brightness: 1.0,
  displayMode: 'windowed',
  crtScanlines: true,
  screenShake: 'intense'
};

function applyBrightness() {
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    canvas.style.filter = `brightness(${gameSettings.brightness})`;
  }
}

const ALL_SCREENS = [
  'screen-main-menu',
  'screen-select-level',
  'screen-settings',
  'screen-guide',
  'screen-pause',
  'screen-exit',
  'screen-gameover',
  'screen-level-complete',
  'screen-win'
];

let previousScreen = 'screen-main-menu';

function showScreen(screenId) {
  const overlay = document.getElementById('modal-overlay');
  if (!screenId) {
    if (overlay) overlay.classList.remove('modal-active');
    ALL_SCREENS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    return;
  }

  if (overlay) overlay.classList.add('modal-active');
  ALL_SCREENS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === screenId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Focus default button in main menu
  if (screenId === 'screen-main-menu') {
    const playBtn = document.getElementById('btn-menu-play');
    if (playBtn) highlightMenuButton(playBtn);
  }
}

function hideModals() {
  showScreen(null);
}

function pauseGame() {
  if (gameState.mode === 'PLAYING') {
    gameState.mode = 'PAUSED';
    audio.playMenuHover();
    showScreen('screen-pause');
  }
}

function resumeGame() {
  if (gameState.mode === 'PAUSED') {
    gameState.mode = 'PLAYING';
    audio.playMenuSelect();
    hideModals();
  }
}

function highlightMenuButton(btn) {
  const allBtns = document.querySelectorAll('#screen-main-menu .menu-nav-btn');
  allBtns.forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
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
    gameState.mode = "MENU";
    showScreen('screen-main-menu');
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
  const nextLevelNum = gameState.currentLevel + 1;
  const nextCfg = LEVEL_CONFIGS[nextLevelNum - 1];

  const statLvl = document.getElementById('stat-level-num');
  if (statLvl) statLvl.textContent = `Level ${cfg.level} (${cfg.difficulty})`;
  const statNext = document.getElementById('stat-next-level');
  if (statNext) statNext.textContent = nextCfg ? `${nextCfg.title} (${nextCfg.difficulty})` : 'All Sectors Cleared!';
  const statHealth = document.getElementById('stat-level-health');
  if (statHealth) statHealth.textContent = `${Math.ceil(player.health)}%`;
  const nextHint = document.getElementById('level-next-hint');
  if (nextHint) nextHint.textContent = cfg.nextSectorHint;

  const btnNext = document.getElementById('btn-next-level');
  if (btnNext && nextCfg) {
    btnNext.textContent = `ADVANCE TO LEVEL ${nextLevelNum}: ${nextCfg.difficulty.toUpperCase()} [SPACE / ENTER]`;
  }

  showScreen('screen-level-complete');
}

function triggerGameOver(cause) {
  gameState.mode = "GAMEOVER";
  audio.playGameOver();

  const goCause = document.getElementById('gameover-cause');
  if (goCause) goCause.textContent = cause;
  const cfg = getCurrentLevelConfig();
  const timeSpent = cfg.timeLimit - gameState.timeRemaining;
  const mins = Math.floor(timeSpent / 60);
  const secs = Math.floor(timeSpent % 60);
  const statTime = document.getElementById('stat-time-survived');
  if (statTime) statTime.textContent = `${mins}m ${secs}s (on Level ${gameState.currentLevel})`;
  const statKey = document.getElementById('stat-keycard-found');
  if (statKey) statKey.textContent = gameState.hasKeycard ? "Yes" : "No";
  const statEvaded = document.getElementById('stat-zombies-evaded');
  if (statEvaded) statEvaded.textContent = zombies.filter(z => z.state === "CHASE").length;

  showScreen('screen-gameover');
}

function triggerVictory() {
  gameState.mode = "WIN";
  audio.playVictory();

  const totalSecs = Math.floor(gameState.totalTimeElapsed);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const statWinTime = document.getElementById('stat-win-time');
  if (statWinTime) statWinTime.textContent = `${mins}m ${secs}s`;
  const statWinHealth = document.getElementById('stat-win-health');
  if (statWinHealth) statWinHealth.textContent = `${Math.ceil(player.health)}%`;

  let rating = "S - INFILTRATION MASTER";
  if (player.health < 40) rating = "A - SURVIVOR";
  const statWinRating = document.getElementById('stat-win-rating');
  if (statWinRating) statWinRating.textContent = rating;

  showScreen('screen-win');
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
    const inExitArea = (player.x >= 860 && player.y >= 555) ||
                       (player.x >= 920 && player.x <= 1060 && player.y >= 530 && player.y <= 620);
    if (gameState.hasKeycard && inExitArea) {
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

    // Smooth Camera Follow & Shake Decay
    camera.x = Math.max(0, Math.min(CONFIG.WORLD_WIDTH - CONFIG.CANVAS_WIDTH, player.x - CONFIG.CANVAS_WIDTH / 2));
    camera.y = Math.max(0, Math.min(CONFIG.WORLD_HEIGHT - CONFIG.CANVAS_HEIGHT, player.y - CONFIG.CANVAS_HEIGHT / 2));

    if (camera.shake > 0) {
      camera.shake = Math.max(0, camera.shake - dt * 28);
    }

    updateHUD(dt);
  }

  // Render Pass with Camera Shake
  ctx.save();
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  const shakeOffsetX = camera.shake > 0 ? (Math.random() - 0.5) * camera.shake : 0;
  const shakeOffsetY = camera.shake > 0 ? (Math.random() - 0.5) * camera.shake : 0;
  ctx.translate(-camera.x + shakeOffsetX, -camera.y + shakeOffsetY);

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

    // In-Game Aiming Reticle / Laser Crosshair (Screen space)
    ctx.save();
    const mx = mouse.x;
    const my = mouse.y;
    const worldMx = mouse.x + camera.x;
    const worldMy = mouse.y + camera.y;
    const hoverZombie = zombies.some(z => Math.hypot(z.x - worldMx, z.y - worldMy) < 32);

    ctx.strokeStyle = hoverZombie ? "#ff3344" : "rgba(0, 210, 255, 0.8)";
    ctx.lineWidth = 1.5;

    const r = player && player.isSprinting ? 12 : 7;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mx - r - 4, my); ctx.lineTo(mx - r - 1, my);
    ctx.moveTo(mx + r + 1, my); ctx.lineTo(mx + r + 4, my);
    ctx.moveTo(mx, my - r - 4); ctx.lineTo(mx, my - r - 1);
    ctx.moveTo(mx, my + r + 1); ctx.lineTo(mx, my + r + 4);
    ctx.stroke();

    ctx.fillStyle = hoverZombie ? "#ff1a30" : "#00d2ff";
    ctx.beginPath();
    ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}

// Fullscreen Handler
function toggleFullscreen() {
  audio.init();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// Keep Fullscreen UI buttons in sync
document.addEventListener('fullscreenchange', () => {
  const isFull = !!document.fullscreenElement;
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const settingDisplayMode = document.getElementById('setting-display-mode');

  if (btnFullscreen) {
    btnFullscreen.textContent = isFull ? "⛶ WINDOWED [F]" : "⛶ FULLSCREEN [F]";
  }
  if (settingDisplayMode) {
    settingDisplayMode.textContent = isFull ? "FULLSCREEN [PRESS F]" : "WINDOWED [PRESS F]";
    if (isFull) {
      settingDisplayMode.classList.add('active');
    } else {
      settingDisplayMode.classList.remove('active');
    }
  }
});

/* ====================================================================
 * 10. INPUT LISTENERS & INTERACTIVE MENU HOOKS
 * ==================================================================== */
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  // 'F' key toggles Fullscreen
  if (e.code === 'KeyF') {
    toggleFullscreen();
  }

  // 'ESC' key toggles Pause or returns from Submenus
  if (e.code === 'Escape') {
    if (gameState.mode === 'PLAYING') {
      pauseGame();
    } else if (gameState.mode === 'PAUSED') {
      resumeGame();
    } else if (gameState.mode === 'MENU') {
      const activeCard = document.querySelector('#modal-overlay .modal-card:not(.hidden)');
      if (activeCard && activeCard.id !== 'screen-main-menu') {
        audio.playMenuSelect();
        showScreen(previousScreen || 'screen-main-menu');
      }
    }
  }

  // Keyboard Navigation on Main Menu (Up/Down or W/S + Enter/Space)
  if (gameState.mode === 'MENU') {
    const activeMainMenu = document.getElementById('screen-main-menu');
    if (activeMainMenu && !activeMainMenu.classList.contains('hidden')) {
      const navBtns = Array.from(activeMainMenu.querySelectorAll('.menu-nav-btn'));
      const currentIndex = navBtns.findIndex(b => b.classList.contains('selected'));

      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        audio.init();
        const nextIndex = currentIndex < navBtns.length - 1 ? currentIndex + 1 : 0;
        highlightMenuButton(navBtns[nextIndex]);
        audio.playMenuHover();
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        audio.init();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : navBtns.length - 1;
        highlightMenuButton(navBtns[prevIndex]);
        audio.playMenuHover();
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (currentIndex >= 0 && navBtns[currentIndex]) {
          navBtns[currentIndex].click();
        }
      }
    }
  }

  // Space / Enter advances to next level from Level Complete screen
  if ((e.code === 'Space' || e.code === 'Enter') && gameState.mode === 'LEVEL_COMPLETE') {
    audio.init();
    audio.playMenuSelect();
    startLevel(gameState.currentLevel + 1, true);
  }

  // 'R' retries sector from Game Over or Win screen
  if (e.code === 'KeyR') {
    if (gameState.mode === 'GAMEOVER') {
      audio.init();
      audio.playMenuSelect();
      startLevel(gameState.currentLevel, false);
    } else if (gameState.mode === 'WIN') {
      audio.init();
      audio.playMenuSelect();
      startLevel(1, false);
    }
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

/* --- A. MAIN MENU BUTTONS --- */
const btnMenuPlay = document.getElementById('btn-menu-play');
if (btnMenuPlay) {
  btnMenuPlay.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    startLevel(1, false);
  });
}

const btnMenuLevels = document.getElementById('btn-menu-levels');
if (btnMenuLevels) {
  btnMenuLevels.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    previousScreen = 'screen-main-menu';
    showScreen('screen-select-level');
  });
}

const btnMenuSettings = document.getElementById('btn-menu-settings');
if (btnMenuSettings) {
  btnMenuSettings.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    previousScreen = 'screen-main-menu';
    showScreen('screen-settings');
  });
}

const btnMenuGuide = document.getElementById('btn-menu-guide');
if (btnMenuGuide) {
  btnMenuGuide.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    previousScreen = 'screen-main-menu';
    showScreen('screen-guide');
  });
}

const btnMenuExit = document.getElementById('btn-menu-exit');
if (btnMenuExit) {
  btnMenuExit.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    previousScreen = 'screen-main-menu';
    showScreen('screen-exit');
  });
}

/* --- B. LEVEL / SECTOR SELECT --- */
const btnSelectLvl1 = document.getElementById('btn-select-lvl1');
if (btnSelectLvl1) {
  btnSelectLvl1.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    startLevel(1, false);
  });
}

const btnSelectLvl2 = document.getElementById('btn-select-lvl2');
if (btnSelectLvl2) {
  btnSelectLvl2.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    startLevel(2, false);
  });
}

const btnSelectLvl3 = document.getElementById('btn-select-lvl3');
if (btnSelectLvl3) {
  btnSelectLvl3.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    startLevel(3, false);
  });
}

const btnLevelsBack = document.getElementById('btn-levels-back');
if (btnLevelsBack) {
  btnLevelsBack.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    showScreen('screen-main-menu');
  });
}

/* --- C. SETTINGS & VISUALS --- */
const settingVolume = document.getElementById('setting-volume');
const volumeVal = document.getElementById('volume-val');
if (settingVolume) {
  settingVolume.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (volumeVal) volumeVal.textContent = `${val}%`;
    gameSettings.volume = val / 100;
    audio.init();
    audio.setVolume(val / 100);
  });
  settingVolume.addEventListener('change', () => {
    audio.playMenuHover();
  });
}

const settingBrightness = document.getElementById('setting-brightness');
const brightnessVal = document.getElementById('brightness-val');
if (settingBrightness) {
  settingBrightness.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (brightnessVal) brightnessVal.textContent = `${val}%`;
    gameSettings.brightness = val / 100;
    applyBrightness();
  });
  settingBrightness.addEventListener('change', () => {
    audio.playMenuHover();
  });
}

const settingSfx = document.getElementById('setting-sfx');
if (settingSfx) {
  settingSfx.addEventListener('click', () => {
    audio.init();
    const isMuted = audio.toggleMute();
    gameSettings.sfx = !isMuted;
    settingSfx.textContent = isMuted ? "MUTED" : "ENABLED";
    settingSfx.className = isMuted ? "toggle-btn" : "toggle-btn active";
    const btnAudio = document.getElementById('btn-audio');
    if (btnAudio) btnAudio.textContent = isMuted ? "🔇 MUTED" : "🔊 AUDIO";
    if (!isMuted) audio.playMenuSelect();
  });
}

const settingDisplayMode = document.getElementById('setting-display-mode');
if (settingDisplayMode) {
  settingDisplayMode.addEventListener('click', () => {
    toggleFullscreen();
  });
}

const settingCrt = document.getElementById('setting-crt');
if (settingCrt) {
  settingCrt.addEventListener('click', () => {
    audio.init();
    gameSettings.crtScanlines = !gameSettings.crtScanlines;
    const crt = document.getElementById('crt-overlay');
    if (crt) crt.style.display = gameSettings.crtScanlines ? 'block' : 'none';
    settingCrt.textContent = gameSettings.crtScanlines ? "ENABLED" : "DISABLED";
    settingCrt.className = gameSettings.crtScanlines ? "toggle-btn active" : "toggle-btn";
    audio.playMenuSelect();
  });
}

const settingScreenshake = document.getElementById('setting-screenshake');
if (settingScreenshake) {
  settingScreenshake.addEventListener('click', () => {
    audio.init();
    if (gameSettings.screenShake === 'intense') {
      gameSettings.screenShake = 'reduced';
      settingScreenshake.textContent = 'REDUCED';
      settingScreenshake.className = 'toggle-btn active';
    } else if (gameSettings.screenShake === 'reduced') {
      gameSettings.screenShake = 'off';
      settingScreenshake.textContent = 'DISABLED';
      settingScreenshake.className = 'toggle-btn';
    } else {
      gameSettings.screenShake = 'intense';
      settingScreenshake.textContent = 'INTENSE';
      settingScreenshake.className = 'toggle-btn active';
    }
    audio.playMenuSelect();
  });
}

const btnSettingsBack = document.getElementById('btn-settings-back');
if (btnSettingsBack) {
  btnSettingsBack.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    showScreen(previousScreen || 'screen-main-menu');
  });
}

/* --- D. SURVIVAL GUIDE --- */
const btnGuideBack = document.getElementById('btn-guide-back');
if (btnGuideBack) {
  btnGuideBack.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    showScreen('screen-main-menu');
  });
}

/* --- E. PAUSE MENU --- */
const btnPauseResume = document.getElementById('btn-pause-resume');
if (btnPauseResume) {
  btnPauseResume.addEventListener('click', () => {
    resumeGame();
  });
}

const btnPauseRestart = document.getElementById('btn-pause-restart');
if (btnPauseRestart) {
  btnPauseRestart.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    startLevel(gameState.currentLevel, false);
  });
}

const btnPauseSettings = document.getElementById('btn-pause-settings');
if (btnPauseSettings) {
  btnPauseSettings.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    previousScreen = 'screen-pause';
    showScreen('screen-settings');
  });
}

const btnPauseMenu = document.getElementById('btn-pause-menu');
if (btnPauseMenu) {
  btnPauseMenu.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    gameState.mode = 'MENU';
    showScreen('screen-main-menu');
  });
}

/* --- F. EXIT MODAL --- */
function executeExit() {
  audio.init();
  audio.playMenuSelect();

  try { window.close(); } catch (e) {}
  try { window.open('', '_self', ''); window.close(); } catch (e) {}
  try { window.top.close(); } catch (e) {}

  setTimeout(() => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.className = 'modal-active';
      overlay.style.backgroundColor = 'rgba(2, 4, 8, 0.98)';
      overlay.innerHTML = `
        <div style="text-align:center; padding: 36px; color:#ffffff; font-family:var(--font-mono); max-width:520px; border:2px solid #ff3344; background:#0a0d14; border-radius:8px; box-shadow:0 0 40px rgba(255,51,68,0.7); animation:menu-slide-in 0.4s ease;">
          <div style="font-size:30px; font-weight:900; color:#ff3344; letter-spacing:4px; margin-bottom:12px;">SESSION TERMINATED</div>
          <div style="font-size:13px; color:#00d2ff; letter-spacing:2px; margin-bottom:18px;">[NOT DEAD YET // PROTOCOL OFFLINE]</div>
          <p style="color:#94a3b8; font-size:13px; line-height:1.6; margin-bottom:24px;">The campus quarantine survival simulation has ended. You can safely close this window or tab.</p>
          <button id="btn-force-close" class="cta-btn danger" style="padding:12px 28px; font-size:14px; cursor:pointer;">CLOSE TAB NOW</button>
        </div>
      `;
      const btnForce = document.getElementById('btn-force-close');
      if (btnForce) {
        btnForce.addEventListener('click', () => {
          try { window.open('', '_self', ''); window.close(); } catch (e) {}
          try { window.location.replace('about:blank'); } catch (e) {}
        });
      }
    }
  }, 100);
}

const btnExitConfirm = document.getElementById('btn-exit-confirm');
if (btnExitConfirm) {
  btnExitConfirm.addEventListener('click', executeExit);
}

const btnExitCancel = document.getElementById('btn-exit-cancel');
if (btnExitCancel) {
  btnExitCancel.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    showScreen('screen-main-menu');
  });
}

/* --- G. LEVEL COMPLETE, GAME OVER & WIN MODALS --- */
const btnNextLevel = document.getElementById('btn-next-level');
if (btnNextLevel) {
  btnNextLevel.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    startLevel(gameState.currentLevel + 1, true);
  });
}

const btnRetry = document.getElementById('btn-retry');
if (btnRetry) {
  btnRetry.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    startLevel(gameState.currentLevel, false);
  });
}

const btnGameoverMenu = document.getElementById('btn-gameover-menu');
if (btnGameoverMenu) {
  btnGameoverMenu.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    gameState.mode = 'MENU';
    showScreen('screen-main-menu');
  });
}

const btnPlayAgain = document.getElementById('btn-play-again');
if (btnPlayAgain) {
  btnPlayAgain.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    startLevel(1, false);
  });
}

const btnWinMenu = document.getElementById('btn-win-menu');
if (btnWinMenu) {
  btnWinMenu.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    gameState.mode = 'MENU';
    showScreen('screen-main-menu');
  });
}

/* --- H. FOOTER BUTTONS --- */
const btnFullscreen = document.getElementById('btn-fullscreen');
if (btnFullscreen) {
  btnFullscreen.addEventListener('click', toggleFullscreen);
}

const btnRestartQuick = document.getElementById('btn-restart-quick');
if (btnRestartQuick) {
  btnRestartQuick.addEventListener('click', () => {
    audio.init();
    audio.playMenuSelect();
    startLevel(gameState.currentLevel, false);
  });
}

const btnAudio = document.getElementById('btn-audio');
if (btnAudio) {
  btnAudio.addEventListener('click', () => {
    audio.init();
    const isMuted = audio.toggleMute();
    btnAudio.textContent = isMuted ? "🔇 MUTED" : "🔊 AUDIO";
    if (settingSfx) {
      settingSfx.textContent = isMuted ? "MUTED" : "ENABLED";
      settingSfx.className = isMuted ? "toggle-btn" : "toggle-btn active";
    }
    if (!isMuted) audio.playMenuSelect();
  });
}

/* --- I. HOVER ACOUSTIC BLIPS & DYNAMIC GLOW SELECTION --- */
const interactiveButtons = document.querySelectorAll('.menu-nav-btn, .sector-card, .cta-btn, .hud-btn');
interactiveButtons.forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    audio.init();
    audio.playMenuHover();
    if (btn.classList.contains('menu-nav-btn')) {
      highlightMenuButton(btn);
    }
  });
});

// Set main menu background dynamically if base64 asset is available
const mainMenuScreen = document.getElementById('screen-main-menu');
if (mainMenuScreen && typeof ENV_ASSETS !== 'undefined' && ENV_ASSETS.mainMenuBg) {
  mainMenuScreen.style.backgroundImage = `linear-gradient(to right, rgba(5, 7, 10, 0.94) 0%, rgba(8, 12, 18, 0.80) 50%, rgba(5, 7, 10, 0.90) 100%), url('${ENV_ASSETS.mainMenuBg}')`;
}

// Setup Initial State & Start Loop
initGame(false);
requestAnimationFrame(gameLoop);
