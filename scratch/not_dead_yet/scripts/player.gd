class_name Player
extends CharacterBody2D

const AssetMap = preload("res://scripts/asset_map.gd")

signal health_changed(current_hp: float, max_hp: float)
signal stamina_changed(current_stamina: float, max_stamina: float)
signal battery_changed(current_battery: float, max_battery: float)
signal inventory_changed(keycards: int, medkits: int)
signal noise_changed(radius: float)
signal died

@export var walk_speed: float = 180.0
@export var sprint_speed: float = 300.0
@export var max_health: float = 100.0
@export var max_stamina: float = 100.0
@export var max_battery: float = 100.0
@export var stamina_drain: float = 30.0
@export var stamina_regen: float = 22.0
@export var battery_drain: float = 1.6 # ~60 seconds of continuous light

var health: float = 100.0
var stamina: float = 100.0
var battery: float = 100.0
var keycards: int = 0
var medkits: int = 0

var is_sprinting: bool = false
var flashlight_on: bool = true
var current_noise_radius: float = 0.0
var noise_burst_timer: float = 0.0
var noise_burst_radius: float = 0.0
var facing_direction: Vector2 = Vector2.RIGHT

var visual_node: Node2D = null
var flashlight: PointLight2D = null
var ambient_light: PointLight2D = null
var camera: Camera2D = null

func _ready() -> void:
	health = max_health
	stamina = max_stamina
	battery = max_battery
	
	# Visual representation
	visual_node = AssetMap.create_visual("player", self)
	
	# Procedural Flashlight setup (No image files!)
	_setup_lights()
	
	# Camera setup
	if not has_node("Camera2D"):
		camera = Camera2D.new()
		camera.name = "Camera2D"
		camera.position_smoothing_enabled = true
		camera.position_smoothing_speed = 7.0
		add_child(camera)
	else:
		camera = get_node("Camera2D")
		camera.position_smoothing_enabled = true
	
	emit_stats()

func _setup_lights() -> void:
	# Flashlight gradient texture
	var flash_grad = Gradient.new()
	flash_grad.colors = PackedColorArray([
		Color(1.0, 0.98, 0.88, 1.0),
		Color(0.95, 0.88, 0.65, 0.5),
		Color(0.4, 0.35, 0.2, 0.1),
		Color(0.0, 0.0, 0.0, 0.0)
	])
	flash_grad.offsets = PackedFloat32Array([0.0, 0.3, 0.7, 1.0])
	
	var flash_tex = GradientTexture2D.new()
	flash_tex.gradient = flash_grad
	flash_tex.fill = GradientTexture2D.FILL_RADIAL
	flash_tex.fill_from = Vector2(0.5, 0.5)
	flash_tex.fill_to = Vector2(0.5, 0.0)
	flash_tex.width = 512
	flash_tex.height = 512
	
	flashlight = PointLight2D.new()
	flashlight.name = "Flashlight"
	flashlight.texture = flash_tex
	flashlight.texture_scale = 1.6
	flashlight.energy = 1.15
	flashlight.shadow_enabled = true
	flashlight.position = Vector2(40, 0)
	add_child(flashlight)
	
	# Ambient survivor glow
	var amb_grad = Gradient.new()
	amb_grad.colors = PackedColorArray([
		Color(0.8, 0.85, 0.9, 0.4),
		Color(0.3, 0.35, 0.4, 0.1),
		Color(0.0, 0.0, 0.0, 0.0)
	])
	amb_grad.offsets = PackedFloat32Array([0.0, 0.5, 1.0])
	
	var amb_tex = GradientTexture2D.new()
	amb_tex.gradient = amb_grad
	amb_tex.fill = GradientTexture2D.FILL_RADIAL
	amb_tex.fill_from = Vector2(0.5, 0.5)
	amb_tex.fill_to = Vector2(0.5, 0.0)
	amb_tex.width = 256
	amb_tex.height = 256
	
	ambient_light = PointLight2D.new()
	ambient_light.name = "AmbientLight"
	ambient_light.texture = amb_tex
	ambient_light.texture_scale = 1.2
	ambient_light.energy = 0.5
	ambient_light.shadow_enabled = false
	add_child(ambient_light)

func emit_stats() -> void:
	health_changed.emit(health, max_health)
	stamina_changed.emit(stamina, max_stamina)
	battery_changed.emit(battery, max_battery)
	inventory_changed.emit(keycards, medkits)
	noise_changed.emit(current_noise_radius)

