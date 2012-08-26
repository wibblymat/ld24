/*globals Game: true */
"use strict";

var Map = function()
{
	this.width = 64;
	this.height = 64;
	this.tiles = [];
	this.xscroll = 0;
	this.yscroll = 0;

	for(var i = 0; i < this.height; i++)
	{
		this.tiles[i] = [];
		for(var j = 0; j < this.width; j++)
		{
			this.tiles[i][j] = (i === 0 || j === 0 || i === this.width - 1 || j === this.height - 1) ? 2 : 1;
		}
	}

};

Map.prototype.objectAt = function(x, y, originOnly)
{
	originOnly = originOnly || false;
	var index, object;
	for(index in Game.buildings)
	{
		object = Game.buildings[index];

		if(originOnly)
		{
			if(object.x - this.xscroll === x && object.y - this.yscroll === y)
				return object;
		}
		else
		{
			if(x >= object.x - this.xscroll && x < object.x + object.width - this.xscroll && y >= object.y - this.yscroll && y < object.y + object.height - this.yscroll)
				return object;
		}
	}

	for(index in Game.units)
	{
		object = Game.units[index];

		if(originOnly)
		{
			if(object.x - this.xscroll === x && object.y - this.yscroll === y)
				return object;
		}
		else
		{
			if(x >= object.x - this.xscroll && x < object.x + object.width - this.xscroll && y >= object.y - this.yscroll && y < object.y + object.height - this.yscroll)
				return object;
		}
	}

	return null;
};

Map.prototype.visibleObjects = function(width, height)
{
	var objects = [];
	var object, index, screenx, screeny;

	for(index in Game.buildings)
	{
		object = Game.buildings[index];

		screenx = object.x - this.xscroll;
		screeny = object.y - this.yscroll;

		if(screenx + object.width >= 0 && screenx < width && screeny + object.height >= 0 && screeny < height)
			objects.push(object);
	}

	for(index in Game.units)
	{
		object = Game.units[index];

		screenx = object.x - this.xscroll;
		screeny = object.y - this.yscroll;

		if(screenx + object.width >= 0 && screenx < width && screeny + object.height >= 0 && screeny < height)
			objects.push(object);
	}

	return objects;
};

Map.prototype.getScreenTile = function(x, y)
{
	var realx = x + this.xscroll;
	var realy = y + this.yscroll;

	if(realx >= 0 && realx < this.width && realy >= 0 && realy < this.height)
	{
		return this.tiles[realy][realx];
	}

	return 0;
};

Map.prototype.setScreenTile = function(x, y, tile)
{
	var realx = x + this.xscroll;
	var realy = y + this.yscroll;

	if(realx >= 0 && realx < this.width && realy >= 0 && realy < this.height)
	{
		this.tiles[realy][realx] = tile;
	}
};
