class_name HUD
extends CanvasLayer

const AssetMap = preload("res://scripts/asset_map.gd")

signal start_game_requested
signal restart_requested
signal next_level_requested
signal title_requested

# UI State
enum ScreenState { TITLE, LOADING, PLAYING, PAUSED, LEVEL_COMPLETE, VICTORY, GAME_OVER, TIME_UP }
var current_screen: ScreenState = ScreenState.TITLE

# Tracked references
var player_ref: Node2D = null
var nearest_objective_pos: Vector2 = Vector2.ZERO
var threat_nearby: bool = false
var time_left: float = 0.0

# UI Controls
var title_overlay: Control = null
var loading_overlay: Control = null
var pause_overlay: Control = null
var level_complete_overlay: Control = null
var victory_overlay: Control = null
var game_over_overlay: Control = null
var time_up_overlay: Control = null

var hud_container: Control = null
var hp_bar: ProgressBar = null
var hp_label: Label = null
var stamina_bar: ProgressBar = null
var stamina_label: Label = null
var cards_label: Label = null
var medkits_label: Label = null
var battery_label: Label = null

var objective_label: Label = null
var extraction_status_label: Label = null
var timer_label: Label = null
var threat_label: Label = null

var compass_arrow: Polygon2D = null
var vignette_rect: ColorRect = null

# Stats for end of level
var stat_time_left: float = 0.0
var stat_cards_collected: int = 0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_ui()
	show_screen(ScreenState.TITLE)

func _build_ui() -> void:
	# Root container
	hud_container = Control.new()
	hud_container.name = "HUDContainer"
	hud_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	hud_container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(hud_container)
	
	_build_top_left()
	_build_top_center()
	_build_top_right()
	_build_compass()
	_build_vignette()
	_build_overlays()

func _build_top_left() -> void:
	var panel = PanelContainer.new()
	panel.name = "TopLeftPanel"
	panel.position = Vector2(24, 20)
	panel.size = Vector2(280, 150)
	hud_container.add_child(panel)
	
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 6)
	panel.add_child(vbox)
	
	# Health Bar
	var hp_box = HBoxContainer.new()
	var hp_title = Label.new()
	hp_title.text = "HEALTH"
	hp_title.custom_minimum_size = Vector2(70, 0)
	hp_title.add_theme_color_override("font_color", Color(0.95, 0.3, 0.3))
	hp_box.add_child(hp_title)
	
	hp_bar = ProgressBar.new()
	hp_bar.custom_minimum_size = Vector2(130, 16)
	hp_bar.max_value = 100.0
	hp_bar.value = 100.0
	hp_bar.show_percentage = false
	hp_box.add_child(hp_bar)
	
	hp_label = Label.new()
	hp_label.text = "100"
	hp_label.custom_minimum_size = Vector2(40, 0)
	hp_box.add_child(hp_label)
	vbox.add_child(hp_box)
	
	# Stamina Bar
	var sta_box = HBoxContainer.new()
	var sta_title = Label.new()
	sta_title.text = "STAMINA"
	sta_title.custom_minimum_size = Vector2(70, 0)
	sta_title.add_theme_color_override("font_color", Color(0.3, 0.75, 1.0))
	sta_box.add_child(sta_title)
	
	stamina_bar = ProgressBar.new()
	stamina_bar.custom_minimum_size = Vector2(130, 16)
	stamina_bar.max_value = 100.0
	stamina_bar.value = 100.0
	stamina_bar.show_percentage = false
	sta_box.add_child(stamina_bar)
	
	stamina_label = Label.new()
	stamina_label.text = "100%"
	stamina_label.custom_minimum_size = Vector2(40, 0)
	sta_box.add_child(stamina_label)
	vbox.add_child(sta_box)
	
	# Inventory items
	var inv_box = HBoxContainer.new()
	inv_box.add_theme_constant_override("separation", 16)
	
	cards_label = Label.new()
	cards_label.text = "CARD: 0/1"
	cards_label.add_theme_color_override("font_color", AssetMap.COLOR_KEYCARD)
	inv_box.add_child(cards_label)
	
	medkits_label = Label.new()
	medkits_label.text = "MED: 0 [Q]"
	medkits_label.add_theme_color_override("font_color", AssetMap.COLOR_MEDKIT)
	inv_box.add_child(medkits_label)
	
	battery_label = Label.new()
	battery_label.text = "BAT: 100%"
	battery_label.add_theme_color_override("font_color", AssetMap.COLOR_BATTERY)
	inv_box.add_child(battery_label)
	
	vbox.add_child(inv_box)

