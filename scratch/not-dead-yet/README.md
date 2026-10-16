# NOT DEAD YET 🧟‍♂️
### 2D Top-Down University Campus Zombie Survival Game

Built specifically for a 10-hour student hackathon. Lightweight, zero external dependencies, runs natively in any modern web browser.

---

## 🎮 Quick Start (How to Launch)

You do **not** need to install Python, Node.js, or any build tools!

1. Open File Explorer and navigate to:
   ```
   C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\
   ```
2. Double-click **`start_game.bat`** (or right-click **`index.html`** → *Open with Google Chrome / Microsoft Edge / Firefox*).
3. The game will immediately open in your browser. Click **"START RUN"** or press **SPACE** to begin!

---

## 🕹️ Controls

| Action | Controls | Notes |
| :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or `Arrow Keys` | Standard walking. Animated walk cycles, quiet footprint radius (saves stamina). |
| **Sprint** | Hold `SHIFT` | Fast escape sprint cycle, consumes stamina, **emits visual sound waves that alert zombies through walls!** |
| **Flashlight** | `Mouse Cursor` | Directional flashlight beam pierces the dark campus fog-of-war. Character turns left/right to face cursor. |
| **Pick up Items** | Walk over them | Keycard and Medical Kit are collected automatically on contact. |
| **Advance / Restart** | `SPACE` / `ENTER` / `R` | Quick one-touch level advance on Sector Clear, or instant replay on Game Over / Win. |
| **Toggle Audio** | Click `🔊 AUDIO` button | Mute or unmute synthesized sound effects. |

---

## 🏆 3 Progressive Difficulty Levels

The game features a full 3-level campaign where difficulty escalates each sector:

### 🟢 Level 1: Classroom Outbreak (Easy)
- **Story:** Initial containment breach. Classroom 101 evacuated.
- **Infected:** 3 patrol zombies (slower walk `1.15`, chase speed `1.95`).
- **Vision:** Wide, bright flashlight beam (320px range).
- **Purge Timer:** 200 seconds (3m 20s).
- **Supplies:** 2 Health Kits available on the map.
- **Noise:** Forgiving sprint noise threshold (280px).

### 🟡 Level 2: The Blackout (Medium)
- **Story:** Backup generators fail. Sector plunges into emergency amber darkness.
- **Infected:** 5 aggressive zombies (faster walk `1.35`, chase speed `2.35`).
- **Vision:** Narrower flashlight cone (260px range).
- **Purge Timer:** 160 seconds (2m 40s).
- **Supplies:** 1 Health Kit in the Infirmary.
- **Noise:** Sensitive sprint noise threshold (380px).

### 🔴 Level 3: Quarantine Purge (Hard)
- **Story:** Total facility lockdown and decontamination purge active! Mutated abominations roam the sector.
- **Infected:** 7 lethal stalkers & berserkers (chase speed `2.70` — almost as fast as your sprint!).
- **Vision:** Short, flickering flashlight cone (220px range) and pulsing red sirens.
- **Purge Timer:** 120 seconds (2 minutes flat).
- **Supplies:** 1 Health Kit hidden in dangerous territory.
- **Noise:** Extreme noise sensitivity (460px — sprinting near the central hall alerts the entire horde!).

---

## 🎨 Animated Character Sprites

The character uses custom pixel-art animations sliced from your sprite sheet:
- **IDLE Animation:** 4-frame breathing cycle when standing still.
- **RUN Animation:** 6-frame running cycle that dynamically speeds up during sprinting.
- **HURT Animation:** 4-frame damage stagger and red flash when hit.
- **Directional Flip:** The character smoothly turns left or right based on mouse aiming.
- **Zero-CORS Embedded Assets:** All frames are stored in `assets/player_sprites.js` as base64 data URIs, ensuring 100% instant loading on any local browser without path errors.

---

## 🗺️ Campus Map

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
