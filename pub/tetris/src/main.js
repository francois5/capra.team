var game = new Phaser.Game(984, 672, Phaser.AUTO, 'tetris',
			   { preload: preload,
			     create: create,
			     update: update ,
			     render: render });

function preload() {
    game.stage.disableVisibilityChange = true;
    
    game.load.image('tile_0',  'assets/img/whitetile.png'); // 0 (void)
    game.load.image('tile_8',   'assets/img/greytile.png'); // 8 (wall)
    game.load.image('tile_1',   'assets/img/bluetile.png'); // 1
    game.load.image('tile_2',  'assets/img/greentile.png'); // 2
    game.load.image('tile_3',  'assets/img/lbluetile.png'); // 3
    game.load.image('tile_4', 'assets/img/orangetile.png'); // 4
    game.load.image('tile_5', 'assets/img/purpletile.png'); // 5
    game.load.image('tile_6',    'assets/img/redtile.png'); // 6
    game.load.image('tile_7', 'assets/img/yellowtile.png'); // 7

    game.load.spritesheet('img_music', 'assets/img/music.png', 30, 30);
    game.load.spritesheet('img_sound', 'assets/img/sound.png', 30, 30);
    
    game.load.spritesheet('btn', 'assets/img/button_sprite_sheet.png', 260, 100);

    game.load.audio('success', ['assets/sound/success.mp3', 'assets/sound/success.ogg']);
    game.load.audio('land', ['assets/sound/land.mp3', 'assets/sound/land.ogg']);
    game.load.audio('rotate', ['assets/sound/rotate.mp3', 'assets/sound/rotate.ogg']);
    game.load.audio('gameover', ['assets/sound/gameover.mp3', 'assets/sound/gameover.ogg']);
    game.load.audio('music', ['assets/sound/katyusha-8bit.mp3', 'assets/sound/katyusha-8bit.ogg']);
    game.load.audio('hover', ['assets/sound/wooden_hover.mp3', 'assets/sound/wooden_hover.ogg']);
}
// position of the tetris grid
var ox = 300;
var oy = 0;

var next_tet_ox = 684;
var next_tet_oy = 0;

var score = 0;
var max_score = 0;

// type of tetriminos (the one that is falling now and the next one)
var next_tet_to_spawn = rand_tet();
var tet_spawned = next_tet_to_spawn;

var game_state = Object.freeze({
    MENU: 0,
    TET_TO_SPAWN: 1,
    TET_TO_FALL: 2
});
var state = game_state.MENU;

// position and orientation of the falling tetriminos
var tet_ox = 4;
var tet_oy = 3;
var tet_orientation = 0;

// tetris grid
var map = [
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,0,0,0,0,0,0,0,0,0,0,8],
    [8,8,8,8,8,8,8,8,8,8,8,8],
];

// tetris grid with only the falling tetriminos
var tet_only_map = [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
];

// images grid
var images = [
    new Array(12), new Array(12), new Array(12), new Array(12),
    new Array(12), new Array(12), new Array(12), new Array(12),
    new Array(12), new Array(12), new Array(12), new Array(12),
    new Array(12), new Array(12), new Array(12), new Array(12),
    new Array(12), new Array(12), new Array(12), new Array(12),
    new Array(12)
];

var next_tet_map = [
    [8,8,8,8,8],
    [0,0,0,0,8],
    [0,0,0,0,8],
    [0,0,0,0,8],
    [0,0,0,0,8],
    [8,8,8,8,8],
];

var next_tet_images = [
    new Array(5),
    new Array(5),
    new Array(5),
    new Array(5),
    new Array(5),
    new Array(5)
];

// to handle inputs
var downKey;
var leftKey;
var rightKey;
var spaceKey;
var button;

// time of the next tetriminos falling/spawn
var next_fall = 0;

// time when we can accept another user action
var next_action = 0;

var game_start_time;
var music_speed = 1;
var first_spawn = true;
var img_music, img_sound, soundOn = true;
var pause_btn;
var unpause_btn;

var pauseDurationTotal = 0;