func _build_top_center() -> void:
	var center_box = VBoxContainer.new()
	center_box.name = "TopCenterBox"
	center_box.position = Vector2(400, 18)
	center_box.size = Vector2(480, 70)
	center_box.alignment = BoxContainer.ALIGNMENT_CENTER
	hud_container.add_child(center_box)
	
	objective_label = Label.new()
	objective_label.text = "OBJECTIVE: Search the campus"
	objective_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	objective_label.add_theme_font_size_override("font_size", 17)
	objective_label.add_theme_color_override("font_color", Color(1.0, 0.95, 0.8))
	center_box.add_child(objective_label)
	
	extraction_status_label = Label.new()
	extraction_status_label.text = "EXTRACTION LOCKED"
	extraction_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	extraction_status_label.add_theme_font_size_override("font_size", 14)
	extraction_status_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
	center_box.add_child(extraction_status_label)

func _build_top_right() -> void:
	var right_box = VBoxContainer.new()
	right_box.name = "TopRightBox"
	right_box.position = Vector2(1000, 20)
	right_box.size = Vector2(250, 90)
	right_box.alignment = BoxContainer.ALIGNMENT_BEGIN
	hud_container.add_child(right_box)
	
	timer_label = Label.new()
	timer_label.text = "TIME: 04:00"
	timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	timer_label.add_theme_font_size_override("font_size", 24)
	timer_label.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
	right_box.add_child(timer_label)
	
	threat_label = Label.new()
	threat_label.text = "THREAT NEARBY"
	threat_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	threat_label.add_theme_font_size_override("font_size", 16)
	threat_label.add_theme_color_override("font_color", Color(1.0, 0.15, 0.15))
	threat_label.visible = false
	right_box.add_child(threat_label)

func _build_compass() -> void:
	compass_arrow = Polygon2D.new()
	compass_arrow.name = "CompassArrow"
	compass_arrow.polygon = PackedVector2Array([
		Vector2(18, 0),
		Vector2(-10, -9),
		Vector2(-4, 0),
		Vector2(-10, 9)
	])
	compass_arrow.color = Color(1.0, 0.85, 0.2, 0.9)
	compass_arrow.visible = false
	hud_container.add_child(compass_arrow)

func _build_vignette() -> void:
	vignette_rect = ColorRect.new()
	vignette_rect.name = "LowHealthVignette"
	vignette_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	vignette_rect.color = Color(0.8, 0.05, 0.05, 0.0)
	vignette_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_container.add_child(vignette_rect)

