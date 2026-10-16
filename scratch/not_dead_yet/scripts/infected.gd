class_name Infected
extends CharacterBody2D

const AssetMap = preload("res://scripts/asset_map.gd")

enum State { PATROL, INVESTIGATE, CHASE }

signal alert_triggered(state: State)

@export var damage: float = 25.0
@export var attack_cooldown: float = 1.2
@export var patrol_speed: float = 85.0
@export var investigate_speed: float = 135.0
@export var chase_speed: float = 240.0
@export var vision_range: float = 300.0
@export var vision_angle_deg: float = 105.0
@export var close_detect_range: float = 85.0
@export var lose_sight_duration: float = 3.5

var current_state: State = State.PATROL
var target_pos: Vector2 = Vector2.ZERO
var player_ref: Node2D = null

var patrol_points: Array[Vector2] = []
var patrol_index: int = 0
var patrol_wait_timer: float = 0.0

var lose_sight_timer: float = 0.0
var attack_timer: float = 0.0
var search_timer: float = 0.0

var visual_node: Node2D = null
var status_label: Label = null
var facing_dir: Vector2 = Vector2.DOWN

func _ready() -> void:
	visual_node = AssetMap.create_visual("infected", self)
	_setup_patrol_points()
	_setup_status_indicator()

func _setup_patrol_points() -> void:
	patrol_points.clear()
	patrol_points.append(global_position)
	# Default small patrol loop
	patrol_points.append(global_position + Vector2(70, 0))
	patrol_points.append(global_position + Vector2(-70, 0))
	target_pos = patrol_points[0]

func _setup_status_indicator() -> void:
	status_label = Label.new()
	status_label.name = "StatusLabel"
	status_label.text = ""
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	status_label.size = Vector2(30, 24)
	status_label.position = Vector2(-15, -42)
	status_label.add_theme_font_size_override("font_size", 18)
	add_child(status_label)

func set_player(p: Node2D) -> void:
	player_ref = p

func _physics_process(delta: float) -> void:
	if attack_timer > 0.0:
		attack_timer -= delta
	
	if player_ref == null or ("health" in player_ref and player_ref.health <= 0):
		_process_patrol(delta)
		_update_status()
		return
	
	# Hearing & Vision sensors
	_sense_player(delta)
	
	# State execution
	match current_state:
		State.PATROL:
			_process_patrol(delta)
		State.INVESTIGATE:
			_process_investigate(delta)
		State.CHASE:
			_process_chase(delta)
	
	# Check contact attack
	_check_player_contact()
	
	_update_status()
	
	if visual_node != null and velocity.length_squared() > 10.0:
		facing_dir = velocity.normalized()
		visual_node.rotation = facing_dir.angle()

func _sense_player(delta: float) -> void:
	var dist = global_position.distance_to(player_ref.global_position)
	var has_los = _check_line_of_sight()
	
	# 1. Vision detection
	if dist <= vision_range:
		var dir_to_player = (player_ref.global_position - global_position).normalized()
		var angle_to_player = abs(facing_dir.angle_to(dir_to_player))
		var in_vision_cone = angle_to_player <= deg_to_rad(vision_angle_deg * 0.5)
		var is_super_close = dist <= close_detect_range
		
		if (in_vision_cone or is_super_close) and has_los:
			_enter_chase(player_ref.global_position)
			return
	
	# 2. Hearing detection (noise radius overlap)
	var player_noise = player_ref.current_noise_radius if "current_noise_radius" in player_ref else 0.0
	if current_state != State.CHASE and player_noise > 0.0:
		if dist <= player_noise:
			_enter_investigate(player_ref.global_position)
			return
	
	# 3. LOS loss during Chase
	if current_state == State.CHASE:
		if has_los:
			lose_sight_timer = lose_sight_duration
			target_pos = player_ref.global_position
		else:
			lose_sight_timer -= delta
			if lose_sight_timer <= 0.0:
				# Lost player, investigate last known spot
				_enter_investigate(target_pos)

func _check_line_of_sight() -> bool:
	if player_ref == null:
		return false
	var space_state = get_world_2d().direct_space_state
	var query = PhysicsRayQueryParameters2D.create(global_position, player_ref.global_position)
	query.collision_mask = 1 # Wall collision layer
	query.exclude = [self.get_rid(), player_ref.get_rid()]
	var result = space_state.intersect_ray(query)
	return result.is_empty()

func _enter_chase(pos: Vector2) -> void:
	current_state = State.CHASE
	target_pos = pos
	lose_sight_timer = lose_sight_duration
	alert_triggered.emit(current_state)

func _enter_investigate(pos: Vector2) -> void:
	current_state = State.INVESTIGATE
	target_pos = pos
	search_timer = 2.5
	alert_triggered.emit(current_state)

func _process_patrol(delta: float) -> void:
	if patrol_points.is_empty():
		return
	
	if patrol_wait_timer > 0.0:
		patrol_wait_timer -= delta
		velocity = Vector2.ZERO
		move_and_slide()
		return
	
	target_pos = patrol_points[patrol_index]
	var dist = global_position.distance_to(target_pos)
	if dist < 14.0:
		patrol_wait_timer = randf_range(1.2, 2.0)
		patrol_index = (patrol_index + 1) % patrol_points.size()
		velocity = Vector2.ZERO
	else:
		var dir = (target_pos - global_position).normalized()
		velocity = dir * patrol_speed
		move_and_slide()

func _process_investigate(delta: float) -> void:
	var dist = global_position.distance_to(target_pos)
	if dist > 18.0:
		var dir = (target_pos - global_position).normalized()
		velocity = dir * investigate_speed
		move_and_slide()
	else:
		velocity = Vector2.ZERO
		search_timer -= delta
		if search_timer <= 0.0:
			current_state = State.PATROL
			patrol_index = 0

func _process_chase(_delta: float) -> void:
	var dist = global_position.distance_to(target_pos)
	if dist > 10.0:
		var dir = (target_pos - global_position).normalized()
		velocity = dir * chase_speed
		move_and_slide()
	else:
		velocity = Vector2.ZERO

func _check_player_contact() -> void:
	if player_ref == null or ("health" in player_ref and player_ref.health <= 0):
		return
	var dist = global_position.distance_to(player_ref.global_position)
	if dist <= 38.0 and attack_timer <= 0.0:
		attack_timer = attack_cooldown
		if player_ref.has_method("take_damage"):
			player_ref.take_damage(damage)
		# Audio feedback if sound available
		var hurt_stream = AssetMap.load_audio_safe(AssetMap.PATH_AUDIO_HURT)
		if hurt_stream != null:
			var player_audio = AudioStreamPlayer2D.new()
			player_audio.stream = hurt_stream
			player_audio.position = global_position
			get_parent().add_child(player_audio)
			player_audio.play()

func _update_status() -> void:
	if status_label == null:
		return
	match current_state:
		State.CHASE:
			status_label.text = "!"
			status_label.modulate = Color(1.0, 0.15, 0.15, 1.0)
		State.INVESTIGATE:
			status_label.text = "?"
			status_label.modulate = Color(1.0, 0.8, 0.1, 1.0)
		State.PATROL:
			status_label.text = ""
