/*globals Crafty: true */
"use strict";

var Game = window.Game || {};
Game.Components = Game.Components || {};

Game.Components.Drawn = function()
{
	this.init = function()
	{
		this.requires("2D, DOM");
	};
};

Game.Components.Clickable = function()
{
	this.init = function()
	{
		this.requires("Mouse");
		this.clickHandler = function(event){};

		this.bind("Click", function(event)
		{
			this.clickHandler(event);
		});

	};

	this.onClick = function(clickHandler)
	{
		this.clickHandler = clickHandler;
		return this;
	};
};

Game.Components.Button = function()
{
	this.init = function()
	{
		this.requires("drawn, Text, clickable");
	};
};

Game.Components.Terrain = function()
{
	this.init = function()
	{
		this.requires("drawn");
	};

	this.tile = function(spriteName, x, y)
	{
		this.requires(spriteName);
		this.attr({x: x * 16, y: y * 16});
		return this;
	};
};

Game.Components.Building = function()
{
	this.init = function()
	{
		this.requires("drawn, terrain, clickable, solid");
		this.onClick(function(event)
		{
			console.log("Clicked a building!");
			if(!event.ctrlKey)
			{
				var selected = Crafty("selected");
				for(var i = 0; i < selected.length; i++)
				{
					Crafty(selected[i]).removeComponent("selected");
				}
				this.addComponent("selected");
			}
			else
			{
				this.toggleComponent("selected");
			}
			console.log(Crafty("selected"));
		});
	};
};

Game.Components.Solid = function()
{
	this.init = function()
	{
	};
};

Game.Components.Soldier = function()
{
	this.init = function()
	{
		this.requires("drawn, Color, Multiway");
		this.color("#0000FF");
		this.w = 16;
		this.h = 16;
		this.multiway(4, { W: -90, S: 90, A: 180, D: 0 });
	};
};