func _build_overlays() -> void:
	# 1. Title Screen
	title_overlay = _create_screen_panel("TITLE")
	var t_bg = TextureRect.new()
	t_bg.name = "TitleBackground"
	t_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	t_bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	t_bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	var t_tex = AssetMap.load_texture_safe(AssetMap.PATH_LOADING_CORRIDOR)
	if t_tex != null:
		t_bg.texture = t_tex
	title_overlay.add_child(t_bg)
	
	var t_dim = ColorRect.new()
	t_dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	t_dim.color = Color(0.04, 0.04, 0.06, 0.72)
	title_overlay.add_child(t_dim)
	
	var t_vbox = VBoxContainer.new()
	t_vbox.set_anchors_preset(Control.PRESET_CENTER)
	t_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	t_vbox.add_theme_constant_override("separation", 16)
	title_overlay.add_child(t_vbox)
	
	var title_lbl = Label.new()
	title_lbl.text = "NOT DEAD YET"
	title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_lbl.add_theme_font_size_override("font_size", 52)
	title_lbl.add_theme_color_override("font_color", Color(0.9, 0.15, 0.15))
	t_vbox.add_child(title_lbl)
	
	var tag_lbl = Label.new()
	tag_lbl.text = "\"When your university becomes your prison\""
	tag_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tag_lbl.add_theme_font_size_override("font_size", 20)
	tag_lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	t_vbox.add_child(tag_lbl)
	
	var ctrl_lbl = Label.new()
	ctrl_lbl.text = "\n[CONTROLS]\nWASD / Arrows : Move\nShift : Sprint (Generates noise!)\nE : Interact / Unlock Doors\nQ : Use Medkit (Heal 35 HP)\nF : Toggle Flashlight\nEsc : Pause\n"
	ctrl_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ctrl_lbl.add_theme_font_size_override("font_size", 16)
	ctrl_lbl.add_theme_color_override("font_color", Color(0.7, 0.75, 0.8))
	t_vbox.add_child(ctrl_lbl)
	
	var start_lbl = Label.new()
	start_lbl.text = "PRESS ENTER TO START"
	start_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	start_lbl.add_theme_font_size_override("font_size", 22)
	start_lbl.add_theme_color_override("font_color", Color(1.0, 0.9, 0.2))
	t_vbox.add_child(start_lbl)
	add_child(title_overlay)
	
	# 2. Pause Overlay
	pause_overlay = _create_screen_panel("PAUSED")
	var p_vbox = VBoxContainer.new()
	p_vbox.set_anchors_preset(Control.PRESET_CENTER)
	p_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	p_vbox.add_theme_constant_override("separation", 14)
	pause_overlay.add_child(p_vbox)
	
	var p_lbl = Label.new()
	p_lbl.text = "PAUSED"
	p_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	p_lbl.add_theme_font_size_override("font_size", 42)
	p_vbox.add_child(p_lbl)
	
	var p_sub = Label.new()
	p_sub.text = "Press ESC to Resume\nPress R to Restart Level"
	p_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	p_sub.add_theme_font_size_override("font_size", 18)
	p_vbox.add_child(p_sub)
	add_child(pause_overlay)
	
	# 3. Level Complete Overlay
	level_complete_overlay = _create_screen_panel("LEVEL_COMPLETE")
	var lc_vbox = VBoxContainer.new()
	lc_vbox.set_anchors_preset(Control.PRESET_CENTER)
	lc_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	lc_vbox.add_theme_constant_override("separation", 14)
	level_complete_overlay.add_child(lc_vbox)
	
	var lc_title = Label.new()
	lc_title.text = "LEVEL COMPLETE"
	lc_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lc_title.add_theme_font_size_override("font_size", 46)
	lc_title.add_theme_color_override("font_color", Color(0.2, 0.95, 0.5))
	lc_vbox.add_child(lc_title)
	
	var lc_stats = Label.new()
	lc_stats.name = "StatsLabel"
	lc_stats.text = "Area Evacuated Successfully"
	lc_stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lc_stats.add_theme_font_size_override("font_size", 18)
	lc_vbox.add_child(lc_stats)
	
	var lc_cont = Label.new()
	lc_cont.text = "\nPRESS ENTER FOR NEXT LEVEL"
	lc_cont.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lc_cont.add_theme_font_size_override("font_size", 22)
	lc_cont.add_theme_color_override("font_color", Color(1.0, 0.9, 0.2))
	lc_vbox.add_child(lc_cont)
	add_child(level_complete_overlay)
	
	# 4. Victory Overlay
	victory_overlay = _create_screen_panel("VICTORY")
	var v_vbox = VBoxContainer.new()
	v_vbox.set_anchors_preset(Control.PRESET_CENTER)
	v_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	v_vbox.add_theme_constant_override("separation", 14)
	victory_overlay.add_child(v_vbox)
	
	var v_title = Label.new()
	v_title.text = "YOU ESCAPED"
	v_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v_title.add_theme_font_size_override("font_size", 54)
	v_title.add_theme_color_override("font_color", Color(0.2, 0.95, 0.6))
	v_vbox.add_child(v_title)
	
	var v_msg = Label.new()
	v_msg.text = "Against all odds, you escaped the university quarantine.\nYou are not dead yet."
	v_msg.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v_msg.add_theme_font_size_override("font_size", 18)
	v_vbox.add_child(v_msg)
	
	var v_cont = Label.new()
	v_cont.text = "\nPRESS ENTER TO RETURN TO TITLE"
	v_cont.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v_cont.add_theme_font_size_override("font_size", 20)
	v_cont.add_theme_color_override("font_color", Color(1.0, 0.9, 0.2))
	v_vbox.add_child(v_cont)
	add_child(victory_overlay)
	
	# 5. Game Over ("YOU DIED")
	game_over_overlay = _create_screen_panel("GAME_OVER")
	var go_vbox = VBoxContainer.new()
	go_vbox.set_anchors_preset(Control.PRESET_CENTER)
	go_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	go_vbox.add_theme_constant_override("separation", 14)
	game_over_overlay.add_child(go_vbox)
	
	var go_title = Label.new()
	go_title.text = "YOU DIED"
	go_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	go_title.add_theme_font_size_override("font_size", 54)
	go_title.add_theme_color_override("font_color", Color(0.9, 0.1, 0.1))
	go_vbox.add_child(go_title)
	
	var go_sub = Label.new()
	go_sub.text = "The infection overwhelmed you.\n\nPRESS R TO RESTART LEVEL"
	go_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	go_sub.add_theme_font_size_override("font_size", 20)
	go_vbox.add_child(go_sub)
	add_child(game_over_overlay)
	
	# 6. Time Up ("TIME'S UP")
	time_up_overlay = _create_screen_panel("TIME_UP")
	var tu_vbox = VBoxContainer.new()
	tu_vbox.set_anchors_preset(Control.PRESET_CENTER)
	tu_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	tu_vbox.add_theme_constant_override("separation", 14)
	time_up_overlay.add_child(tu_vbox)
	
	var tu_title = Label.new()
	tu_title.text = "TIME'S UP"
	tu_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tu_title.add_theme_font_size_override("font_size", 54)
	tu_title.add_theme_color_override("font_color", Color(0.95, 0.2, 0.2))
	tu_vbox.add_child(tu_title)
	
	var tu_sub = Label.new()
	tu_sub.text = "The campus was completely overrun.\n\nPRESS R TO RESTART LEVEL"
	tu_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tu_sub.add_theme_font_size_override("font_size", 20)
	tu_vbox.add_child(tu_sub)
	add_child(time_up_overlay)
	
	# 7. Loading Screen (Photo background darkened with red tint and vignette)
	loading_overlay = _create_screen_panel("LOADING")
	var l_bg = TextureRect.new()
	l_bg.name = "LoadingBackground"
	l_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	l_bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	l_bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	loading_overlay.add_child(l_bg)
	
	var l_tint = ColorRect.new()
	l_tint.name = "RedHorrorTint"
	l_tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	l_tint.color = Color(0.14, 0.02, 0.02, 0.45)
	loading_overlay.add_child(l_tint)
	
	var l_vbox = VBoxContainer.new()
	l_vbox.set_anchors_preset(Control.PRESET_CENTER)
	l_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	l_vbox.add_theme_constant_override("separation", 16)
	loading_overlay.add_child(l_vbox)
	
	var l_tag = Label.new()
	l_tag.text = "CAMPUS LOCKDOWN // SECTOR INTEL"
	l_tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l_tag.add_theme_font_size_override("font_size", 16)
	l_tag.add_theme_color_override("font_color", Color(0.9, 0.3, 0.3))
	l_vbox.add_child(l_tag)
	
	var l_title = Label.new()
	l_title.name = "LoadingTitle"
	l_title.text = "LEVEL 2 - ACADEMIC BLOCK"
	l_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l_title.add_theme_font_size_override("font_size", 48)
	l_title.add_theme_color_override("font_color", Color(1.0, 0.25, 0.25))
	l_vbox.add_child(l_title)
	
	var l_desc = Label.new()
	l_desc.name = "LoadingDesc"
	l_desc.text = "Classrooms & 1st Floor Landing Atrium\nGrey terrazzo floors, black metal railings, and rows of desks.\nOpen stairwell is an impassable drop. Secure keycards to evacuate."
	l_desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l_desc.add_theme_font_size_override("font_size", 18)
	l_desc.add_theme_color_override("font_color", Color(0.92, 0.90, 0.85))
	l_vbox.add_child(l_desc)
	
	var l_prompt = Label.new()
	l_prompt.name = "LoadingPrompt"
	l_prompt.text = "\nPRESS ENTER TO ENTER SECTOR"
	l_prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l_prompt.add_theme_font_size_override("font_size", 22)
	l_prompt.add_theme_color_override("font_color", Color(1.0, 0.9, 0.2))
	l_vbox.add_child(l_prompt)
	add_child(loading_overlay)

