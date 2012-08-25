/*globals Crafty: true */
"use strict";

var Game = window.Game || {};
Game.Components = Game.Components || {};

Game.Components.Clickable = function()
{
	this.init = function()
	{
		this.addComponent("Mouse");
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
		this.addComponent("2D, DOM, Text, clickable");
	};
};

Game.Components.Terrain = function()
{
	this.init = function()
	{
		this.addComponent("2D, DOM");
	};

	this.tile = function(spriteName, x, y)
	{
		this.addComponent(spriteName);
		this.attr({x: x * 16, y: y * 16});
		return this;
	};
};

Game.Components.Building = function()
{
	this.init = function()
	{
		this.addComponent("2D, DOM, terrain, clickable, solid");
		this.onClick(function(){ console.log("Clicked a building!"); });
	};
};

Game.Components.Solid = function()
{
	this.init = function()
	{
	};
};

