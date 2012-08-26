/*globals Drawing: true, Controls: true, Sprites: true, Game: true, Map: true */
"use strict";

window.onload = function()
{
	var width = 37;
	var height = 37;
	var gridSize = 16;
	$("#loading").css("display", "none");
	var canvas = $("#game").get(0);
	canvas.width = 592;
	canvas.height = 592;
	var turn = 1;

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

	var music = $("#music").get(0);

	music.loop = true;
	music.play();

	var terrainTiles = [null, sprites.grass, sprites.rock];
	var map = new Map();

	var reset = function()
	{
		turn = 1;
		map = new Map();
		Game.reset();
	};

	var pick = function(set)
	{
		return set[Math.floor(Math.random() * set.length)];
	};

	var mapEditLoop = function()
	{
		if(frameRequest) window.cancelAnimationFrame(frameRequest);
		frameRequest = window.requestAnimationFrame(mapEditLoop);

		if(controls.buttonState[1] && controls.buttonState[1].end )
		{
			if(controls.mousePosition !== null)
			{
				var x = Math.floor(controls.mousePosition[0] / gridSize);
				var y = Math.floor(controls.mousePosition[1] / gridSize);

				map.setScreenTile(x, y, (map.getScreenTile(x, y) + 1) % terrainTiles.length || 0);
			}
			controls.buttonState[1] = null;
		}

		draw();
	};

	var loop = function()
	{
		if(frameRequest) window.cancelAnimationFrame(frameRequest);
		frameRequest = window.requestAnimationFrame(loop);

		update();
		ui();
		draw();
	};

	var ailoop = function()
	{
		// Game loop during the AI turn

		if(frameRequest) window.cancelAnimationFrame(frameRequest);
		frameRequest = window.requestAnimationFrame(ailoop);

		aiupdate();
		draw();
	};

	var update = function()
	{
		var leftMouse = controls.buttonState[1];
		var i;
		controls.buttonState[1] = null;

		if(leftMouse && leftMouse.end)
		{
			var gridx = Math.floor(leftMouse.start[0] / gridSize);
			var gridy = Math.floor(leftMouse.start[1] / gridSize);
			if(leftMouse.event.shiftKey)
			{
				for(i = 0; i < Game.selected.items.length; i++)
				{
					var item = Game.selected.items[i];
					if(item.side === 0 && item.setTarget)
					{
						item.setTarget(gridx, gridy);
						item.active = true;
					}
				}
			}
			else
			{
				var object = map.objectAt(gridx, gridy);

				if(leftMouse.event.ctrlKey)
				{
					Game.selected.toggle(object);
				}
				else
				{
					Game.selected.clear();
					Game.selected.add(object);
				}
			}
		}

		if(controls.keyState[37]) // LEFT
		{
			map.xscroll -= 1;
		}
		if(controls.keyState[38]) // UP
		{
			map.yscroll -= 1;
		}
		if(controls.keyState[39]) // RIGHT
		{
			map.xscroll += 1;
		}
		if(controls.keyState[40]) // DOWN
		{
			map.yscroll += 1;
		}

		if(map.xscroll < 0) map.xscroll = 0;
		if(map.xscroll > map.width - width) map.xscroll = map.width - width;
		if(map.yscroll < 0) map.yscroll = 0;
		if(map.yscroll > map.height - height) map.yscroll = map.height - height;

		//controls.keyState = {};
		for(i = 0; i < Game.units.length; i++)
		{
			var unit = Game.units[i];
			if(unit.side === 0)
			{
				unit.tick();
			}
		}
	};

	var aiupdate = function()
	{
		endAITurn();
	};

	var aiplan = function()
	{

	};

	var draw = function()
	{
		var x, y, index, object, tile, i, j;

		drawing.clear();

		for(y = 0; y < height; y++)
		{
			for(x = 0; x < width; x++)
			{
				tile = map.getScreenTile(x, y);
				if(tile > 0)
				{
					drawing.sprite(terrainTiles[tile], x * gridSize, y * gridSize);
				}
			}
		}

		var objects = map.visibleObjects(width, height);

		for(index = 0; index < objects.length; index++)
		{
			object = objects[index];
			drawing.sprite(sprites[object.sprite], (object.x - map.xscroll) * gridSize, (object.y - map.yscroll) * gridSize);
		}
	};

	var ui = function()
	{
		$(".unit-selection li").remove();
		for(var i = 0; i < Game.selected.items.length; i++)
		{
			var item = Game.selected.items[i];
			$(".unit-selection").append($("<li><img class='unit-icon' src='" + /*sprites[item.sprite].toDataURL()*/'' + "'/><div class='name'>" + item.name + "</div><div class='health'>" + item.health + "</div>" + (item.speed ? "<div class='move'>" + item.moveLeft + "/" + item.speed + "</div>" : "" ) + "</li>"));
		}
	};

	var endAITurn = function()
	{
		var i;

		for(i = 0; i < Game.units.length; i++)
		{
			var unit = Game.units[i];
			if(unit.side === 0)
			{
				unit.startTurn();
			}
		}

		for(i = 0; i < Game.buildings.length; i++)
		{
			var building = Game.buildings[i];
			if(building.side === 0)
			{
				building.startTurn();
			}
		}

		loop();
		turn++;
	};

	Game.endTurn = function()
	{
		ailoop();
	};

	Game.stopMusic = function(){ music.pause(); };

	drawing.focus();
	//mapEditLoop();
	loop();
};