function create() {
    var style = { font: "bold 30px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    levelText = game.add.text(180, 0, "Level "+music_speed, style);
    scoreText = game.add.text(10, 0, "Score: "+score, style);
    max_scoreText = game.add.text(10, 40, "Max score: "+max_score, style);

    var style2 = { font: "bold 25px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    game.add.text(700, 220, "Controls", style);
    game.add.text(700, 240, "------------", style);
    game.add.text(700, 265, "Space: rotate", style2);
    game.add.text(700, 290, "Down : go down faster", style2);
    game.add.text(700, 315, "Left : go left", style2);
    game.add.text(700, 345, "Right: go right ", style2);
    
    music = new WarpedSound(game, 'music', 1, true);
    snd_rotate = game.add.audio('rotate', 0.5, false, true);
    snd_land = game.add.audio('land');
    snd_success = game.add.audio('success', 0.5, false, true);
    snd_gameover = game.add.audio('gameover', 0.3, false, true);
    snd_hover = game.add.audio('hover');
    
    game.stage.backgroundColor = '#000';
    init_images(images);
    init_images(next_tet_images);
    
    draw_map(ox, oy, map, images);
    draw_map(next_tet_ox, next_tet_oy, next_tet_map, next_tet_images);
    update_max_score(localStorage.getItem('tetris_max_score'));

    music_btn();
    sound_btn();
    put_pause_btn();
    game.input.onDown.add(unpause, self);
    
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    button = game.add.button(20, 90, 'btn', actionOnClick, this, 2, 1, 0);
    button.events.onInputOver.add(overSound, this);
}

function music_btn() {
    if(img_music != null)
	img_music.destroy();
    img_music = game.add.button(920, 30, 'img_music', music_on_off, this, 2, 1, 2);
    img_music.events.onInputOver.add(overSound, this);
}

function sound_btn() {
    if(img_sound != null)
	img_sound.destroy();
    img_sound = game.add.button(880, 30, 'img_sound', sound_on_off, this, 1, 2, 1);
    img_sound.events.onInputOver.add(overSound, this);
}

function overSound() {
    if(soundOn)
	snd_hover.play();
}

function music_on_off() {
    if(music.isPlaying) {
	music.stop();
	img_music.setFrames(2, 1, 2);
    }
    else {
	music.play();
	img_music.setFrames(1, 2, 1);
    }
}

function sound_on_off() {
    if(soundOn) {
	soundOn = false;
	img_sound.setFrames(2, 1, 2);
    }
    else {
	soundOn = true;
	img_sound.setFrames(1, 2, 1);
    }
}

function put_pause_btn() {
    if(pause_btn != null)
	pause_btn.destroy();
    var style = { font: "bold 30px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    pause_btn = game.add.text(860, 80, "PAUSE", style);
    pause_btn.inputEnabled = true;
    pause_btn.events.onInputOver.add(over, this);
    pause_btn.events.onInputOut.add(out, this);
    pause_btn.events.onInputDown.add(pause, this);
}

function pause() {
    pause_btn.destroy();
    game.paused = true;
    put_unpause_btn();
}

function over(item) {
    overSound();
    item.fill = "#a00909";
}

function out(item) {
    item.fill = "#fff";
}

function put_unpause_btn() {
    if(unpause_btn != null)
	unpause_btn.destroy();
    var style = { font: "bold 80px Arial", fill: "#a00909", boundsAlignH: "center", boundsAlignV: "middle" };
    unpause_btn = game.add.text(320, 250, "RESUME", style);
}

function unpause() {
    if(game.paused) {
	unpause_btn.destroy();
	game.paused = false;
	pauseDurationTotal += game.time.pauseDuration;
	put_pause_btn();
    }
}

function actionOnClick () {
    game_start_time = game.time.now;
    music.stop();
    music_on_off();
    update_score(0);
    update_music_speed(1);
    first_spawn = true;
    state = game_state.TET_TO_SPAWN;
    button.visible = false;
}

function update() {
    if(state != game_state.MENU) {
	var music_duration = 113*1000; //1min 53sec
	if((game.time.now - pauseDurationTotal - game_start_time) > music_speed * music_duration) {
	    if(music_speed < 7) {
		update_music_speed(music_speed+1);
		music.tweenSpeed(music_speed-((music_speed-1)*0.9), 0);
	    }
	}
	var need_drawing = false;
	var new_spawn = false;
	if(downKey.isDown && game.time.now > next_action) {
	    if(state == game_state.TET_TO_FALL) {
		tet_fall();
		next_action = game.time.now + 100-(7*(music_speed-1));
		need_drawing = true;
	    }
	}
	else if(leftKey.isDown && game.time.now > next_action) {
	    tet_left();
	    next_action = game.time.now + 200-(14*(music_speed-1));
	    need_drawing = true;
	}
	else if(rightKey.isDown && game.time.now > next_action) {
	    tet_right();
	    next_action = game.time.now + 200-(14*(music_speed-1));
	    need_drawing = true;
	}
	else if(spaceKey.isDown && game.time.now > next_action) {
	    tet_rotate();
	    next_action = game.time.now + 200-(14*(music_speed-1));
	    need_drawing = true;
	}
	if(landing(map, tet_only_map))
	    state = game_state.TET_TO_SPAWN;
	else
	    state = game_state.TET_TO_FALL;
	if(game.time.now > next_fall) {
	    if(state == game_state.TET_TO_SPAWN) {
		new_spawn = true;
		need_drawing = true;
	    }
	    else if(state == game_state.TET_TO_FALL) {
		tet_fall();
		need_drawing = true;
		if(first_spawn) {
		    draw_next_tet();
		    draw_map(next_tet_ox, next_tet_oy, next_tet_map, next_tet_images);
		    first_spawn = false;
		}
	    }
	    next_fall = game.time.now + 500-(70*(music_speed-1));
	}
	if(landing(map, tet_only_map))
	    state = game_state.TET_TO_SPAWN;
	if(need_drawing == true) {
	    if(new_spawn) {
		if(soundOn)
		    snd_land.play();
		check_full_lines(map);
		tet_spawn();
		draw_map(next_tet_ox, next_tet_oy, next_tet_map, next_tet_images);
	    }
	    draw_map(ox, oy, map, images);
	}
    }
}

function render() {
    //this.game.debug.text('GAME NOW: '+(game.time.now-pauseDurationTotal), 16, 280, 'red', 'Arial');
    //this.game.debug.text('START: '+game_start_time, 16, 300, 'red', 'Arial');
}

function update_music_speed(speed) {
    music_speed = speed;
    levelText.text = 'Level ' + music_speed;
}
function update_max_score(x) {
    max_score = x;
    max_scoreText.text = 'Max score: ' + max_score;
}
function update_score(x) {
    score = x;
    scoreText.text = 'Score: ' + score;
}

function check_full_lines(map) {
    for(var y = 0; y < 20; ++y) {
	var hole = false;
	for(var x = 1; x < 11; ++x) {
	    if(map[y][x] == 0) {
		hole = true;
		break;
	    }
	}
	if(!hole) {
	    if(soundOn)
		snd_success.play();
	    collapse(map, y);
	    update_score(score+1);
	}
    }
}

function collapse(map, row) {
    for(var y = row; y > 0; --y)
	for(var x = 1; x < 11; ++x)
	    map[y][x] = map[y-1][x];
}

function tet_spawn() {
    undraw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_orientation);
    tet_ox = 4;
    tet_oy = 3;
    draw_tet(tet_ox, tet_oy, tet_only_map, next_tet_to_spawn, next_tet_to_spawn, tet_orientation);
    undraw_tet(tet_ox, tet_oy, map, next_tet_to_spawn, next_tet_to_spawn, tet_orientation);
    if(collide(map, tet_only_map)) {
	game_over();
    }
    else {
	draw_tet(tet_ox, tet_oy, map, next_tet_to_spawn, next_tet_to_spawn, tet_orientation);
	tet_spawned = next_tet_to_spawn;
	next_tet_to_spawn = rand_tet();
	draw_next_tet();
	state = game_state.TET_TO_FALL;
    }
}

function draw_next_tet() {
    undraw_tet(0, 2, next_tet_map, tet_spawned, 0);
    draw_tet(0, 2, next_tet_map, next_tet_to_spawn, next_tet_to_spawn, 0);
}

function game_over() {
    music.play();
    music_on_off();
    if(soundOn)
	snd_gameover.play();
    state = game_state.MENU;
    button.visible = true;
    clean_board();
    if(score > max_score) {
	update_max_score(score);
	localStorage.setItem('tetris_max_score', max_score);
    }
}

function clean_board() {
    for(var x = 1; x < 11; ++x)
	for(var y = 0; y < 20; ++y) {
	    map[y][x] = 0;
	    tet_only_map[y][x] = 0;
	}	    
}

function tet_rotate() {
    if(soundOn)
	snd_rotate.play();
    undraw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_orientation);
    undraw_tet(tet_ox, tet_oy, map, tet_spawned, tet_orientation);
    tet_orientation_rotate();
    draw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_spawned, tet_orientation);
    if(collide(map, tet_only_map)) {
	undraw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_orientation);
	tet_orientation_rotate_undo();
	draw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_spawned, tet_orientation);
	draw_tet(tet_ox, tet_oy, map, tet_spawned, tet_spawned, tet_orientation);
    }
    else
	draw_tet(tet_ox, tet_oy, map, tet_spawned, tet_spawned, tet_orientation);
}

