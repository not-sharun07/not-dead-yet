class_name Main
extends Node2D

var current_level_index: int = 0
var level_timer: float = 240.0
var level_active: bool = false
var required_keycards: int = 1

# Node containers
var world_node: Node2D = null
var canvas_modulate: CanvasModulate = null
var hud_node: HUD = null
var ambience_player: AudioStreamPlayer = null

var player_instance: Player = null
var infected_list: Array[Infected] = []
var keycard_pickups: Array[Area2D] = []
var extraction_instance: Area2D = null

var player_scene: PackedScene = null
var infected_scene: PackedScene = null
var hud_scene: PackedScene = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	
	# Preload scenes safely
	if ResourceLoader.exists("res://scenes/player.tscn"):
		player_scene = load("res://scenes/player.tscn")
	if ResourceLoader.exists("res://scenes/infected.tscn"):
		infected_scene = load("res://scenes/infected.tscn")
	if ResourceLoader.exists("res://scenes/hud.tscn"):
		hud_scene = load("res://scenes/hud.tscn")
	
	# Canvas Modulate for Darkness
	canvas_modulate = CanvasModulate.new()
	canvas_modulate.name = "AmbientDarkness"
	canvas_modulate.color = Color(0.08, 0.08, 0.12, 1.0)
	add_child(canvas_modulate)
	
	# World Node container
	world_node = Node2D.new()
	world_node.name = "World"
	add_child(world_node)
	
	# HUD Setup
	if hud_scene != null:
		hud_node = hud_scene.instantiate()
	else:
		hud_node = HUD.new()
	add_child(hud_node)
	
	hud_node.start_game_requested.connect(_on_start_game)
	hud_node.restart_requested.connect(_on_restart_level)
	hud_node.next_level_requested.connect(_on_next_level)
	hud_node.title_requested.connect(_on_return_to_title)
	
	# Ambient audio
	var amb_stream = AssetMap.load_audio_safe(AssetMap.PATH_AUDIO_AMBIENCE)
	if amb_stream != null:
		ambience_player = AudioStreamPlayer.new()
		ambience_player.stream = amb_stream
		ambience_player.volume_db = -10.0
		add_child(ambience_player)
		ambience_player.play()

func _on_start_game() -> void:
	current_level_index = 0
	load_level(current_level_index)

func _on_restart_level() -> void:
	load_level(current_level_index)

func _on_next_level() -> void:
	current_level_index += 1
	if current_level_index >= Levels.LEVELS.size():
		hud_node.show_screen(HUD.ScreenState.VICTORY)
	else:
		load_level(current_level_index)

func _on_return_to_title() -> void:
	_clear_world()
	level_active = false
	hud_node.show_screen(HUD.ScreenState.TITLE)

func _clear_world() -> void:
	infected_list.clear()
	keycard_pickups.clear()
	extraction_instance = null
	player_instance = null
	
	for child in world_node.get_children():
		child.queue_free()

