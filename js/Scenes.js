/*globals Crafty: true */
"use strict";

var Game = window.Game || {};
Game.Scenes = Game.Scenes || {};

Game.Scenes.loading = function()
{
	Crafty.load(["images/sprites.png"], function()
	{
		Crafty.sprite(16, "images/sprites.png",
		{
			"spawner": [0, 0, 2, 2],
			"temple": [2, 0, 3, 2],
			"workshop": [5, 0, 2, 2],
			"grass": [0, 6]
		});

		//Crafty.scene("menu");
		Crafty.scene("main");
	});

	Crafty.background("black");
	Crafty.e("drawn, Text")
		.attr({w: 100, h: 20, x: 462, y: 374})
		.text("Loading...")
		.textColor("#ffffff")
		.textFont({family: "Consolas, Monospace, Sans, sans-serif", size: "20px"});

};

Game.Scenes.menu = function()
{
	var startButton = Crafty.e("button")
		.attr({w: 800, h: 100, x: 106, y: 100})
		.text("Start")
		.textColor("#ffffff")
		.textFont({family: "Consolas, Monospace, Sans, sans-serif", size: "20px"})
		.onClick(function(event){ Crafty.scene("main"); });
};

Game.Scenes.main = function()
{
	var x, y;

	// This is the main game scene
	// for(x = 0; x < 8; x++)
	// {
	// 	for(y = 0; y < 8; y++)
	// 	{
	// 		Crafty.e("terrain").tile("grass", x, y);
	// 	}
	// }
	Crafty.background("green");


	Crafty.e("building").tile("temple", 6, 6);
	Crafty.e("building").tile("spawner", 6, 8);
	Crafty.e("building").tile("workshop", 6, 10);

	var soldier = Crafty.e("soldier");
	soldier.x = 0;
	soldier.y = 0;

	Crafty.viewport.follow(soldier);
};
