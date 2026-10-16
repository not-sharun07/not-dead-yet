# NOT DEAD YET 🧟‍♂️🚪⚡
### 2D Top-Down University Campus Zombie Survival Game

Built specifically for a 10-hour student hackathon. Lightweight, zero external dependencies, runs natively in any modern web browser or as a standalone desktop window.

---

## 🚀 Quick Start (How to Launch)

You do **not** need to install Python, Node.js, or any build tools!

1. Open File Explorer and navigate to:
   ```
   C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\
   ```
2. Double-click **`start_game.bat`**:
   - Launches in dedicated **Standalone Window Mode** (Edge App mode) with **zero browser toolbars, tabs, or address bars**, making it look and feel like an authentic commercial desktop game!
   - Alternatively, double-click **`index.html`** in any browser (Chrome, Edge, Firefox).
3. The cinematic **Main Menu** appears featuring Jawaharlal Nehru Engineering College under zombie lockdown.
4. Use mouse or `W`/`S` / Arrow keys to navigate options, and click or press `ENTER` to select!

---

## 🎮 Main Menu & Features

### 🏛️ Cinematic Campus Main Menu
- **Photo-Real Background:** Uses your uploaded image of Jawaharlal Nehru Engineering College overrun by the zombie horde (`media_1792141438350_43cd69d6.jpg`), with red emergency alert lighting.
- **Animated Glowing Font Options:** Every menu option pulsates with a high-tech cyan/crimson neon glow and expands upon hover or selection.
- **Synthesized Audio Blips:** Custom sound synthesizer plays crisp digital clicks on hover and confirmation chimes on selection.

### 🕹️ Interactive Menu Options
1. **PLAY CAMPAIGN:** Starts Level 1 immediately (Classroom Outbreak).
2. **SELECT SECTOR:** Choose difficulty directly:
   - **Sector 1 (Easy):** 200s limit, 3 patrol infected, standard emergency lighting.
   - **Sector 2 (Medium):** 160s limit, 5 aggressive stalkers, pitch-black corridors.
   - **Sector 3 (Hard):** 120s limit, 7 mutant berserkers, red sirens, high noise sensitivity!
3. **SETTINGS & VISUALS:**
   - **Master Volume Slider:** Real-time volume gain control (0% to 100%) with live audio preview.
   - **SFX Toggle:** Enable/disable all footsteps, bites, chimes, and alert sirens.
   - **Display Mode:** Toggle true borderless fullscreen display (Press `F` at any time).
   - **CRT Monitor Scanlines:** Vintage security surveillance scanlines and phosphor curve effect.
   - **Camera Screen Shake:** Violent impact trauma shake intensity (`INTENSE`, `REDUCED`, or `DISABLED`).
4. **SURVIVAL GUIDE:** Visual intel on stealth, sprint noise ripple radius, and evacuation objectives.
5. **EXIT GAME:** Gracefully quits the game or confirms exit to desktop.

### ⏸️ In-Game Pause Menu (`ESC` Key)
- Press **`ESC`** at any time during gameplay to suspend the quarantine purge timer and open the pause menu.
- Resume infiltration, restart the current sector, adjust volume/settings on the fly, or return to the main menu.

---

## 🕹️ Controls Reference

| Action | Controls | Notes |
| :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or `Arrow Keys` | Standard walking. Animated walk cycles, quiet footprint radius (saves stamina). |
| **Sprint** | Hold `SHIFT` | Fast escape sprint cycle, consumes stamina, **emits visual sound waves that alert zombies through walls!** |
| **Flashlight / Aim** | `Mouse Cursor` | Directional flashlight beam pierces the dark campus fog-of-war with dynamic laser crosshair. Character turns to face cursor. |
| **Pause Game** | `ESC` Key | Pauses countdown and brings up the in-game mission menu. |
| **Toggle Fullscreen** | `F` Key | Instant true borderless fullscreen switch. |
| **Menu Navigation** | `W`/`S` or `↑`/`↓` + `ENTER`/`SPACE` | Full keyboard navigation with glowing selection highlight. |
| **Pick up Items** | Walk over them | Keycard and Medical Kit are collected automatically on contact. |
| **Quick Restart** | `R` Key | Instant sector retry on Game Over or Campaign Win. |

---

## 📊 3 Progressive Difficulty Levels

| Sector | Difficulty | Zombies | Zombie Chase Speed | Light Beam | Time Limit | Noise Threshold |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sector 1: Classroom Outbreak** | Easy | 3 | 1.95 (Forgiving) | 320px | 200s (3m 20s) | 280px |
| **Sector 2: The Blackout** | Medium | 5 | 2.35 (Fast) | 260px | 160s (2m 40s) | 380px |
| **Sector 3: Quarantine Purge** | Hard | 7 | 2.70 (Berserk) | 220px | 120s (2m 00s) | 460px |

---

## 🎨 Animated Character Sprites

The character uses custom pixel-art animations sliced from your sprite sheet:
- **IDLE Animation:** 4-frame breathing cycle when standing still.
- **RUN Animation:** 6-frame running cycle that dynamically speeds up during sprinting.
- **HURT Animation:** 4-frame damage stagger and red flash when hit.
- **Directional Flip:** The character smoothly turns left or right based on mouse aiming.
- **Zero-CORS Embedded Assets:** All frames are stored in `assets/player_sprites.js` as base64 data URIs.

---

## 🏫 Real Classroom Environment Assets

The game now uses your uploaded university photos and floor textures:
- **Tiled Campus Floor:** 256x256 seamless tile texture applied across Classroom 101, corridors, research lab, and the evacuation exit.
- **Realistic Student Desks:** Photo-sourced wood-laminate tops with metallic side leg brackets directly modeled from the classroom photo.
- **Wall Smartboard:** Digital flat panel presentation screen mounted on Classroom 101's north wall displaying live evacuation alerts.
- **Classroom Doors:** Heavy security doors with glass viewing panes extracted from the photo.
- **Pre-encoded Base64:** Stored in `assets/env_sprites.js` so it works offline and directly from `file://` with no CORS errors.

---

## 🗺️ Campus Map Layout

```
+--------------------------------------------------------------+
| CLASSROOM 101       |     NORTH HALLWAY      | RESEARCH LAB B |
| (Player Spawn Safe) |    (Patrol Zombie)     | (Security Key) |
| [Doorway East]      +----------+-------------+ [Doorway West] |
+---------+-----------+          |                              |
|         |                      | (Infected Scientist Zombie)  |
|         |                      |                              |
| INFIRMARY / MED BAY |     SOUTH HALLWAY      +----------------+
| (Health Kit +45 HP) |   (Hallway Stalker)    | CAMPUS EXIT    |
| [Doorway East]      +------------------------+ (Blast Doors)  |
|                                              | [EVAC ZONE]    |
+----------------------------------------------+----------------+
```
