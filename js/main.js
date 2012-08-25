/*globals Crafty: true */
"use strict";

var Game = window.Game || {};

window.onload = function()
{
	Crafty.init(800, 600);
	Crafty.canvas.init();

	Crafty.c("button", new Game.Components.Button());
	Crafty.c("terrain", new Game.Components.Terrain());
	Crafty.c("clickable", new Game.Components.Clickable());
	Crafty.c("building", new Game.Components.Building());
	Crafty.c("solid", new Game.Components.Solid());

	Crafty.scene("loading", Game.Scenes.loading);
	Crafty.scene("menu", Game.Scenes.menu);
	Crafty.scene("main", Game.Scenes.main);

	Crafty.scene("loading");
};

Game.loop = function()
{
	updateEntities();
	drawEntities();
};
