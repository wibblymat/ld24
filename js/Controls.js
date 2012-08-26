"use strict";

var Controls = function(canvas)
{
	var canvasObject = $(canvas);
	var windowObject = $(window);

	var controls = {
		'keyState': {},
		'buttonState': {},
		'mousePosition': null,
		'wheelDelta': 0
	};

	var mouseEventPosition = function(event)
	{
		var posx = 0;
		var posy = 0;
		if(!event) event = window.event;
		if(event.pageX || event.pageY)
		{
			posx = event.pageX;
			posy = event.pageY;
		}
		else if(event.clientX || event.clientY)
		{
			posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		posx -= canvas.parentElement.offsetLeft;
		posy -= canvas.parentElement.offsetTop;

		return [posx, posy];
	};

	var resize = function()
	{
	};

	var wheelHandler = function(event)
	{
		event = event || window.event;
		controls.wheelData += event.originalEvent.detail * 40 || -event.originalEvent.wheelDelta;
	};

	var mouseDownHandler = function(event)
	{
		event.preventDefault();
		event.stopPropagation();

		controls.buttonState[event.which] = {'start': mouseEventPosition(event), 'end': null, 'event': event};
	};

	var mouseUpHandler = function(event)
	{
		var position = mouseEventPosition(event);
		if(!controls.buttonState[event.which]) controls.buttonState[event.which] = {'start': position, 'end': position, 'event': event};
		else
		{
			controls.buttonState[event.which].end = position;
			controls.buttonState[event.which].event = event;
		}
	};

	var mouseMoveHandler = function( event )
	{
		controls.mousePosition = mouseEventPosition(event);
	};

	var mouseOutHandler = function(event)
	{
		controls.mousePosition = null;
	};

	var blur = function(event)
	{
		controls.keyState = {};
		controls.buttonState = {};
	};

	var keyDown = function(event)
	{
		controls.keyState[event.keyCode] = true;
		//console.log(event.keyCode);
	};

	var keyUp = function(event)
	{
		controls.keyState[event.keyCode] = false;
	};

	windowObject.resize(resize);
	canvasObject.bind('mousewheel DOMMouseScroll', wheelHandler);
	canvasObject.mousedown(mouseDownHandler);
	canvasObject.mouseup(mouseUpHandler);
	canvasObject.mousemove(mouseMoveHandler);
	canvasObject.mouseout(mouseOutHandler);
	canvasObject.blur(blur);
	windowObject.keydown(keyDown);
	windowObject.keyup(keyUp);

	return controls;
};
