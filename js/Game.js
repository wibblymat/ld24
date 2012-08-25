"use strict";

var Game = {};

Game.BaseObject = function(side, x, y)
{
	this.side = side;
	this.x = x;
	this.y = y;
	this.width = 1;
	this.height = 1;
	this.health = 10;
	this.armor = 0;
	this.active = false;
	this.sprite = "";
	this.name = "Bugged object :p";
};

Game.BaseObject.prototype.move = function(x, y)
{
};

Game.BaseObject.prototype.startTurn = function()
{

};

// Buildings
Game.Spawner = function(side, x, y)
{
	var object = new Game.BaseObject(side, x, y);
	object.width = 2;
	object.height = 2;
	object.sprite = "spawner";
	object.health = 1000;
	object.name = "Spawner";
	return object;
};

Game.Temple = function(side, x, y)
{
	var object = new Game.BaseObject(side, x, y);
	object.width = 3;
	object.height = 2;
	object.sprite = "temple";
	object.health = 500;
	object.name = "Temple";
	return object;
};


Game.Workshop = function(side, x, y)
{
	var object = new Game.BaseObject(side, x, y);
	object.width = 2;
	object.height = 2;
	object.sprite = "workshop";
	object.health = 500;
	object.name = "Workshop";
	return object;
};


Game.Unit = function(side, x, y)
{
	var object = new Game.BaseObject(side, x, y);

	object.tick = function()
	{
		if(this.active && this.target)
		{
			if(this.moveFramesLeft > 0)
			{
				var movex = this.nextTile[0] - this.x;
				var movey = this.nextTile[1] - this.y;

				movex /= this.moveFramesLeft;
				movey /= this.moveFramesLeft;

				this.x += movex;
				this.y += movey;

				this.moveFramesLeft--;
			}
			else
			{
				this.x = Math.round(this.x);
				this.y = Math.round(this.y);

				if(this.moveLeft > 0)
				{
					this.nextTile = [this.x, this.y];

					if(this.x < this.target[0]) this.nextTile[0]++;
					if(this.x > this.target[0]) this.nextTile[0]--;
					if(this.y < this.target[1]) this.nextTile[1]++;
					if(this.y > this.target[1]) this.nextTile[1]--;

					if(this.nextTile[0] === this.x && this.nextTile[1] === this.y)
					{
						this.active = false;
						this.nextTile = null;
					}
					else
					{
						this.moveFramesLeft = 10;
						this.moveLeft--;
					}
				}
				else
				{
					this.active = false;
				}
			}
		}
	};

	object.startTurn = function()
	{
		this.moveLeft = this.speed;
		this.finished = false;
		this.target = null;
		this.nextTile = null;
		this.moveFramesLeft = 0;
	};

	object.setTarget = function(x, y)
	{
		this.target = [x, y];
	};

	object.attack = function(target)
	{
		var damage = this.strength * Game.bonuses[this.side].strength;
		damage /= (target.armor * Game.bonuses[target.side].armor + 1);
		target.hit(damage);
	};

	object.name = "Bugged unit!";
	object.strength = 1;
	object.speed = 1;
	object.moveLeft = 0;
	object.target = null;
	object.nextTile = null;
	object.finished = true;
	object.moveFramesLeft = 0;
	object.startTurn();
	return object;
};

// Units
Game.Soldier = function(side, x, y)
{
	var object = new Game.Unit(side, x, y);
	object.sprite = "soldier";
	object.health = 50;
	object.name = "Soldier";
	return object;
};

Game.Knight = function(side, x, y)
{
	var object = new Game.Unit(side, x, y);
	object.sprite = "knight";
	object.health = 60;
	object.speed = 5;
	object.moveLeft = object.speed;
	object.name = "Knight";
	return object;
};

Game.selected = (function()
{
	var add = function(object)
	{
		if(object && !object.selected)
		{
			object.selected = true;
			this.items.push(object);
		}
	};

	var remove = function(object)
	{
		var i = this.items.length;

		if( object !== null && object.selected )
		{
			while( i > 0 )
			{
				i--;
				if( this.items[ i ] === object ) break;
			}

			if( this.items[ i ] === object )
			{
				this.items.splice( i, 1 );
				object.selected = false;
			}
		}
	};

	var clear = function()
	{
		this.items.forEach(function(item)
			{
				item.selected = false;
			});

		this.items = [];
	};

	var toggle = function(object)
	{
		if(object.selected) this.remove(object);
		else this.add(object);
	};

	return {
		'items': [],
		'add': add,
		'remove': remove,
		'clear': clear,
		'toggle': toggle
	};

}());

Game.reset = function()
{
	Game.buildings = [ // side (0/1), x, y
		new Game.Spawner(0, 1, 1),
		new Game.Temple(0, 1, 3),
		new Game.Workshop(0, 1, 5)
	];
	Game.units = [new Game.Soldier(0, 10, 10), new Game.Knight(0, 15, 15), new Game.Soldier(1, 12, 12)];
	Game.selected.clear();
	Game.bonuses = [
		{strength: 1, armor: 1, speed: 1, mounted: 1, spawn: 1, building: 1, xp: 1, collection: 1, house: 1, health: 1},
		{strength: 1, armor: 1, speed: 1, mounted: 1, spawn: 1, building: 1, xp: 1, collection: 1, house: 1, health: 1}
	];
};

Game.reset();