func _create_screen_panel(p_name: String) -> Control:
	var c = Control.new()
	c.name = p_name
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.visible = false
	
	var dim = ColorRect.new()
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0.04, 0.05, 0.06, 0.88)
	c.add_child(dim)
	return c

func show_screen(state: ScreenState) -> void:
	current_screen = state
	
	title_overlay.visible = (state == ScreenState.TITLE)
	loading_overlay.visible = (state == ScreenState.LOADING)
	pause_overlay.visible = (state == ScreenState.PAUSED)
	level_complete_overlay.visible = (state == ScreenState.LEVEL_COMPLETE)
	victory_overlay.visible = (state == ScreenState.VICTORY)
	game_over_overlay.visible = (state == ScreenState.GAME_OVER)
	time_up_overlay.visible = (state == ScreenState.TIME_UP)
	
	hud_container.visible = (state == ScreenState.PLAYING or state == ScreenState.PAUSED)
	get_tree().paused = (state != ScreenState.PLAYING and state != ScreenState.TITLE and state != ScreenState.LOADING)

func show_loading(level_index: int, level_data: Dictionary) -> void:
	var l_bg = loading_overlay.get_node_or_null("LoadingBackground") as TextureRect
	var l_title = loading_overlay.get_node_or_null("VBoxContainer/LoadingTitle") as Label
	var l_desc = loading_overlay.get_node_or_null("VBoxContainer/LoadingDesc") as Label
	
	var level_name = level_data.get("name", "ACADEMIC BLOCK")
	if l_title != null:
		l_title.text = level_name
	
	var loading_path = level_data.get("loading_image", AssetMap.PATH_LOADING_ATRIUM if level_index == 1 else AssetMap.PATH_LOADING_CORRIDOR)
	if l_bg != null:
		var tex = AssetMap.load_texture_safe(loading_path)
		if tex == null:
			tex = AssetMap.load_texture_safe(AssetMap.PATH_LOADING_ATRIUM)
		if tex != null:
			l_bg.texture = tex
	
	if l_desc != null:
		if level_index == 1:
			l_desc.text = "ACADEMIC BLOCK // 1ST FLOOR LANDING & CLASSROOMS\n- Terrazzo stone-chip corridors and central atrium railings.\n- Desks arranged in rows: use walkable aisles for stealth.\n- Stairwell opening is an impassable drop. Secure 2 Keycards to escape."
		elif level_index == 0:
			l_desc.text = "TUTORIAL // CLASSROOM & ATRIUM PERIMETER\n- Evacuate the classroom, search between desk rows.\n- Follow the terrazzo corridor to the extraction point."
		else:
			l_desc.text = "CAMPUS RESTRICTED SECTOR\n- Deep containment breach. Keycards required for evacuation."
	
	show_screen(ScreenState.LOADING)

