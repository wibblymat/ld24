"use strict";

function Drawing(canvas)
{
	this.canvas = canvas;
	this.context = canvas.getContext("2d");
	this.context.fillStyle = "black";
	this.context.font = "16px Consolas, Monospace, Arial, sans-serif";
	this.context.textAlign = "left";
	this.context.textBaseline = "top";
}

Drawing.prototype.clear = function()
{
	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

Drawing.prototype.focus = function()
{
	this.canvas.focus();
};

Drawing.prototype.setPixel = function(x, y, colour)
{
	this.context.save();
	this.context.fillStyle = colour;
	this.context.fillRect(x, y, 1, 1);
	this.context.restore();
};

Drawing.prototype.line = function(x1, y1, x2, y2, colour)
{
	this.context.save();
	this.context.strokeStyle = colour;
	this.context.beginPath();
	this.context.moveTo(x1, y1);
	this.context.lineTo(x2, y2);
	this.context.stroke();
	this.context.restore();
};

Drawing.prototype.rect = function(x1, y1, x2, y2, colour)
{
	this.context.save();
	this.context.fillStyle = colour;
	this.context.fillRect(x1, y1, x2, y2);
	this.context.restore();
};

Drawing.prototype.sprite = function(image, x, y)
{
	this.context.drawImage(image, Math.floor(x), Math.floor(y));
};

Drawing.prototype.write = function(text, x, y, colour)
{
	this.context.save();
	this.context.fillStyle = colour;
	this.context.fillText(text, x, y);
	this.context.restore();
};
