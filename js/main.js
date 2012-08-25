/*globals Crafty: true */
"use strict";

var Game = window.Game || {};

window.onload = function()
{
	Crafty.init(800, 600);
	Crafty.canvas.init();

	for(var component in Game.Components)
	{
		Crafty.c(component.toLowerCase(), new Game.Components[component]());
	}

	for(var scene in Game.Scenes)
	{
		Crafty.scene(scene, Game.Scenes[scene]);
	}

	Crafty.scene("loading");
};

Game.loop = function()
{
	updateEntities();
	drawEntities();
};