func set_player(player: Node2D) -> void:
	player_ref = player
	if player_ref != null:
		if player_ref.has_signal("health_changed"):
			player_ref.health_changed.connect(_on_health_changed)
		if player_ref.has_signal("stamina_changed"):
			player_ref.stamina_changed.connect(_on_stamina_changed)
		if player_ref.has_signal("battery_changed"):
			player_ref.battery_changed.connect(_on_battery_changed)
		if player_ref.has_signal("inventory_changed"):
			player_ref.inventory_changed.connect(_on_inventory_changed)
		if player_ref.has_signal("died"):
			player_ref.died.connect(_on_player_died)
		
		if "health" in player_ref and "max_health" in player_ref:
			_on_health_changed(player_ref.health, player_ref.max_health)
		if "stamina" in player_ref and "max_stamina" in player_ref:
			_on_stamina_changed(player_ref.stamina, player_ref.max_stamina)
		if "battery" in player_ref and "max_battery" in player_ref:
			_on_battery_changed(player_ref.battery, player_ref.max_battery)
		if "keycards" in player_ref and "medkits" in player_ref:
			_on_inventory_changed(player_ref.keycards, player_ref.medkits)

func _on_health_changed(cur: float, mx: float) -> void:
	if hp_bar != null:
		hp_bar.value = cur
		hp_bar.max_value = mx
	if hp_label != null:
		hp_label.text = str(int(cur))

func _on_stamina_changed(cur: float, mx: float) -> void:
	if stamina_bar != null:
		stamina_bar.value = cur
		stamina_bar.max_value = mx
	if stamina_label != null:
		stamina_label.text = str(int((cur / mx) * 100)) + "%"

func _on_battery_changed(cur: float, mx: float) -> void:
	if battery_label != null:
		battery_label.text = "BAT: " + str(int((cur / mx) * 100)) + "%"

func _on_inventory_changed(cards: int, meds: int) -> void:
	stat_cards_collected = cards
	if medkits_label != null:
		medkits_label.text = "MED: " + str(meds) + " [Q]"

func _on_player_died() -> void:
	show_screen(ScreenState.GAME_OVER)

func update_level_info(_level_name: String, required_cards: int, current_cards: int) -> void:
	if cards_label != null:
		cards_label.text = "CARD: " + str(current_cards) + "/" + str(required_cards)
	
	if current_cards < required_cards:
		var needed = required_cards - current_cards
		objective_label.text = "OBJECTIVE: Find Keycards (" + str(current_cards) + "/" + str(required_cards) + ")"
		extraction_status_label.text = "EXTRACTION LOCKED (Need " + str(needed) + " more)"
		extraction_status_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
	else:
		objective_label.text = "OBJECTIVE: Reach the Extraction Point!"
		extraction_status_label.text = "EXTRACTION OPEN!"
		extraction_status_label.add_theme_color_override("font_color", Color(0.2, 0.95, 0.5))

