"use strict";

function Drawing(canvas)
{
	this.canvas = canvas;
	this.context = canvas.getContext("2d");
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

Drawing.prototype.sprite = function(image, x, y)
{
	this.context.drawImage(image, x, y);
};
