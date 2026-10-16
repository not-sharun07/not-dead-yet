class_name Levels
extends RefCounted

const AssetMap = preload("res://scripts/asset_map.gd")

## Level definitions for NOT DEAD YET
## ASCII Grids:
## '#' = Wall (Two-tone campus wall: white upper band, yellow lower wainscot)
## '=' = Classroom Desk obstacle (Dark wood + steel frame, rows with walkable aisles)
## 'R' = Atrium Safety Railing (Black steel railing, impassable barrier)
## 'X' = Open Stairwell Hole / Void (Impassable opening dropping to ground floor)
## '.' = Classroom Floor (Cream ceramic tile)
## ',' = Corridor & Landing Floor (Grey terrazzo stone-chip)
## 'P' = Player Start
## 'K' = Keycard Pickup (Campus RFID access card)
## 'M' = Medkit Pickup (First Aid emergency kit)
## 'B' = Battery / Supply Pickup (Flashlight power cell)
## 'D' = Locked Door (Black institutional door, requires Keycard, interact with E)
## 'S' = Risky Shortcut Door (Black door with hazard stripe, opens without keycard, makes loud noise)
## 'E' = Extraction Point (Evacuation beacon, requires level keycards)
## 'I' = Infected Spawn Point

const LEVELS: Array[Dictionary] = [
	{
		"id": 1,
		"name": "LEVEL 1 - TUTORIAL: CLASSROOM & ATRIUM",
		"time_limit": 240.0,
		"required_keycards": 1,
		"loading_image": AssetMap.PATH_LOADING_CORRIDOR,
		"floor_color": Color(0.82, 0.79, 0.72, 1.0),
		"ambient_darkness": Color(0.08, 0.08, 0.12, 1.0),
		"grid": [
			"##########################",
			"#P.....#K#,,,,,,,,,,,,,,,#",
			"#..==..#.#,,,,,,,,,,,,,,,#",
			"#..==..#.#.RRRRRRRRRRRR..#",
			"#..==..#.#.RXXXXXXXXXXR..#",
			"#..==..#.#.RXXXXXXXXXXR..#",
			"#......#.#.RXXXXXXXXXXR..#",
			"#..==..#.#.RXXXXXXXXXXR..#",
			"#..==..#.#.RRRRRRRRRRRR..#",
			"#..==..#.#,,,,,,,,,,,,,,,#",
			"#..M...#.#.......I,,,,,,,#",
			"########.#####.###########",
			"######.......#,,,,,,,,,,,#",
			"######.......#.....I,,,,,#",
			"######...E...#D###########",
			"##########################"
		]
	},
	{
		"id": 2,
		"name": "LEVEL 2 - ACADEMIC BLOCK",
		"time_limit": 300.0,
		"required_keycards": 2,
		"loading_image": AssetMap.PATH_LOADING_ATRIUM,
		"floor_color": Color(0.22, 0.20, 0.24, 1.0),
		"ambient_darkness": Color(0.06, 0.06, 0.09, 1.0),
		"grid": [
			"################################",
			"#P.....#,,,,,,,,,,,,,,,,,,,,,,,#",
			"#..==..#,,,,,,,RRRRRRRRRR,,,,,,#",
			"#..==..#,,,,,,,RXXXXXXXXR,,,,,,#",
			"#......D,,,,,,,RXXXXXXXXR,,,,,,#",
			"#..==..#,,,,,,,RXXXXXXXXR,,,,,,#",
			"#..==..#,,,,,,,RRRRRRRRRR,,,,,,#",
			"#......#,,,,,,,,,,,,,,,,,,,,,,,#",
			"#..==..#,,,,,,,,,,,I,,,,,,,,,,,#",
			"#..K...#,,,,,,,,,,,,,,,,,,,,,,,#",
			"########,,,,,,,,################",
			"#,,,,,,,,,,,,,,,#..............#",
			"#,,,,,,,,,,,,,,,D..==..==..==..#",
			"#..####D########...............#",
			"#..#...M...#....#..==..==..==..#",
			"#..#.......#....#.......I......#",
			"#..#...E...S....#..==..==..==..#",
			"#..#.......#....#...........K..#",
			"#..#########....#..B...........#",
			"################################"
		]
	},
	{
		"id": 3,
		"name": "LEVEL 3 - LIBRARY AND PARKING LOT",
		"time_limit": 360.0,
		"required_keycards": 3,
		"floor_color": Color(0.13, 0.14, 0.17, 1.0),
		"ambient_darkness": Color(0.04, 0.04, 0.06, 1.0),
		"grid": [
			"##################################",
			"#P...#.#...#.#...#...#..K.#......#",
			"#....#.#...#.#...#...#....#......#",
			"#..B.#.#.I.#.#...#...#....#..I...#",
			"#....#.#...#.#.K.#...#....#......#",
			"#.####.#####.#####.###.##D######.#",
			"#........................#.....#.#",
			"#######.################.#..M..#.#",
			"#.....#.#..............#.#.....#.#",
			"#..M..#.#...######.###.#.#####D###",
			"#.....#.#...#....#...#.#.#.......#",
			"#.#####.#####..I.#.B.###.#..I....#",
			"#.......#........#.......#.......#",
			"#######.#.##############.#.#######",
			"#.......#.#..I.........#.#.#...K.#",
			"#.#######.#............#.#.#.....#",
			"#.........#.############.#.#..I..#",
			"###########..............#.......#",
			"###########...E...........#......#",
			"##################################"
		]
	}
]