func update_timer(seconds: float) -> void:
	time_left = max(0.0, seconds)
	stat_time_left = time_left
	var mins = int(time_left) / 60
	var secs = int(time_left) % 60
	var time_str = "%02d:%02d" % [mins, secs]
	if timer_label != null:
		timer_label.text = "TIME: " + time_str
		if time_left < 60.0:
			var blink = int(time_left * 4.0) % 2 == 0
			timer_label.add_theme_color_override("font_color", Color(1.0, 0.2, 0.2) if blink else Color.WHITE)
		else:
			timer_label.add_theme_color_override("font_color", Color.WHITE)
	
	if time_left <= 0.0 and current_screen == ScreenState.PLAYING:
		show_screen(ScreenState.TIME_UP)

func update_threat(is_threat: bool) -> void:
	threat_nearby = is_threat
	if threat_label != null:
		threat_label.visible = threat_nearby
		if threat_nearby:
			var blink = int(Time.get_ticks_msec() / 250) % 2 == 0
			threat_label.modulate = Color(1.0, 0.2, 0.2, 1.0 if blink else 0.4)

func update_objective_compass(player_pos: Vector2, target_pos: Vector2) -> void:
	nearest_objective_pos = target_pos
	if compass_arrow == null:
		return
	
	var dist = player_pos.distance_to(target_pos)
	if dist < 65.0 or target_pos == Vector2.ZERO:
		compass_arrow.visible = false
		return
	
	compass_arrow.visible = true
	var dir = (target_pos - player_pos).normalized()
	compass_arrow.rotation = dir.angle()
	
	var vp_size = get_viewport().get_visible_rect().size
	var center = vp_size * 0.5
	var edge_offset = min(vp_size.x * 0.44, vp_size.y * 0.42)
	compass_arrow.position = center + dir * edge_offset

func show_level_complete(time_remaining: float, cards: int) -> void:
	var mins = int(time_remaining) / 60
	var secs = int(time_remaining) % 60
	var stats_lbl = level_complete_overlay.get_node_or_null("VBoxContainer/StatsLabel")
	if stats_lbl is Label:
		stats_lbl.text = "Time Left: %02d:%02d\nKeycards Secured: %d\nSupplies Scavenged" % [mins, secs, cards]
	show_screen(ScreenState.LEVEL_COMPLETE)

func _process(_delta: float) -> void:
	if vignette_rect != null and player_ref != null:
		var cur_hp = player_ref.health if "health" in player_ref else 100.0
		if cur_hp < 40.0 and cur_hp > 0:
			var hp_factor = 1.0 - (cur_hp / 40.0)
			var pulse = 0.5 + 0.5 * sin(Time.get_ticks_msec() * 0.007)
			vignette_rect.color = Color(0.85, 0.05, 0.05, hp_factor * 0.55 * pulse)
		else:
			vignette_rect.color = Color(0, 0, 0, 0)
	
	_handle_menu_inputs()

func _handle_menu_inputs() -> void:
	match current_screen:
		ScreenState.TITLE:
			if Input.is_action_just_pressed("ui_accept"):
				start_game_requested.emit()
		
		ScreenState.LOADING:
			if Input.is_action_just_pressed("ui_accept"):
				show_screen(ScreenState.PLAYING)
		
		ScreenState.PLAYING:
			if Input.is_action_just_pressed("pause"):
				show_screen(ScreenState.PAUSED)
			elif Input.is_action_just_pressed("restart"):
				restart_requested.emit()
		
		ScreenState.PAUSED:
			if Input.is_action_just_pressed("pause"):
				show_screen(ScreenState.PLAYING)
			elif Input.is_action_just_pressed("restart"):
				restart_requested.emit()
		
		ScreenState.LEVEL_COMPLETE:
			if Input.is_action_just_pressed("ui_accept"):
				next_level_requested.emit()
		
		ScreenState.VICTORY:
			if Input.is_action_just_pressed("ui_accept"):
				title_requested.emit()
		
		ScreenState.GAME_OVER, ScreenState.TIME_UP:
			if Input.is_action_just_pressed("restart"):
				restart_requested.emit()