func load_level(idx: int) -> void:
	_clear_world()
	
	if idx < 0 or idx >= Levels.LEVELS.size():
		return
	
	var data = Levels.LEVELS[idx]
	var grid: Array = data["grid"]
	level_timer = data.get("time_limit", 240.0)
	required_keycards = data.get("required_keycards", 1)
	
	# Set ambient darkness for level
	var amb_color = data.get("ambient_darkness", Color(0.08, 0.08, 0.12, 1.0))
	canvas_modulate.color = amb_color
	
	# 1. First pass: Floors
	var floor_container = Node2D.new()
	floor_container.name = "Floors"
	world_node.add_child(floor_container)
	
	var h = grid.size()
	for y in range(h):
		var row: String = grid[y]
		var w = row.length()
		for x in range(w):
			var ch = row[x]
			if ch != " ":
				var pos = Vector2(x * AssetMap.TILE_SIZE + AssetMap.TILE_SIZE * 0.5, y * AssetMap.TILE_SIZE + AssetMap.TILE_SIZE * 0.5)
				var tile_coord = Vector2(x, y)
				var floor_type = "floor"
				
				if ch == "X":
					# Open stairwell hole: no walkable floor underneath
					continue
				elif ch == "," or ch == "R":
					floor_type = "floor_terrazzo"
				elif ch == "=":
					floor_type = "floor_classroom"
				elif idx == 0:
					# Level 1: Classroom on left, Terrazzo Landing/Atrium on right
					floor_type = "floor_classroom" if x <= 8 else "floor_terrazzo"
				elif idx == 1:
					# Level 2 (Academic Block): Classroom A on left, Classroom B on bottom right,
					# Corridors and Landing/Atrium are grey terrazzo
					if (x >= 1 and x <= 8 and y >= 1 and y <= 9) or (x >= 15 and x <= 30 and y >= 11 and y <= 18):
						floor_type = "floor_classroom"
					else:
						floor_type = "floor_terrazzo"
				else:
					floor_type = "floor"
				
				var f = AssetMap.create_visual(floor_type, floor_container, tile_coord)
				f.position = pos
	
	# 2. Second pass: Structures, Objects, Player, Enemies
	var struct_container = Node2D.new()
	struct_container.name = "Structures"
	world_node.add_child(struct_container)
	
	var items_container = Node2D.new()
	items_container.name = "Items"
	world_node.add_child(items_container)
	
	var player_spawn_pos = Vector2(100, 100)
	
	for y in range(h):
		var row: String = grid[y]
		var w = row.length()
		for x in range(w):
			var ch = row[x]
			var pos = Vector2(x * AssetMap.TILE_SIZE + AssetMap.TILE_SIZE * 0.5, y * AssetMap.TILE_SIZE + AssetMap.TILE_SIZE * 0.5)
			
			match ch:
				"#":
					_spawn_wall(pos, struct_container)
				"=":
					# Classroom desk bench from photo
					_spawn_desk(pos, struct_container)
				"R":
					# Atrium safety railing from photo
					_spawn_railing(pos, struct_container)
				"X":
					# Open stairwell hole / void from atrium photo (blocked / impassable drop)
					_spawn_stairwell_hole(pos, struct_container)
				"P":
					player_spawn_pos = pos
				"K":
					_spawn_pickup(pos, Interactables.PickupItem.Type.KEYCARD, items_container)
				"M":
					_spawn_pickup(pos, Interactables.PickupItem.Type.MEDKIT, items_container)
				"B":
					_spawn_pickup(pos, Interactables.PickupItem.Type.BATTERY, items_container)
				"D":
					_spawn_door(pos, false, struct_container)
				"S":
					_spawn_door(pos, true, struct_container)
				"E":
					_spawn_extraction(pos, required_keycards, struct_container)
				"I":
					_spawn_infected(pos, world_node)
	
	# 3. Spawn Player
	_spawn_player(player_spawn_pos, world_node)
	
	# Set player reference to all infected
	for inf in infected_list:
		inf.set_player(player_instance)
	
	# Connect extraction
	if extraction_instance is Interactables.ExtractionZone:
		(extraction_instance as Interactables.ExtractionZone).player_extracted.connect(_on_extraction_complete)
	
	# Initialize HUD & show loading screen with darkened campus photo background
	hud_node.set_player(player_instance)
	hud_node.update_level_info(data["name"], required_keycards, player_instance.keycards)
	hud_node.update_timer(level_timer)
	hud_node.show_loading(idx, data)
	
	level_active = true
	
	# Show Level Title Announcement
	_display_level_title_banner(data["name"])

func _display_level_title_banner(title_text: String) -> void:
	var banner = Label.new()
	banner.name = "LevelBanner"
	banner.text = title_text
	banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	banner.add_theme_font_size_override("font_size", 28)
	banner.add_theme_color_override("font_color", Color(1.0, 0.95, 0.8))
	banner.position = Vector2(0, 200)
	banner.size = Vector2(1280, 60)
	hud_node.add_child(banner)
	
	var tween = create_tween()
	tween.tween_property(banner, "modulate:a", 1.0, 0.4)
	tween.tween_interval(2.2)
	tween.tween_property(banner, "modulate:a", 0.0, 0.8)
	tween.tween_callback(banner.queue_free)

func _spawn_wall(pos: Vector2, parent: Node2D) -> void:
	var sb = StaticBody2D.new()
	sb.position = pos
	sb.collision_layer = 1
	sb.collision_mask = 2 | 8
	
	var col = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = Vector2(AssetMap.TILE_SIZE, AssetMap.TILE_SIZE)
	col.shape = shape
	sb.add_child(col)
	
	AssetMap.create_visual("wall", sb)
	parent.add_child(sb)

func _spawn_desk(pos: Vector2, parent: Node2D) -> void:
	var sb = StaticBody2D.new()
	sb.position = pos
	sb.collision_layer = 1
	sb.collision_mask = 2 | 8
	
	var col = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = Vector2(56, 42)
	col.shape = shape
	sb.add_child(col)
	
	AssetMap.create_visual("desk", sb)
	parent.add_child(sb)