function tet_orientation_rotate() {
    tet_orientation += 1;
    if(tet_orientation > 3)
	tet_orientation = 0;
}

function tet_orientation_rotate_undo() {
    tet_orientation_rotate();
    tet_orientation_rotate();
    tet_orientation_rotate();
}

function tet_left() {
    undraw_tet(tet_ox, tet_oy, map, tet_spawned, tet_orientation);
    undraw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_orientation);
    tet_xy_move_left();
    draw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_spawned, tet_orientation);
    if(collide(map, tet_only_map)) {
	undraw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_orientation);
	tet_xy_move_left_undo();
	draw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_spawned, tet_orientation);
	draw_tet(tet_ox, tet_oy, map, tet_spawned, tet_spawned, tet_orientation);
    }
    else
	draw_tet(tet_ox, tet_oy, map, tet_spawned, tet_spawned, tet_orientation);
}

function tet_right() {
    undraw_tet(tet_ox, tet_oy, map, tet_spawned, tet_orientation);
    undraw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_orientation);
    tet_xy_move_right();
    draw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_spawned, tet_orientation);
    if(collide(map, tet_only_map)) {
	undraw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_orientation);
	tet_xy_move_right_undo();
	draw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_spawned, tet_orientation);
	draw_tet(tet_ox, tet_oy, map, tet_spawned, tet_spawned, tet_orientation);
    }
    else
	draw_tet(tet_ox, tet_oy, map, tet_spawned, tet_spawned, tet_orientation);
}

