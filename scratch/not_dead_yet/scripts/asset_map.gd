class_name AssetMap
extends RefCounted

## Central asset mapping for NOT DEAD YET
## All texture and audio paths, scale multipliers, and fallback configurations live here.

const TILE_SIZE: float = 64.0

# Texture asset paths (change these to point to your files in res://assets/)
const PATH_PLAYER: String = "res://assets/player/idle_0.png"
const PATH_PLAYER_RUN: String = "res://assets/player/run_0.png"
const PATH_PLAYER_HURT: String = "res://assets/player/hurt_0.png"
const PATH_INFECTED: String = "res://assets/infected.png"
const PATH_WALL: String = "res://assets/wall.png"
const PATH_FLOOR: String = "res://assets/floor.png"
const PATH_DOOR: String = "res://assets/door.png"
const PATH_DOOR_SHORTCUT: String = "res://assets/door_shortcut.png"
const PATH_KEYCARD: String = "res://assets/keycard.png"
const PATH_MEDKIT: String = "res://assets/medkit.png"
const PATH_BATTERY: String = "res://assets/battery.png"
const PATH_EXTRACTION: String = "res://assets/extraction.png"

# Campus Photo Maps & Floor Textures (First-Person Photos & Seamless Crops)
const PATH_MAP_LANDING_CORRIDOR: String = "res://assets/maps/landing_terrazzo_corridor.jpg"
const PATH_MAP_UPPER_ATRIUM: String = "res://assets/maps/upper_landing_atrium.jpg"
const PATH_MAP_CLASSROOM_A: String = "res://assets/maps/classroom_a_desks.jpg"
const PATH_MAP_CLASSROOM_B: String = "res://assets/maps/classroom_b_desks.jpg"
const PATH_FLOOR_TERRAZZO: String = "res://assets/maps/floor_terrazzo.png"
const PATH_FLOOR_CLASSROOM: String = "res://assets/maps/floor_classroom.png"
const PATH_LOADING_ATRIUM: String = "res://assets/maps/loading_atrium.jpg"
const PATH_LOADING_CORRIDOR: String = "res://assets/maps/loading_corridor.jpg"

# Audio asset paths
const PATH_AUDIO_FOOTSTEP: String = "res://assets/audio/footstep.wav"
const PATH_AUDIO_PICKUP: String = "res://assets/audio/pickup.wav"
const PATH_AUDIO_DOOR: String = "res://assets/audio/door.wav"
const PATH_AUDIO_GROAN: String = "res://assets/audio/groan.wav"
const PATH_AUDIO_AMBIENCE: String = "res://assets/audio/ambience.ogg"
const PATH_AUDIO_HURT: String = "res://assets/audio/hurt.wav"

# Visual scale factors (tweak to adjust sprite sizing relative to 64x64 tiles)
const SCALE_PLAYER: Vector2 = Vector2(0.28, 0.28)
const SCALE_INFECTED: Vector2 = Vector2(1.0, 1.0)
const SCALE_WALL: Vector2 = Vector2(1.0, 1.0)
const SCALE_FLOOR: Vector2 = Vector2(1.0, 1.0)
const SCALE_DOOR: Vector2 = Vector2(1.0, 1.0)
const SCALE_KEYCARD: Vector2 = Vector2(1.0, 1.0)
const SCALE_MEDKIT: Vector2 = Vector2(1.0, 1.0)
const SCALE_BATTERY: Vector2 = Vector2(1.0, 1.0)
const SCALE_EXTRACTION: Vector2 = Vector2(1.0, 1.0)