func _spawn_railing(pos: Vector2, parent: Node2D) -> void:
	var sb = StaticBody2D.new()
	sb.position = pos
	sb.collision_layer = 1
	sb.collision_mask = 2 | 8
	
	var col = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = Vector2(AssetMap.TILE_SIZE, AssetMap.TILE_SIZE)
	col.shape = shape
	sb.add_child(col)
	
	AssetMap.create_visual("railing", sb)
	parent.add_child(sb)

func _spawn_stairwell_hole(pos: Vector2, parent: Node2D) -> void:
	var sb = StaticBody2D.new()
	sb.position = pos
	sb.collision_layer = 1
	sb.collision_mask = 2 | 8 # Impassable drop: blocks player and infected
	
	var col = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = Vector2(AssetMap.TILE_SIZE, AssetMap.TILE_SIZE)
	col.shape = shape
	sb.add_child(col)
	
	AssetMap.create_visual("stairwell_hole", sb)
	parent.add_child(sb)

func _spawn_door(pos: Vector2, is_shortcut: bool, parent: Node2D) -> void:
	var door = Interactables.DoorNode.new(is_shortcut)
	door.position = pos
	parent.add_child(door)

func _spawn_extraction(pos: Vector2, req_cards: int, parent: Node2D) -> void:
	var ext = Interactables.ExtractionZone.new(req_cards)
	ext.position = pos
	parent.add_child(ext)
	extraction_instance = ext

func _spawn_pickup(pos: Vector2, type: Interactables.PickupItem.Type, parent: Node2D) -> void:
	var item = Interactables.PickupItem.new(type)
	item.position = pos
	parent.add_child(item)
	if type == Interactables.PickupItem.Type.KEYCARD:
		keycard_pickups.append(item)

func _spawn_infected(pos: Vector2, parent: Node2D) -> void:
	var inf: Infected = null
	if infected_scene != null:
		inf = infected_scene.instantiate()
	else:
		inf = Infected.new()
		var col = CollisionShape2D.new()
		var shape = CircleShape2D.new()
		shape.radius = 20.0
		col.shape = shape
		inf.add_child(col)
	
	inf.position = pos
	parent.add_child(inf)
	infected_list.append(inf)

func _spawn_player(pos: Vector2, parent: Node2D) -> void:
	if player_scene != null:
		player_instance = player_scene.instantiate()
	else:
		player_instance = Player.new()
		var col = CollisionShape2D.new()
		var shape = CircleShape2D.new()
		shape.radius = 18.0
		col.shape = shape
		player_instance.add_child(col)
	
	player_instance.position = pos
	parent.add_child(player_instance)
	
	player_instance.inventory_changed.connect(_on_player_inventory_updated)

func _on_player_inventory_updated(cards: int, _meds: int) -> void:
	if extraction_instance is Interactables.ExtractionZone:
		(extraction_instance as Interactables.ExtractionZone).update_keycard_progress(cards)
	if hud_node != null:
		var level_name = Levels.LEVELS[current_level_index]["name"]
		hud_node.update_level_info(level_name, required_keycards, cards)

func _on_extraction_complete() -> void:
	level_active = false
	if current_level_index >= Levels.LEVELS.size() - 1:
		hud_node.show_screen(HUD.ScreenState.VICTORY)
	else:
		hud_node.show_level_complete(level_timer, player_instance.keycards)

func _physics_process(delta: float) -> void:
	if not level_active or player_instance == null:
		return
	
	# Timer countdown
	level_timer -= delta
	hud_node.update_timer(level_timer)
	
	# Threat detection (infected within 380px)
	var has_threat = false
	for inf in infected_list:
		if is_instance_valid(inf):
			var dist = player_instance.global_position.distance_to(inf.global_position)
			if dist <= 380.0 or inf.current_state == Infected.State.CHASE:
				has_threat = true
				break
	hud_node.update_threat(has_threat)
	
	# Clean up uncollected keycard array
	keycard_pickups = keycard_pickups.filter(func(item): return is_instance_valid(item))
	
	# Compass navigation: points to closest keycard, or extraction if all keycards acquired
	var target_nav_pos = Vector2.ZERO
	if player_instance.keycards < required_keycards and not keycard_pickups.is_empty():
		var closest_dist = 999999.0
		for card in keycard_pickups:
			if is_instance_valid(card):
				var d = player_instance.global_position.distance_to(card.global_position)
				if d < closest_dist:
					closest_dist = d
					target_nav_pos = card.global_position
	elif extraction_instance != null and is_instance_valid(extraction_instance):
		target_nav_pos = extraction_instance.global_position
	
	hud_node.update_objective_compass(player_instance.global_position, target_nav_pos)