function tet_fall() {
    undraw_tet(tet_ox, tet_oy, map, tet_spawned, tet_orientation);
    undraw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_orientation);
    tet_oy += 1;
    draw_tet(tet_ox, tet_oy, map, tet_spawned, tet_spawned, tet_orientation);
    draw_tet(tet_ox, tet_oy, tet_only_map, tet_spawned, tet_spawned, tet_orientation);
}

function landing(map, tet_only_map) {
    undraw_tet(tet_ox, tet_oy, map, tet_spawned, tet_orientation);
    for(var x = 0; x < 12; ++x)
	for(var y = 0; y < 21; ++y)
	    if(tet_only_map[y][x] != 0 && map[y+1][x] != 0) {
		draw_tet(tet_ox, tet_oy, map, tet_spawned, tet_spawned, tet_orientation);
		return true;
	    }
    draw_tet(tet_ox, tet_oy, map, tet_spawned, tet_spawned, tet_orientation);
    return false;
}

function collide(map, tet_only_map) {
    for(var x = 0; x < 12; ++x)
	for(var y = 0; y < 21; ++y)
	    if(map[y][x] != 0 && tet_only_map[y][x] != 0)
		return true;
    return false;
}


function tet_xy_move_left() {
    tet_ox -= 1;
}

function tet_xy_move_left_undo() {
    tet_ox += 1;
}

function tet_xy_move_right() {
    tet_ox += 1;
}

function tet_xy_move_right_undo() {
    tet_ox -= 1;
}

function tet_xy_move_down() {
    tet_oy += 1;
}

function tet_xy_move_down_undo() {
    tet_oy -= 1;
}

function draw_map(ox, oy, map, images) {
    for(var x = 0; x < map[0].length; ++x)
	for(var y = 0; y < map.length; ++y) {
	    images[y][x].destroy();
	    images[y][x] = game.add.sprite(x*32+ox, y*32+oy, 'tile_'+String(map[y][x]));
	}
}

function rand_tet() {
    return Math.floor(Math.random() * 7) + 1;
}

function undraw_tet(ox, oy, map, n, orientation) {
    draw_tet(ox, oy, map, n, 0, orientation);
}

function draw_tet(ox, oy, map, n, texture, orientation) {
    if(n == 1)
	draw_tet_J(ox, oy, map, texture, orientation);
    else if(n == 2)
	draw_tet_S(ox, oy, map, texture, orientation);
    else if(n == 3)
	draw_tet_I(ox, oy, map, texture, orientation);
    else if(n == 4)
	draw_tet_L(ox, oy, map, texture, orientation);
    else if(n == 5)
	draw_tet_T(ox, oy, map, texture, orientation);
    else if(n == 6)
	draw_tet_Z(ox, oy, map, texture, orientation);
    else if(n == 7)
	draw_tet_O(ox, oy, map, texture, orientation);
}

