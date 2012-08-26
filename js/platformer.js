/*globals Drawing: true, Controls: true, Sprites: true, Levels: true */
"use strict";

window.onload = function()
{
	var width = 1024;
	var height = 768;

	var canvas = $("#game").get(0);
	canvas.width = width;
	canvas.height = height;

	var drawing = new Drawing(canvas);
	var controls = new Controls(canvas);
	var frameRequest = null;
	var sprites = new Sprites(16, $("#sprites").get(0),
	{
		"spawner": [0, 0, 2, 2],
		"temple": [2, 0, 3, 2],
		"workshop": [5, 0, 2, 2],
		"grass": [0, 6],
		"rock": [1, 6],
		"soldier": [2, 6],
		"knight": [3, 6],
		"heart": [0, 7],
		"boot": [1, 7]
	});

	window.Music = $("#music").get(0);

	window.Music.loop = true;
//	window.Music.play();

	var level, lives, player = {}, xscroll, standing, direction, flashing, bullets, shootDelay;

	var reset = function()
	{
		level = 1;
		lives = 3;
		player = {x:0, y: 17, dx: 0, dy: 0};
		xscroll = 0;
		standing = true;
		direction = 1;
		flashing = 60;
		bullets = [];
		shootDelay = 0;
	};

	reset();

	var pick = function(set)
	{
		return set[Math.floor(Math.random() * set.length)];
	};

	var loop = function()
	{
		if(frameRequest) window.cancelAnimationFrame(frameRequest);
		frameRequest = window.requestAnimationFrame(loop);

		update();
		draw();
	};

	var die = function()
	{
		lives--;
		if(lives < 0) lose();
		else reset();
	};

	var win = function()
	{

	};

	var lose = function()
	{

	};

	var shoot = function()
	{
		if(shootDelay <= 0)
		{
			bullets.push({x: (player.x + 8) + 8 * direction, y: player.y + 8, speed: direction * 10});
			shootDelay = 15;
		}
	};

	var collision = function(x1, y1, x2, y2, object)
	{
		var cleft = x1 + 16 <= object[0] && x2 + 16 >= object[0];
		var cright = x1 >= object[0] + object[2] && x2 <= object[0] + object[2];
		var ctop = y1 >= object[1] + object[3] && y2 <= object[1] + object[3];
		var cbottom = y1 + 16 <= object[1] && y2 + 16 >= object[1];

		var ox = x2 + 16 >= object[0] && x2 <= object[0] + object[2];
		var oy = y2 + 16 >= object[1] && y2 <= object[1] + object[3];

		var collide = {l: false, r: false, t: false, b: false};

		if(cleft && oy)
		{
			collide.l = true;
		}
		if(cright && oy)
		{
			collide.r = true;
		}
		if(ctop && ox)
		{
			collide.t = true;
		}
		if(cbottom && ox)
		{
			collide.b = true;
		}

		return collide;
	};

	var update = function()
	{
		var i, object, endx, endy;

		shootDelay--;

		// Player controls
		if(controls.keyState[37] || controls.keyState[65]) // LEFT or A
		{
			player.dx = Math.max(player.dx - 2, -5);
			direction = -1;
		}
		if(controls.keyState[38] || controls.keyState[87]) // UP or W
		{
			if(standing)
			{
				player.dy = 20;
			}
		}
		if(controls.keyState[39] || controls.keyState[68]) // RIGHT or D
		{
			player.dx = Math.min(player.dx + 2, 5);
			direction = 1;
		}
		if(controls.keyState[32]) // SPACE
		{
			shoot();
		}

		endx = player.x + player.dx;
		endy = player.y + player.dy;

		// Collisions and movement
		standing = false;
		for(i in Levels[level - 1].objects)
		{
			object = Levels[level - 1].objects[i];
			var collide = collision(player.x, player.y, endx, endy, object);

			if(collide.l)
			{
				endx = object[0] - 16;
				player.dx = -4;
			}
			if(collide.r)
			{
				endx = object[0] + object[2];
				player.dx = 4;
			}
			if(collide.t)
			{
				endy = object[1] + object[3];
				player.dy = 0;
				standing = true;
			}

			if((collide.l || collide.r || collide.t || collide.b) && object[4] === "water")
			{
				die();
				return;
			}
		}

		player.x = endx;
		player.y = endy;

		// Check for death and end of level
		if(player.x < 0) player.x = 0;
		if(player.x > Levels[level - 1].width)
		{
			win();
			return;
		}
		if(player.y < 0)
		{
			die();
			return;
		}

		// Sound effects

		// Shooting/bullets
		for(i in bullets)
		{
			bullets[i].x += bullets[i].speed;
		}

		// Update monsters

		// Friction
		if(player.dx > 0) player.dx--;
		if(player.dx < 0) player.dx++;
		player.dy--;

		// Scrolling
		if(player.x - xscroll > canvas.width - 300) xscroll = player.x - canvas.width + 300;
		if(xscroll > player.x - 300) xscroll = player.x - 300;

		if(xscroll < 0) xscroll = 0;
		if(xscroll > Levels[level - 1].width - canvas.width) xscroll = Levels[level - 1].width - canvas.width;

		if(flashing > 0) flashing--;
	};

	var colours = {
		"platform": "white",
		"player": "red",
		"monster": "yellow",
		"water": "blue",
		"bullet": "green"
	};

	var draw = function()
	{
		var i;
		drawing.clear();
		if(flashing === 0 || flashing % 3 === 0)
			drawing.rect(player.x - xscroll, player.y, 16, 16, colours.player);

		for(i = 0; i < Levels[level - 1].objects.length; i++)
		{
			var o = Levels[level - 1].objects[i];
			drawing.rect(o[0] - xscroll, o[1], o[2], o[3], colours[o[4]]);
		}

		for(i = 0; i < Levels[level - 1].monsters.length; i++)
		{
			var m = Levels[level - 1].monsters[i];
			drawing.rect(m[0] - xscroll, m[1], 16, 16, colours["monster"]);
		}

		for(i = 0; i < bullets.length; i++)
		{
			var b = bullets[i];
			drawing.rect(b.x - xscroll, b.y, 6, 2, colours["bullet"]);
		}
	};


	drawing.focus();
	loop();
};