# Campus Color Palette (modeled after real university photos)
const COLOR_PLAYER: Color = Color(0.25, 0.65, 0.95, 1.0)        # Survivor Blue
const COLOR_INFECTED: Color = Color(0.85, 0.15, 0.15, 1.0)      # Crimson Red
const COLOR_WALL_UPPER: Color = Color(0.92, 0.91, 0.88, 1.0)    # Campus Off-White
const COLOR_WALL_LOWER: Color = Color(0.86, 0.80, 0.58, 1.0)    # Institutional Yellow/Ochre Wainscot
const COLOR_WALL_BORDER: Color = Color(0.22, 0.24, 0.28, 1.0)   # Dark trim
const COLOR_FLOOR_CLASSROOM: Color = Color(0.82, 0.79, 0.72, 1.0) # Light Beige Classroom Ceramic Tile
const COLOR_FLOOR_TERRAZZO: Color = Color(0.25, 0.27, 0.26, 1.0)  # Dark Terrazzo Mosaic Corridor
const COLOR_RAILING: Color = Color(0.12, 0.12, 0.14, 1.0)        # Black Atrium Steel Railing
const COLOR_DESK_WOOD: Color = Color(0.28, 0.18, 0.14, 1.0)      # University Walnut Wooden Desk
const COLOR_DESK_FRAME: Color = Color(0.42, 0.45, 0.48, 1.0)     # Desk Metal Legs
const COLOR_DOOR_LOCKED: Color = Color(0.88, 0.52, 0.12, 1.0)    # Heavy Security Gate Amber
const COLOR_DOOR_OPEN: Color = Color(0.2, 0.75, 0.35, 0.4)       # Translucent Green Open
const COLOR_SHORTCUT: Color = Color(0.88, 0.22, 0.62, 1.0)       # Risky Shortcut Magenta
const COLOR_KEYCARD: Color = Color(0.96, 0.86, 0.22, 1.0)       # Golden Campus RFID Card
const COLOR_MEDKIT: Color = Color(0.22, 0.88, 0.44, 1.0)        # First Aid Emerald
const COLOR_BATTERY: Color = Color(0.22, 0.85, 1.0, 1.0)        # Flashlight Battery Cyan
const COLOR_EXTRACTION: Color = Color(0.12, 0.95, 0.65, 1.0)    # Evacuation Beacon Mint

static var _cached_textures: Dictionary = {}
static var _cached_audio: Dictionary = {}

static func load_texture_safe(path: String) -> Texture2D:
	if path in _cached_textures:
		return _cached_textures[path]
	
	var tex: Texture2D = null
	if ResourceLoader.exists(path):
		var res = ResourceLoader.load(path)
		if res is Texture2D:
			tex = res
	
	if tex == null and FileAccess.file_exists(path):
		var img = Image.load_from_file(path)
		if img != null:
			tex = ImageTexture.create_from_image(img)
	
	_cached_textures[path] = tex
	return tex

static func load_audio_safe(path: String) -> AudioStream:
	if path in _cached_audio:
		return _cached_audio[path]
	
	var stream: AudioStream = null
	if ResourceLoader.exists(path):
		var res = ResourceLoader.load(path)
		if res is AudioStream:
			stream = res
	
	_cached_audio[path] = stream
	return stream