function draw_tet_J(ox, oy, map, texture, orientation) {
    if(orientation == 0) {
	map[oy]   [ox]   = texture;
	map[oy]   [ox+1] = texture;
	map[oy]   [ox+2] = texture;
	map[oy+1] [ox+2] = texture;
    }
    else if(orientation == 1) {
	map[oy-1] [ox+1] = texture;
	map[oy]   [ox+1] = texture;
	map[oy+1] [ox+1] = texture;
	map[oy+1] [ox]   = texture;
    }
    else if(orientation == 2) {
	map[oy]   [ox]   = texture;
	map[oy+1] [ox]   = texture;
	map[oy+1] [ox+1] = texture;
	map[oy+1] [ox+2] = texture;
    }
    else if(orientation == 3) {
	map[oy-1] [ox]   = texture;
	map[oy-1] [ox+1] = texture;
	map[oy]   [ox]   = texture;
	map[oy+1] [ox]   = texture;
    }
}
function draw_tet_S(ox, oy, map, texture, orientation) {
    if(orientation == 0 || orientation == 2) {
	map[oy]   [ox+1] = texture;
	map[oy]   [ox+2] = texture;
	map[oy+1] [ox]   = texture;
	map[oy+1] [ox+1] = texture;
    }
    else if(orientation == 1 || orientation == 3) {
	map[oy-1] [ox]   = texture;
	map[oy]   [ox]   = texture;
	map[oy]   [ox+1] = texture;
	map[oy+1] [ox+1] = texture;
    }
}
function draw_tet_I(ox, oy, map, texture, orientation) {
    if(orientation == 0 || orientation == 2) {
	map[oy] [ox]   = texture;
	map[oy] [ox+1] = texture;
	map[oy] [ox+2] = texture;
	map[oy] [ox+3] = texture;
    }
    else if(orientation == 1 || orientation == 3) {
	map[oy-3] [ox+1] = texture;
	map[oy-2] [ox+1] = texture;
	map[oy-1] [ox+1] = texture;
	map[oy]   [ox+1] = texture;
    }
}
function draw_tet_L(ox, oy, map, texture, orientation) {
    if(orientation == 0) {
	map[oy]   [ox]   = texture;
	map[oy]   [ox+1] = texture;
	map[oy]   [ox+2] = texture;
	map[oy+1] [ox]   = texture;
    }
    else if(orientation == 1) {
	map[oy-1] [ox]   = texture;
	map[oy-1] [ox+1] = texture;
	map[oy]   [ox+1] = texture;
	map[oy+1] [ox+1] = texture;
    }
    else if(orientation == 2) {
	map[oy+1] [ox]   = texture;
	map[oy+1] [ox+1] = texture;
	map[oy+1] [ox+2] = texture;
	map[oy]   [ox+2] = texture;
    }
    else if(orientation == 3) {
	map[oy-1] [ox]   = texture;
	map[oy]   [ox]   = texture;
	map[oy+1] [ox]   = texture;
	map[oy+1] [ox+1] = texture;
    }
}
function draw_tet_T(ox, oy, map, texture, orientation) {
    if(orientation == 0) {
	map[oy]   [ox]   = texture;
	map[oy]   [ox+1] = texture;
	map[oy]   [ox+2] = texture;
	map[oy-1] [ox+1] = texture;
    }
    else if(orientation == 1) {
	map[oy]   [ox]   = texture;
	map[oy]   [ox+1] = texture;
	map[oy-1] [ox]   = texture;
	map[oy+1] [ox]   = texture;
    }
    else if(orientation == 2) {
	map[oy]   [ox+1] = texture;
	map[oy-1] [ox]   = texture;
	map[oy-1] [ox+1] = texture;
	map[oy-1] [ox+2] = texture;
    }
    else if(orientation == 3) {
	map[oy]   [ox]   = texture;
	map[oy]   [ox+1] = texture;
	map[oy-1] [ox+1] = texture;
	map[oy+1] [ox+1] = texture;
    }
}
function draw_tet_Z(ox, oy, map, texture, orientation) {
    if(orientation == 0 || orientation == 2 ) {
	map[oy]   [ox]   = texture;
	map[oy]   [ox+1] = texture;
	map[oy+1] [ox+1] = texture;
	map[oy+1] [ox+2] = texture;
    }
    else if(orientation == 1 || orientation == 3) {
	map[oy-1] [ox+1] = texture;
	map[oy]   [ox+1]   = texture;
	map[oy]   [ox] = texture;
	map[oy+1] [ox] = texture;
    }
}
function draw_tet_O(ox, oy, map, texture, orientation) {
    map[oy]   [ox]   = texture;
    map[oy]   [ox+1] = texture;
    map[oy+1] [ox]   = texture;
    map[oy+1] [ox+1] = texture;
}

function init_images(images) {
    for(var x = 0; x < images[0].length; ++x)
	for(var y = 0; y < images.length; ++y)
	    images[y][x] = game.add.sprite(0, 0, 'tile_3');
}
