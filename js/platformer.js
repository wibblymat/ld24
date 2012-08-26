/*globals Drawing: true, Controls: true, Sprites: true, Levels: true */
"use strict";

window.onload = function()
{
	var width = 800;
	var height = 480;

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

	var sounds = {
		"boss": $("#boss-sound").get(0),
		"boss_dead": $("#boss-dead-sound").get(0),
		"boss_hit": $("#boss-hit-sound").get(0),
		"hurt": $("#hurt-sound").get(0),
		"jump": $("#jump-sound").get(0),
		"kill": $("#kill-sound").get(0),
		"missile": $("#missile-sound").get(0),
		"pickup": $("#pickup-sound").get(0),
		"shoot": $("#shoot-sound").get(0)
	};

	window.sounds = sounds;

	window.Music = $("#music").get(0);

	window.Music.loop = true;
//	window.Music.play();

	var frame, level, lives, player = {}, xscroll, scrolling, standing, direction, flashing, bullets, shootDelay, monsters, levelObjects, boss, missile, fossil;

	var reset = function()
	{
		level = 1;
		lives = 3;
		frame = 0;
		shootDelay = 0;
		newLevel();
	};

	var newLevel = function()
	{
		startLevel();
		splash($("#level" + level).get(0), loop);
	};

	var startLevel = function()
	{

		var i, object, monster;
		levelObjects = [];
		xscroll = 0;
		player = {x:0, y: 17, dx: 0, dy: 0};
		boss = null;
		monsters = [];
		missile = null;
		scrolling = true;
		bullets = [];
		direction = 1;
		flashing = 60;
		standing = true;
		fossil = false;

		for(i in Levels[level - 1].objects)
		{
			object = Levels[level - 1].objects[i];
			levelObjects.push({x: object[0], y: object[1], width: object[2], height: object[3], type: object[4]});
		}

		for(i in Levels[level - 1].monsters)
		{
			monster = Levels[level - 1].monsters[i];
			monsters.push({x: monster[0], y: monster[1], dx: monster[2], dy: 0});
		}
	};

	var pick = function(set)
	{
		return set[Math.floor(Math.random() * set.length)];
	};

	var loop = function()
	{
		if(frameRequest) window.cancelAnimationFrame(frameRequest);
		frameRequest = window.requestAnimationFrame(loop);

		if(update()) draw();
	};

	var die = function()
	{
		lives--;
		sounds.hurt.play();
		if(lives < 0) lose();
		else startLevel();
	};

	var win = function()
	{
		if(level < Levels.length) level++;
		else victory();
	};

	var victory = function()
	{
		splash($("#win").get(0), menu);
	};

	var lose = function()
	{
		splash($("#lose").get(0), menu);
	};

	var menu = function()
	{
		reset();
		loop();
	};

	var splash = function(image, continuation)
	{
		if(frameRequest) window.cancelAnimationFrame(frameRequest);
		var splashLoop = function()
		{
			frameRequest = window.requestAnimationFrame(splashLoop);

			for(var i in controls.keyState)
			{
				continuation();
				return;
			}
		};

		drawing.clear();
		drawing.context.drawImage(image, 0, 0);
		setTimeout(splashLoop, 1000);
		controls.keyState = {};
	};

	var shoot = function()
	{
		if(shootDelay <= 0)
		{
			sounds.shoot.play();
			bullets.push({x: (player.x + 8) + 8 * direction, y: player.y + 8, speed: direction * 10});
			shootDelay = 15;
		}
	};

	var collision = function(x1, y1, x2, y2, object)
	{
		var cleft = x1 + 16 <= object.x && x2 + 16 >= object.x;
		var cright = x1 >= object.x + object.width && x2 <= object.x + object.width;
		var ctop = y1 >= object.y + object.height && y2 <= object.y + object.height;
		var cbottom = y1 + 16 <= object.y && y2 + 16 >= object.y;

		var ox = x2 + 16 >= object.x && x2 <= object.x + object.width;
		var oy = y2 + 16 >= object.y && y2 <= object.y + object.height;

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

	var killmonster = function(index)
	{
		// TODO: Animation, SFX, etc.
		sounds.kill.play();
		monsters.splice(index, 1);
	};

	var update = function()
	{
		var i, j, object, endx, endy, collide, monster;

		frame = (frame + 1) % 120;

		if(frame === 0)
		{
			monsters.push({x: 1240, y: 460, dx: 1, dy: 0});
		}

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
		for(i in levelObjects)
		{
			object = levelObjects[i];
			collide = collision(player.x, player.y, endx, endy, object);

			if(collide.l)
			{
				endx = object.x - 16;
				player.dx = -4;
			}
			if(collide.r)
			{
				endx = object.x + object.width;
				player.dx = 4;
			}
			if(collide.t)
			{
				endy = object.y + object.height;
				player.dy = 0;
				standing = true;
			}
			if(collide.b)
			{
				endy = object.y - 16;
				player.dy = 0;
			}

			if((collide.l || collide.r || collide.t || collide.b) && object.type === "water")
			{
				die();
				return false;
			}
		}

		player.x = endx;
		player.y = endy;

		if(boss)
		{
			boss.tick();
			if(boss.firing)
			{
				boss.firing = false;
				sounds.missile.play();

				missile = {x: boss.x - 32, y: boss.y - 32};

				missile.dx = player.x - missile.x;
				missile.dy = player.y - missile.y;

				missile.speed = Math.sqrt(missile.dx*missile.dx + missile.dy*missile.dy);
				missile.dx = Math.round(missile.dx * 7 / missile.speed);
				missile.dy = Math.round(missile.dy * 7 / missile.speed);
			}
		}

		if(missile)
		{
			missile.x += missile.dx;
			missile.y += missile.dy;

			if(missile.x < player.x + 16 && missile.x + 16 > player.x && missile.y < player.y + 16 && missile.y + 16 > player.y)
			{
				die();
				return false;
			}
		}

		for(j in monsters)
		{
			monster = monsters[j];
			endx = monster.x + monster.dx;
			endy = monster.y + monster.dy;

			collide = collision(monster.x, monster.y, endx, endy, {x: player.x, y: player.y, width: 16, height: 16});
			if(collide.l || collide.r || collide.t || collide.b)
			{
				die();
				return false;
			}

			for(i in levelObjects)
			{
				object = levelObjects[i];
				collide = collision(monster.x, monster.y, endx, endy, object);

				if(collide.l)
				{
					endx = object.x - 16;
					monster.dx *= -1;
				}
				if(collide.r)
				{
					endx = object.x + object.width;
					monster.dx *= -1;
				}
				if(collide.t)
				{
					endy = object.y + object.height;
					monster.dy = 0;
				}

				if((collide.l || collide.r || collide.t || collide.b) && object.type === "water")
				{
					killmonster(j);
					break;
				}
			}

			monster.x = endx;
			monster.y = endy;

			if(monster.x + 16 >= Levels[level - 1].width)
			{
				monster.dx *= -1;
				monster.x = Levels[level - 1].width - 17;
			}

			monster.dy--;
		}

		// Check for death and end of level
		if(player.x < 0) player.x = 0;
		if(player.x > Levels[level - 1].width - 100 && fossil)
		{
			win();
			return false;
		}
		else if(player.x > Levels[level - 1].width)
		{
			player.x = Levels[level - 1].width - 1;
		}

		if(player.y < 0)
		{
			die();
			return false;
		}

		// Shooting/bullets
		for(i in bullets)
		{
			var bullet = bullets[i];
			var left = Math.min(bullet.x, bullet.x + bullet.speed);
			var right = Math.max(bullet.x, bullet.x + bullet.speed);

			for(j in monsters)
			{
				monster = monsters[j];

				if(left < monster.x + 16 && right > monster.x && monster.y < bullet.y && monster.y + 16 > bullet.y)
				{
					killmonster(j);
					bullets.splice(i, 1);
					break;
				}
			}

			if(boss)
			{
				if(left < boss.x + 32 && right > boss.x - 32  && bullet.y < boss.y + 32 && bullet.y > boss.y - 32)
				{
					boss.health--;
					if(boss.health <= 0)
					{
						sounds.boss_dead.play();
						boss = null;
						fossil = true;
					}
					else
					{
						sounds.boss_hit.play();
					}
					bullets.splice(i, 1);
				}
			}

			bullet.x += bullet.speed;
		}

		// Friction
		if(player.dx > 0) player.dx--;
		if(player.dx < 0) player.dx++;
		player.dy--;

		// Scrolling
		if(scrolling)
		{
			if(player.x - xscroll > canvas.width - 300) xscroll = player.x - canvas.width + 300;
			if(xscroll > player.x - 300) xscroll = player.x - 300;

			if(xscroll < 0) xscroll = 0;
			if(xscroll > Levels[level - 1].width - canvas.width)
			{
				xscroll = Levels[level - 1].width - canvas.width;
				scrolling = false;
				boss = new Levels[level - 1].boss();
				boss.x += (Levels[level - 1].width - 100);
			}
		}

		if(flashing > 0) flashing--;

		return true;
	};

	var colours = {
		"platform": "white",
		"player": "red",
		"monster": "yellow",
		"missile": "yellow",
		"water": "blue",
		"bullet": "green"
	};

	var draw = function()
	{
		var i, colour;
		drawing.clear();

		for(i = 0; i < lives; i++)
		{
			drawing.sprite(sprites.heart, 10 + i * 16, canvas.height - 10);
		}

		drawing.write("Level " + level, 70, canvas.height - 10, "rgb(200, 200, 200)");

		if(flashing === 0 || flashing % 3 === 0)
			drawing.rect(player.x - xscroll, player.y, 16, 16, colours.player);

		for(i = 0; i < levelObjects.length; i++)
		{
			var o = levelObjects[i];
			drawing.rect(o.x - xscroll, o.y, o.width, o.height, colours[o.type]);
		}

		for(i = 0; i < monsters.length; i++)
		{
			var m = monsters[i];
			drawing.rect(m.x - xscroll, m.y, 16, 16, colours["monster"]);
		}

		for(i = 0; i < bullets.length; i++)
		{
			var b = bullets[i];
			drawing.rect(b.x - xscroll, b.y, 6, 2, colours["bullet"]);
		}

		if(boss !== null)
		{
			colour = [ Math.floor( Math.random() * 256 ), Math.floor( Math.random() * 256 ), Math.floor( Math.random() * 256 ) ];
			var randcolour = "rgb( " + colour[ 0 ] + ", " + colour[ 1 ] + ", " + colour[ 2 ] + " )";

			drawing.rect(boss.x - xscroll - 32, boss.y - 32, 64, 64, randcolour);
		}

		if(fossil)
		{
			colour = "rgb(64, 128, 200)";
			var left = Levels[level - 1].width - xscroll - 100;

			drawing.rect(left, 16, 5, 40, colour);
			drawing.rect(left + 70, 16, 5, 40, colour);
			drawing.rect(left, 16, 70, 5, colour);
			drawing.rect(left, 56, 75, 5, colour);
			drawing.rect(left + 5, 16 + 5, 65, 35, "rgb(90, 160, 255)");
		}

		if(missile)
		{
			drawing.rect(missile.x - xscroll, missile.y, 16, 16, colours["missile"]);
		}
	};


	drawing.focus();
	reset();
};
