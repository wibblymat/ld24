"use strict";
var Levels = [
	{
		"name": "Primordial Soup",
		"width": 2000,
		"objects": [
			[0, 0, 1000, 16, "platform"],
			[1000, 0, 16, 32, "platform"],
			[1200, 0, 800, 16, "platform"],
			[1400, 0, 16, 400, "platform"],
			[1200, 80, 16, 400, "platform"],
			[1200, 464, 300, 16, "platform"],
			[200, 16, 200, 50, "platform"],
			[400, 16, 160, 16, "water"],
			[560, 16, 50, 50, "platform"],

			[1200, 100, 120, 16, "platform"],
			[1280, 200, 120, 16, "platform"],
			[1200, 300, 120, 16, "platform"],
			[1280, 400, 136, 16, "platform"],

			[1500, 300, 16, 16, "platform"],
			[1550, 140, 16, 16, "platform"],
			[1600, 275, 16, 16, "platform"],
			[1650, 400, 16, 16, "platform"],
			[1700, 120, 16, 16, "platform"],
			[1520, 150, 16, 16, "platform"],
			[1580, 290, 16, 16, "platform"],
			[1690, 290, 16, 16, "platform"],
			[1530, 360, 16, 16, "platform"],
			[1700, 100, 16, 16, "platform"]
		],
		"monsters": [
			[900, 16, 5]
		],
		"boss": function()
		{
			var direction = 1;
			var countdown = 60;

			window.sounds.boss.play();

			// Constructor
			this.health = 5;
			// These are relative to the 100x480 boss box at the level end
			this.x = 50;
			this.y = 240;
			this.firing = false;
			this.tick = function()
			{
				if(this.y < 50)
				{
					direction = 1;
					window.sounds.boss.play();
				}
				if(this.y > 430)
				{
					direction = -1;
					window.sounds.boss.play();
				}
				this.y += direction;

				countdown--;

				if(countdown <= 0)
				{
					countdown = 100;
					this.firing = true;
				}
			};
		}
	}
];
