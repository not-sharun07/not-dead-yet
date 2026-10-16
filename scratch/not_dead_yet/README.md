# NOT DEAD YET — Campus Survival Horror MVP

A compact, atmospheric 3D first-person survival horror MVP developed for **Godot 4.3** (forward-compatible with any Godot 4.x version), written entirely in pure GDScript without binary files, external assets, or plugins.

---

## 1. How to Open and Run

1. **Launch Godot Engine** (Godot 4.3 or higher recommended).
2. In the Godot Project Manager, click **Import** (or **Scan**).
3. Browse to this project's folder:
   ```
   C:\Users\HP\.gemini\antigravity\scratch\not_dead_yet
   ```
4. Select `project.godot` and click **Import & Edit**.
5. Once the editor opens, press **F5** (or click the **Play** icon in the top right) to run the game!

> **Tip**: If you prefer running from the command line:
> ```bash
> godot --path "C:\Users\HP\.gemini\antigravity\scratch\not_dead_yet"
> ```

---

## 2. Controls

| Input | Action |
| :--- | :--- |
| **W, A, S, D** / Arrow Keys | Move Forward, Left, Backward, Right |
| **Shift** (Hold) | Sprint (drains stamina) |
| **F** | Toggle Flashlight on/off |
| **E** | Interact (pick up keycards, activate exit gate) |
| **Mouse Motion** | Look around (first-person pitch & yaw) |
| **Escape** | Toggle mouse cursor capture / release |
| **Left Click** | Recapture mouse cursor during gameplay |
| **Enter / Space** | Start game from Title Screen |
| **R** | Restart game from Game Over or Victory screens |

---

## 3. Game Objective

You awaken at night in a deserted, fog-covered university campus. An unknown infection has mutated everyone into feral creatures.
1. **Explore the Campus**: Search the **Academic Building** (Science Lab & Archives) and the **Parking Lot** (Security Guard Shack).
2. **Collect 3 Access Keycards**:
   - 🔷 **Science Lab Keycard**: Located on the main chemistry workbench in the west wing.
   - 🟨 **Archives Keycard**: Located on the executive desk inside the Dean's Office / Archives in the east wing.
   - 🟩 **Security Keycard**: Located on the console desk inside the Parking Lot security shack.
3. **Escape**: Once all 3 keycards are collected, head to the **South Perimeter Security Gate** (flashing green) and press **[E]** (or walk through) to escape alive!

---

## 4. How to Tweak Difficulty (Configuration)

All key gameplay parameters are centralized in a single file:  
[`res://scripts/config.gd`](scripts/config.gd).

Open [`scripts/config.gd`](scripts/config.gd) to tweak any of the following:

```gdscript
# --- Player Configuration ---
const PLAYER_MAX_HEALTH: float = 100.0         # Starting and maximum player health
const PLAYER_WALK_SPEED: float = 4.6           # Normal movement speed
const PLAYER_SPRINT_SPEED: float = 8.2         # Sprint movement speed
const PLAYER_STAMINA_DRAIN: float = 26.0       # Stamina drained per second sprinting
const PLAYER_STAMINA_RECOVERY: float = 18.0    # Stamina recovered per second

# --- Enemy / Infected Configuration ---
const ENEMY_COUNT: int = 6                     # Number of infected spawned across campus (5 to 8)
const ENEMY_WALK_SPEED: float = 2.4            # Wandering / patrolling speed
const ENEMY_CHASE_SPEED: float = 6.6           # Chase speed (faster than walk, slower than sprint)
const ENEMY_DETECT_RANGE: float = 19.0         # Line of sight detection range in meters
const ENEMY_HEAR_RANGE: float = 8.5            # Proximity hearing range through walls
const ENEMY_DAMAGE: float = 25.0               # Damage inflicted per melee strike
const ENEMY_ATTACK_COOLDOWN: float = 1.25      # Delay between enemy attacks in seconds

# --- Objective Configuration ---
const TOTAL_KEYCARDS: int = 3                  # Total keycards required to unlock exit
```

---

## 5. Architecture & Project Structure

```
not_dead_yet/
├── project.godot            # Godot 4 project configuration, input actions, display
├── icon.svg                 # Text-based SVG project icon
├── README.md                # Project documentation and guide
├── scenes/
│   ├── main.tscn            # Main entry scene (Node3D)
│   ├── player.tscn          # Player CharacterBody3D with camera, flashlight & raycast
│   ├── infected.tscn        # Infected CharacterBody3D collision shape & AI
│   └── hud.tscn             # CanvasLayer HUD root
└── scripts/
    ├── config.gd            # Centralized balance configuration
    ├── main.gd              # Master game manager & lifecycle controller
    ├── level_builder.gd     # Procedural campus generator (primitives, walls, props)
    ├── player.gd            # FPS movement, stamina, mouse capture & interaction
    ├── infected.gd          # Enemy AI (idle, wander, raycast line-of-sight chase, melee)
    ├── keycard.gd           # Glowing pickup with hover/spin & interaction logic
    ├── exit_gate.gd         # Security checkpoint with LED status & escape trigger
    ├── hud.gd               # CanvasLayer UI, health/stamina bars, horror vignette shader
    └── flicker_light.gd     # Hallway flickering fluorescent lighting simulation
```

---

## 6. Known Limitations

1. **Procedural Primitive Visuals**: In adherence to the hard requirement of zero external 3D models or binary texture assets, all geometry (buildings, vehicles, trees, benches, and infected enemies) is synthesized from 3D primitives (`BoxMesh`, `CylinderMesh`, `CapsuleMesh`, `SphereMesh`) and PBR materials (`StandardMaterial3D`).
2. **AI Steering vs Baked NavMesh**: To prevent bake-time errors and ensure 100% immediate out-of-the-box playability without external `.navmesh` caches, the infected utilize direct vector chasing with dynamic left/right whisker obstacle avoidance and physics line-of-sight raycasting. While highly effective in this compact campus layout, enemies may briefly scrape corners if chasing past complex furniture.
3. **Procedural Audio**: External audio files (`.wav`, `.ogg`, `.mp3`) were intentionally excluded to satisfy the zero external file and zero import requirement. Horror atmosphere is communicated visually through flickering lights, atmospheric volumetric fog, a red health vignette, and an accelerated heartbeat pulsing vignette.