## Build a visual representation for an object type.
## If the asset exists, returns a Sprite2D. If not, returns a styled placeholder Node2D.
static func create_visual(type_name: String, parent: Node2D = null, grid_pos: Vector2 = Vector2.ZERO) -> Node2D:
	var container = Node2D.new()
	container.name = "Visual"
	
	match type_name:
		"player":
			var tex = load_texture_safe(PATH_PLAYER)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.scale = SCALE_PLAYER
				container.add_child(spr)
			else:
				var poly = Polygon2D.new()
				poly.name = "Placeholder"
				var points = PackedVector2Array()
				for i in range(16):
					var angle = i * TAU / 16.0
					points.append(Vector2(cos(angle), sin(angle)) * 20.0)
				poly.polygon = points
				poly.color = COLOR_PLAYER
				container.add_child(poly)
				
				# Flashlight direction pointer
				var beak = Polygon2D.new()
				beak.polygon = PackedVector2Array([
					Vector2(12, -7),
					Vector2(24, 0),
					Vector2(12, 7)
				])
				beak.color = Color(1.0, 1.0, 1.0, 0.95)
				container.add_child(beak)
				
				# Student backpack/vest
				var vest = Polygon2D.new()
				var vest_pts = PackedVector2Array()
				for i in range(12):
					var angle = i * TAU / 12.0
					vest_pts.append(Vector2(cos(angle), sin(angle)) * 11.0)
				vest.polygon = vest_pts
				vest.color = Color(0.12, 0.32, 0.52, 1.0)
				container.add_child(vest)
				
		"infected":
			var tex = load_texture_safe(PATH_INFECTED)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.scale = SCALE_INFECTED
				container.add_child(spr)
			else:
				var poly = Polygon2D.new()
				poly.name = "Placeholder"
				var points = PackedVector2Array()
				for i in range(16):
					var angle = i * TAU / 16.0
					var r = 21.0 if (i % 2 == 0) else 17.0
					points.append(Vector2(cos(angle), sin(angle)) * r)
				poly.polygon = points
				poly.color = COLOR_INFECTED
				container.add_child(poly)
				
				# Menacing glowing eyes
				var eye1 = Polygon2D.new()
				eye1.polygon = PackedVector2Array([Vector2(6, -7), Vector2(12, -5), Vector2(10, -9)])
				eye1.color = Color(1.0, 0.9, 0.1, 1.0)
				container.add_child(eye1)
				
				var eye2 = Polygon2D.new()
				eye2.polygon = PackedVector2Array([Vector2(6, 7), Vector2(12, 5), Vector2(10, 9)])
				eye2.color = Color(1.0, 0.9, 0.1, 1.0)
				container.add_child(eye2)
				
		"wall":
			var tex = load_texture_safe(PATH_WALL)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.scale = SCALE_WALL
				container.add_child(spr)
			else:
				# Two-tone campus wall matching photos: white upper, cream/yellow lower wainscot
				var base = ColorRect.new()
				base.name = "Placeholder"
				base.size = Vector2(TILE_SIZE, TILE_SIZE)
				base.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
				base.color = COLOR_WALL_BORDER
				container.add_child(base)
				
				var upper = ColorRect.new()
				upper.size = Vector2(TILE_SIZE - 4, (TILE_SIZE - 4) * 0.5)
				upper.position = Vector2(-(TILE_SIZE - 4) * 0.5, -(TILE_SIZE - 4) * 0.5)
				upper.color = COLOR_WALL_UPPER
				container.add_child(upper)
				
				var lower = ColorRect.new()
				lower.size = Vector2(TILE_SIZE - 4, (TILE_SIZE - 4) * 0.5)
				lower.position = Vector2(-(TILE_SIZE - 4) * 0.5, 0)
				lower.color = COLOR_WALL_LOWER
				container.add_child(lower)
				
		"desk":
			# Classroom desk bench matching Photo 3 & 4: dark wooden top, steel legs
			var frame = ColorRect.new()
			frame.name = "DeskFrame"
			frame.size = Vector2(56, 44)
			frame.position = Vector2(-28, -22)
			frame.color = COLOR_DESK_FRAME
			container.add_child(frame)
			
			var wood_top = ColorRect.new()
			wood_top.name = "WoodTop"
			wood_top.size = Vector2(52, 24)
			wood_top.position = Vector2(-26, -20)
			wood_top.color = COLOR_DESK_WOOD
			container.add_child(wood_top)
			
			var seat = ColorRect.new()
			seat.name = "DeskSeat"
			seat.size = Vector2(52, 12)
			seat.position = Vector2(-26, 8)
			seat.color = COLOR_DESK_WOOD * 0.85
			container.add_child(seat)
			
		"railing":
			# Black steel atrium safety railing matching Photo 1 & 2
			var bg = ColorRect.new()
			bg.size = Vector2(TILE_SIZE, TILE_SIZE)
			bg.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
			bg.color = Color(0.08, 0.08, 0.1, 0.4) # slight dark shadow drop
			container.add_child(bg)
			
			# Horizontal rails
			for y_off in [-18, -6, 6, 18]:
				var rail = ColorRect.new()
				rail.size = Vector2(TILE_SIZE, 4)
				rail.position = Vector2(-TILE_SIZE * 0.5, y_off)
				rail.color = COLOR_RAILING
				container.add_child(rail)
			
			# Vertical posts
			for x_off in [-20, 0, 20]:
				var post = ColorRect.new()
				post.size = Vector2(6, TILE_SIZE)
				post.position = Vector2(x_off - 3, -TILE_SIZE * 0.5)
				post.color = COLOR_RAILING
				container.add_child(post)
				
		"floor_classroom":
			var tex = load_texture_safe(PATH_FLOOR_CLASSROOM)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.region_enabled = true
				spr.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
				var ox = int(abs(grid_pos.x) * TILE_SIZE) % 256
				var oy = int(abs(grid_pos.y) * TILE_SIZE) % 256
				spr.region_rect = Rect2(ox, oy, TILE_SIZE, TILE_SIZE)
				# Cream tile tint with horror atmospheric grading
				spr.modulate = Color(0.85, 0.83, 0.77, 1.0)
				container.add_child(spr)
			else:
				var rect = ColorRect.new()
				rect.name = "Placeholder"
				rect.size = Vector2(TILE_SIZE, TILE_SIZE)
				rect.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
				rect.color = COLOR_FLOOR_CLASSROOM
				container.add_child(rect)
				
				# Subtle light tile border
				var line = Line2D.new()
				line.width = 1.0
				line.default_color = Color(0.72, 0.69, 0.63, 0.5)
				line.points = PackedVector2Array([
					Vector2(-TILE_SIZE * 0.5, TILE_SIZE * 0.5),
					Vector2(TILE_SIZE * 0.5, TILE_SIZE * 0.5),
					Vector2(TILE_SIZE * 0.5, -TILE_SIZE * 0.5)
				])
				container.add_child(line)
				
		"floor_terrazzo":
			var tex = load_texture_safe(PATH_FLOOR_TERRAZZO)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.region_enabled = true
				spr.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
				var ox = int(abs(grid_pos.x) * TILE_SIZE) % 256
				var oy = int(abs(grid_pos.y) * TILE_SIZE) % 256
				spr.region_rect = Rect2(ox, oy, TILE_SIZE, TILE_SIZE)
				# Grey terrazzo tint with horror atmospheric grading
				spr.modulate = Color(0.78, 0.80, 0.79, 1.0)
				container.add_child(spr)
			else:
				var rect = ColorRect.new()
				rect.name = "Placeholder"
				rect.size = Vector2(TILE_SIZE, TILE_SIZE)
				rect.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
				rect.color = COLOR_FLOOR_TERRAZZO
				container.add_child(rect)
				
				# Mosaic terrazzo chips/flecks
				var flecks = Polygon2D.new()
				flecks.polygon = PackedVector2Array([
					Vector2(-18, -14), Vector2(-12, -18), Vector2(-8, -10),
					Vector2(10, -16), Vector2(16, -10), Vector2(6, -6),
					Vector2(-14, 12), Vector2(-6, 18), Vector2(-2, 8),
					Vector2(12, 14), Vector2(18, 6), Vector2(8, 8)
				])
				flecks.color = Color(0.38, 0.42, 0.40, 0.6)
				container.add_child(flecks)
				
				var dark_flecks = Polygon2D.new()
				dark_flecks.polygon = PackedVector2Array([
					Vector2(-4, -8), Vector2(0, -12), Vector2(2, -4),
					Vector2(-10, 4), Vector2(-4, 0), Vector2(-8, -2),
					Vector2(14, 0), Vector2(18, -4), Vector2(16, 4)
				])
				dark_flecks.color = Color(0.14, 0.15, 0.14, 0.8)
				container.add_child(dark_flecks)
				
		"floor":
			var tex = load_texture_safe(PATH_FLOOR)
			if tex == null:
				tex = load_texture_safe(PATH_FLOOR_TERRAZZO)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.region_enabled = true
				spr.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
				var ox = int(abs(grid_pos.x) * TILE_SIZE) % 256
				var oy = int(abs(grid_pos.y) * TILE_SIZE) % 256
				spr.region_rect = Rect2(ox, oy, TILE_SIZE, TILE_SIZE)
				spr.modulate = Color(0.80, 0.80, 0.80, 1.0)
				container.add_child(spr)
			else:
				var rect = ColorRect.new()
				rect.name = "Placeholder"
				rect.size = Vector2(TILE_SIZE, TILE_SIZE)
				rect.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
				rect.color = COLOR_FLOOR_TERRAZZO
				container.add_child(rect)

		"stairwell_hole":
			# Deep dark drop / open stairwell hole matching upper_landing_atrium.jpg
			var pit = ColorRect.new()
			pit.name = "StairwellPit"
			pit.size = Vector2(TILE_SIZE, TILE_SIZE)
			pit.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
			pit.color = Color(0.015, 0.015, 0.02, 1.0) # Deep dark abyss
			container.add_child(pit)
			
			# Receding stairs lines visible down into the lower level
			for i in range(4):
				var step = ColorRect.new()
				step.size = Vector2(TILE_SIZE - 6, 3)
				step.position = Vector2(-(TILE_SIZE - 6) * 0.5, -20 + i * 12)
				var alpha = 0.22 - i * 0.05
				step.color = Color(0.24, 0.26, 0.28, alpha)
				container.add_child(step)
				
		"keycard":
			var tex = load_texture_safe(PATH_KEYCARD)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.scale = SCALE_KEYCARD
				container.add_child(spr)
			else:
				var card = ColorRect.new()
				card.name = "Placeholder"
				card.size = Vector2(28, 18)
				card.position = Vector2(-14, -9)
				card.color = COLOR_KEYCARD
				container.add_child(card)
				
				var stripe = ColorRect.new()
				stripe.size = Vector2(6, 18)
				stripe.position = Vector2(-11, -9)
				stripe.color = Color(0.15, 0.15, 0.15, 0.8)
				container.add_child(stripe)
				
				var chip = ColorRect.new()
				chip.size = Vector2(7, 7)
				chip.position = Vector2(2, -3)
				chip.color = Color(0.9, 0.95, 1.0, 0.95)
				container.add_child(chip)
				
		"medkit":
			var tex = load_texture_safe(PATH_MEDKIT)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.scale = SCALE_MEDKIT
				container.add_child(spr)
			else:
				var case = ColorRect.new()
				case.name = "Placeholder"
				case.size = Vector2(28, 22)
				case.position = Vector2(-14, -11)
				case.color = Color(0.95, 0.95, 0.95, 1.0)
				container.add_child(case)
				
				var h_cross = ColorRect.new()
				h_cross.size = Vector2(16, 6)
				h_cross.position = Vector2(-8, -3)
				h_cross.color = COLOR_MEDKIT
				container.add_child(h_cross)
				
				var v_cross = ColorRect.new()
				v_cross.size = Vector2(6, 16)
				v_cross.position = Vector2(-3, -8)
				v_cross.color = COLOR_MEDKIT
				container.add_child(v_cross)
				
		"battery":
			var tex = load_texture_safe(PATH_BATTERY)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.scale = SCALE_BATTERY
				container.add_child(spr)
			else:
				var body = ColorRect.new()
				body.name = "Placeholder"
				body.size = Vector2(18, 26)
				body.position = Vector2(-9, -12)
				body.color = COLOR_BATTERY
				container.add_child(body)
				
				var cap = ColorRect.new()
				cap.size = Vector2(8, 4)
				cap.position = Vector2(-4, -16)
				cap.color = Color(0.95, 0.95, 0.95, 1.0)
				container.add_child(cap)
				
				var band = ColorRect.new()
				band.size = Vector2(18, 5)
				band.position = Vector2(-9, 0)
				band.color = Color(0.1, 0.2, 0.3, 0.8)
				container.add_child(band)
				
		"door":
			var tex = load_texture_safe(PATH_DOOR)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.scale = SCALE_DOOR
				container.add_child(spr)
			else:
				# Black institutional door matching campus photos
				var frame = ColorRect.new()
				frame.name = "Placeholder"
				frame.size = Vector2(TILE_SIZE, TILE_SIZE)
				frame.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
				frame.color = Color(0.12, 0.13, 0.15, 1.0)
				container.add_child(frame)
				
				# Door panel border
				var border = ColorRect.new()
				border.size = Vector2(TILE_SIZE - 4, TILE_SIZE - 4)
				border.position = Vector2(-(TILE_SIZE - 4) * 0.5, -(TILE_SIZE - 4) * 0.5)
				border.color = Color(0.18, 0.19, 0.22, 1.0)
				container.add_child(border)
				
				# Vision cutout window matching photo
				var window = ColorRect.new()
				window.size = Vector2(16, 26)
				window.position = Vector2(-8, -16)
				window.color = Color(0.08, 0.14, 0.18, 0.85)
				container.add_child(window)
				
				# Locked indicator / RFID reader
				var lock_icon = ColorRect.new()
				lock_icon.name = "LockIcon"
				lock_icon.size = Vector2(10, 14)
				lock_icon.position = Vector2(12, -2)
				lock_icon.color = COLOR_DOOR_LOCKED
				container.add_child(lock_icon)
				
		"door_shortcut":
			var tex = load_texture_safe(PATH_DOOR_SHORTCUT)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.scale = SCALE_DOOR
				container.add_child(spr)
			else:
				var frame = ColorRect.new()
				frame.name = "Placeholder"
				frame.size = Vector2(TILE_SIZE, TILE_SIZE)
				frame.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
				frame.color = COLOR_SHORTCUT
				container.add_child(frame)
				
				var stripe = ColorRect.new()
				stripe.size = Vector2(44, 12)
				stripe.position = Vector2(-22, -6)
				stripe.color = Color(0.1, 0.1, 0.1, 0.85)
				container.add_child(stripe)
				
		"extraction":
			var tex = load_texture_safe(PATH_EXTRACTION)
			if tex != null:
				var spr = Sprite2D.new()
				spr.name = "Sprite"
				spr.texture = tex
				spr.scale = SCALE_EXTRACTION
				container.add_child(spr)
			else:
				var pad = ColorRect.new()
				pad.name = "Placeholder"
				pad.size = Vector2(TILE_SIZE, TILE_SIZE)
				pad.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
				pad.color = Color(0.08, 0.35, 0.25, 0.7)
				container.add_child(pad)
				
				var ring = Polygon2D.new()
				ring.name = "BeaconRing"
				var points = PackedVector2Array()
				for i in range(16):
					var angle = i * TAU / 16.0
					points.append(Vector2(cos(angle), sin(angle)) * 24.0)
				ring.polygon = points
				ring.color = COLOR_EXTRACTION
				container.add_child(ring)
				
				var inner = Polygon2D.new()
				var inner_points = PackedVector2Array()
				for i in range(16):
					var angle = i * TAU / 16.0
					inner_points.append(Vector2(cos(angle), sin(angle)) * 17.0)
				inner.polygon = inner_points
				inner.color = Color(0.05, 0.22, 0.16, 0.9)
				container.add_child(inner)
	
	if parent != null:
		parent.add_child(container)
	return container