func _physics_process(delta: float) -> void:
	if health <= 0:
		return
	
	# 8-Direction movement
	var input_vec = Vector2.ZERO
	if Input.is_action_pressed("move_right"):
		input_vec.x += 1.0
	if Input.is_action_pressed("move_left"):
		input_vec.x -= 1.0
	if Input.is_action_pressed("move_down"):
		input_vec.y += 1.0
	if Input.is_action_pressed("move_up"):
		input_vec.y -= 1.0
	
	var is_moving = input_vec.length_squared() > 0.01
	if is_moving:
		input_vec = input_vec.normalized()
		facing_direction = input_vec
		if visual_node != null:
			visual_node.rotation = facing_direction.angle()
		if flashlight != null:
			flashlight.position = facing_direction * 45.0
			flashlight.rotation = facing_direction.angle()
	
	# Sprint & Stamina logic
	var wants_sprint = Input.is_action_pressed("sprint") and is_moving and stamina > 5.0
	var speed = walk_speed
	
	if wants_sprint:
		is_sprinting = true
		speed = sprint_speed
		stamina = max(0.0, stamina - stamina_drain * delta)
	else:
		is_sprinting = false
		stamina = min(max_stamina, stamina + stamina_regen * delta)
	stamina_changed.emit(stamina, max_stamina)
	
	velocity = input_vec * speed
	move_and_slide()
	
	# Flashlight & Battery logic
	_process_flashlight(delta)
	
	# Noise computation
	_process_noise(delta, is_moving)
	
	# User interactions
	_handle_input_actions()
	
	queue_redraw()

func _process_flashlight(delta: float) -> void:
	if Input.is_action_just_pressed("flashlight"):
		if battery > 1.0:
			flashlight_on = not flashlight_on
		else:
			flashlight_on = false
	
	if flashlight_on and battery > 0.0:
		battery = max(0.0, battery - battery_drain * delta)
		if battery <= 0.0:
			flashlight_on = false
	elif not flashlight_on and battery <= 0.0:
		pass
	
	if flashlight != null:
		flashlight.visible = flashlight_on and battery > 0.0
		# Gentle battery flicker when low
		if battery < 20.0 and flashlight_on:
			flashlight.energy = 0.8 + randf() * 0.35
		else:
			flashlight.energy = 1.15
	
	battery_changed.emit(battery, max_battery)

func _process_noise(delta: float, is_moving: bool) -> void:
	var base_noise = 0.0
	if is_sprinting:
		base_noise = 360.0
	elif is_moving:
		base_noise = 110.0
	else:
		base_noise = 0.0
	
	if noise_burst_timer > 0.0:
		noise_burst_timer -= delta
		current_noise_radius = max(base_noise, noise_burst_radius)
	else:
		current_noise_radius = base_noise
	
	noise_changed.emit(current_noise_radius)

func trigger_noise_burst(radius: float = 380.0, duration: float = 0.5) -> void:
	noise_burst_radius = radius
	noise_burst_timer = duration
	current_noise_radius = max(current_noise_radius, radius)
	noise_changed.emit(current_noise_radius)

func _handle_input_actions() -> void:
	# Heal with Q
	if Input.is_action_just_pressed("use_item"):
		use_medkit()

func use_medkit() -> bool:
	if medkits > 0 and health < max_health:
		medkits -= 1
		health = min(max_health, health + 35.0)
		trigger_noise_burst(160.0, 0.4)
		health_changed.emit(health, max_health)
		inventory_changed.emit(keycards, medkits)
		return true
	return false

func add_keycard() -> void:
	keycards += 1
	trigger_noise_burst(140.0, 0.3)
	inventory_changed.emit(keycards, medkits)

func add_medkit() -> void:
	medkits += 1
	trigger_noise_burst(140.0, 0.3)
	inventory_changed.emit(keycards, medkits)

func add_battery(amount: float = 50.0) -> void:
	battery = min(max_battery, battery + amount)
	trigger_noise_burst(140.0, 0.3)
	battery_changed.emit(battery, max_battery)

func take_damage(amount: float) -> void:
	if health <= 0:
		return
	health = max(0.0, health - amount)
	trigger_noise_burst(260.0, 0.4)
	health_changed.emit(health, max_health)
	
	# Hurt visual flash
	if visual_node != null:
		var tween = create_tween()
		tween.tween_property(visual_node, "modulate", Color(1.0, 0.2, 0.2, 1.0), 0.08)
		tween.tween_property(visual_node, "modulate", Color.WHITE, 0.15)
	
	if health <= 0:
		died.emit()

func _draw() -> void:
	# Draw noise radius indicator when sprinting or bursting
	if current_noise_radius > 120.0:
		var col_fill = Color(1.0, 0.45, 0.2, 0.07)
		var col_edge = Color(1.0, 0.4, 0.15, 0.35)
		draw_circle(Vector2.ZERO, current_noise_radius, col_fill)
		draw_arc(Vector2.ZERO, current_noise_radius, 0.0, TAU, 32, col_edge, 1.5)
