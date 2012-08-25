"use strict";

function Sprites(size, image, data)
{
	var sprites = {};
	var sprite, options, name;

	for(name in data)
	{
		options = data[name];
		options[2] = options[2] || 1;
		options[3] = options[3] || 1;

		sprite = document.createElement("canvas");
		sprite.width = size * options[2];
		sprite.height = size * options[3];

		sprite.getContext("2d").drawImage(image, options[0] * size, options[1] * size, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);

		sprites[name] = sprite;
	}

	return sprites;
}
