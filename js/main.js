/*globals Drawing: true, Controls: true */
"use strict";

window.onload = function()
{
	var width = 32;
	var height = 24;
	var gridSize = 32;
	$("#loading").css("display", "none");
	var canvas = $("#game").get(0);
	canvas.width = width * gridSize;
	canvas.height = height * gridSize;

	var drawing = new Drawing(canvas);
	var controls = new Controls(canvas);
	var frameRequest = null;
	var tiles = [
		null, // So that 0 can mean empty
		$("#rocks").get(0),
		$("#grass").get(0)
	];
	var map = [];
	for(var i = 0; i < height; i++)
	{
		map[i] = [];
	}

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

				map[y][x] = (map[y][x] + 1) % tiles.length || 0;
			}
			controls.buttonState[1] = null;
		}

		draw();
	};

	var loop = function()
	{
		if(frameRequest) window.cancelAnimationFrame(frameRequest);
		frameRequest = window.requestAnimationFrame(loop);

		ai();
		draw();
	};

	var ai = function()
	{
	};

	var draw = function()
	{
		var x, y;

		drawing.clear();

		for(y = 0; y < height; y++)
		{
			for(x = 0; x < width; x++)
			{
				if(map[y][x] > 0)
				{
					drawing.sprite(tiles[map[y][x]], x * gridSize, y * gridSize);
				}
			}
		}
	};

	drawing.focus();
	loop();
};
