class_name Interactables
extends RefCounted

const AssetMap = preload("res://scripts/asset_map.gd")

## Factory and helper classes for NOT DEAD YET interactable world elements

class PickupItem extends Area2D:
	enum Type { KEYCARD, MEDKIT, BATTERY }
	var item_type: Type = Type.KEYCARD
	var visual: Node2D = null
	
	func _init(p_type: Type) -> void:
		item_type = p_type
		collision_layer = 4
		collision_mask = 2 # Player layer
	
	func _ready() -> void:
		var type_str = "keycard"
		match item_type:
			Type.KEYCARD:
				type_str = "keycard"
			Type.MEDKIT:
				type_str = "medkit"
			Type.BATTERY:
				type_str = "battery"
		
		visual = AssetMap.create_visual(type_str, self)
		
		var col = CollisionShape2D.new()
		var shape = CircleShape2D.new()
		shape.radius = 20.0
		col.shape = shape
		add_child(col)
		
		body_entered.connect(_on_body_entered)
		
		# Gentle hover animation
		var tween = create_tween().set_loops()
		tween.tween_property(visual, "position:y", -4.0, 0.7).set_trans(Tween.TRANS_SINE)
		tween.tween_property(visual, "position:y", 4.0, 0.7).set_trans(Tween.TRANS_SINE)
	
	func _on_body_entered(body: Node2D) -> void:
		if body.has_method("add_keycard"):
			var sfx = AssetMap.load_audio_safe(AssetMap.PATH_AUDIO_PICKUP)
			if sfx != null:
				var audio = AudioStreamPlayer2D.new()
				audio.stream = sfx
				audio.position = global_position
				get_parent().add_child(audio)
				audio.play()
			
			match item_type:
				Type.KEYCARD:
					body.add_keycard()
				Type.MEDKIT:
					body.add_medkit()
				Type.BATTERY:
					body.add_battery(50.0)
			
			queue_free()

class DoorNode extends StaticBody2D:
	signal door_opened(is_shortcut: bool)
	
	var is_shortcut: bool = false
	var is_open: bool = false
	var visual: Node2D = null
	var collision_shape: CollisionShape2D = null
	var interact_area: Area2D = null
	var player_in_range: Node2D = null
	
	func _init(p_shortcut: bool = false) -> void:
		is_shortcut = p_shortcut
		collision_layer = 1
		collision_mask = 2 | 8 # Player and Infected
	
	func _ready() -> void:
		var type_str = "door_shortcut" if is_shortcut else "door"
		visual = AssetMap.create_visual(type_str, self)
		
		collision_shape = CollisionShape2D.new()
		var rect_shape = RectangleShape2D.new()
		rect_shape.size = Vector2(AssetMap.TILE_SIZE, AssetMap.TILE_SIZE)
		collision_shape.shape = rect_shape
		add_child(collision_shape)
		
		# Interaction detection zone
		interact_area = Area2D.new()
		interact_area.name = "InteractArea"
		interact_area.collision_layer = 0
		interact_area.collision_mask = 2 # Player
		var area_shape = CollisionShape2D.new()
		var circle = CircleShape2D.new()
		circle.radius = 58.0
		area_shape.shape = circle
		interact_area.add_child(area_shape)
		add_child(interact_area)
		
		interact_area.body_entered.connect(_on_player_entered)
		interact_area.body_exited.connect(_on_player_exited)
	
	func _on_player_entered(body: Node2D) -> void:
		if body.has_method("trigger_noise_burst") and not is_open:
			player_in_range = body
	
	func _on_player_exited(body: Node2D) -> void:
		if body == player_in_range:
			player_in_range = null
	
	func _unhandled_input(event: InputEvent) -> void:
		if is_open or player_in_range == null:
			return
		
		if event.is_action_pressed("interact"):
			try_open(player_in_range)

	func try_open(player: Node2D) -> bool:
		if is_open:
			return false
		
		if is_shortcut:
			# Risky shortcut opens without keycard, but creates large noise
			_execute_open(player, 440.0)
			return true
		else:
			# Locked door requires keycard
			if "keycards" in player and player.keycards >= 1:
				player.keycards -= 1
				if player.has_signal("inventory_changed"):
					player.inventory_changed.emit(player.keycards, player.medkits)
				_execute_open(player, 280.0)
				return true
			else:
				# Insufficient keycards
				if player.has_method("trigger_noise_burst"):
					player.trigger_noise_burst(80.0, 0.2)
				var tween = create_tween()
				tween.tween_property(visual, "modulate", Color(1.0, 0.3, 0.3, 1.0), 0.1)
				tween.tween_property(visual, "modulate", Color.WHITE, 0.2)
				return false

	func _execute_open(player: Node2D, noise_radius: float) -> void:
		is_open = true
		collision_shape.set_deferred("disabled", true)
		if player.has_method("trigger_noise_burst"):
			player.trigger_noise_burst(noise_radius, 0.6)
		
		# SFX
		var sfx = AssetMap.load_audio_safe(AssetMap.PATH_AUDIO_DOOR)
		if sfx != null:
			var audio = AudioStreamPlayer2D.new()
			audio.stream = sfx
			audio.position = global_position
			get_parent().add_child(audio)
			audio.play()
		
		# Open visual transition
		var tween = create_tween()
		tween.tween_property(visual, "modulate", AssetMap.COLOR_DOOR_OPEN, 0.3)
		tween.parallel().tween_property(visual, "scale", Vector2(0.3, 1.0), 0.3)
		
		door_opened.emit(is_shortcut)

class ExtractionZone extends Area2D:
	signal player_extracted
	
	var visual: Node2D = null
	var is_unlocked: bool = false
	var required_keycards: int = 1
	var current_keycards: int = 0
	
	func _init(req_cards: int = 1) -> void:
		required_keycards = req_cards
		collision_layer = 0
		collision_mask = 2 # Player
	
	func _ready() -> void:
		visual = AssetMap.create_visual("extraction", self)
		
		var col = CollisionShape2D.new()
		var shape = CircleShape2D.new()
		shape.radius = 28.0
		col.shape = shape
		add_child(col)
		
		body_entered.connect(_on_body_entered)
		
		# Pulse beacon
		var tween = create_tween().set_loops()
		tween.tween_property(visual, "modulate", Color(1.2, 1.2, 1.2, 1.0), 0.8)
		tween.tween_property(visual, "modulate", Color(0.8, 0.8, 0.8, 0.8), 0.8)
	
	func update_keycard_progress(cards: int) -> void:
		current_keycards = cards
		is_unlocked = current_keycards >= required_keycards
		if visual != null:
			if is_unlocked:
				visual.modulate = Color(1.0, 1.3, 1.0, 1.0)
			else:
				visual.modulate = Color(0.6, 0.6, 0.6, 0.6)
	
	func _on_body_entered(body: Node2D) -> void:
		if body.has_method("add_keycard") and is_unlocked:
			player_extracted.emit()
