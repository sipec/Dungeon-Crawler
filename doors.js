"use strict";
//centering game window
var pageW = window.innerWidth; //webpage width
var pageH = window.innerHeight; //webpage height
var $gWin = $("#gameWin");
var roomW = $gWin.width();
var roomH = $gWin.height();

console.log(roomW + " " + roomH);

$gWin.offset({left: (pageW - roomW)/2, top: (pageH - roomH)/2});

var winTop = $gWin.offset().top; //dist from top to game window
var winLeft = $gWin.offset().left;

//get the drawable part of the game window
var winCanvas = document.getElementById("gameWin");
winCanvas.width = roomW;
winCanvas.height = roomH;
var drawGameWin = winCanvas.getContext("2d");


class Player
{
	constructor(x_start, y_start, player_name)
	{
		this.name = player_name;
		this.height = 40;
		this.width = 40;
		this.max_hitpoints = 7 + Math.floor(Math.random() * 6);
		this.hitpoints = this.max_hitpoints;
		this.attack = 7 + Math.floor(Math.random() * 6);
		this.speed = 7 + Math.floor(Math.random() * 6);
		this.sanity = 7 + Math.floor(Math.random() * 6);
		this.wisdom = 7 + Math.floor(Math.random() * 6);
		this.x = x_start;
		this.y = y_start;
	}

	movingNorth = false;
	movingSouth = false;
	movingEast = false;
	movingWest = false;
	//moves players x/y
	draw()
	{
		var speed = 1.0 + .1 * this.speed; //pixels per tick

		var dx = 0;
		var dy = 0;

		if (this.movingNorth) dy--;
		if (this.movingEast) dx++;
		if (this.movingSouth) dy++;
		if (this.movingWest) dx--;

		//if moving diagonally
		if (dy * dx != 0)
		{
			speed *= Math.sqrt(0.5); //slow down the x and y speed
		}

		this.x += dx * speed;
		this.y += dy * speed;

		var roomDoors = world[roomX][roomY].doors;
		if( this.y < 0 ) //top wall
		{
			this.y = 0; //make sure player doesn't go past
			let nDoor = roomDoors.north;
			if ( nDoor != null && nDoor.inDoor())
			{
				nDoor.goThru();
			}
		}
		if( this.x + this.width > roomW ) //right wall
		{
			this.x = roomW - this.width;
			let eDoor = roomDoors.east;
			if (eDoor != null && eDoor.inDoor())
			{
				eDoor.goThru();
			}
		}
		if( this.y + this.height > roomH ) //bottom wall
		{
			this.y = roomH - this.height;
			let sDoor = roomDoors.south;
			if (sDoor != null && sDoor.inDoor())
			{
				sDoor.goThru();
			}
		}
		if( this.x < 0 ) //left wall
		{
			this.x = 0;
			let wDoor = roomDoors.west;
			if (wDoor != null && wDoor.inDoor())
			{
				wDoor.goThru();
			}
		}

		drawGameWin.fillStyle = "red";
		drawGameWin.fillRect(this.x, this.y, this.width, this.height);
		drawGameWin.fillStyle = "black";
		drawGameWin.fillRect(10, 10, 200, 10);
		drawGameWin.fillStyle = "red";
		drawGameWin.fillRect(10, 10, this.hitpoints * 200 / this.max_hitpoints, 10);
		drawGameWin.font= "20px Arial";
		drawGameWin.fillStyle = "black";
		drawGameWin.fillText("🗡️" + player.attack, 10, 40);
		drawGameWin.fillText("🏃" + player.speed, 10, 65);
		drawGameWin.fillText("📘" + player.wisdom, 10, 90);
		drawGameWin.fillText("🤔" + player.sanity, 10, 115);
	}
};

//doors
class Door {
	constructor(x, y) {
		console.log("new door at " + x + ", " + y);
		this.x = x;
		this.y = y;
		this.width = 100;
		this.height = 100;
		//function inDoor()
		//function goThru()
		this.draw = function () {
			drawGameWin.fillStyle = "brown";
			drawGameWin.fillRect(this.x, this.y, this.width, this.height);
		};
	}
}

function newNorthDoor(x)
{
	var door = new Door(x, 0);
	//door.x -= door.width/2;
	door.height = 10;
	door.inDoor = function()
	{
		return player.x > door.x && //left
			player.x + player.width < door.x + door.width; //right
	}
	door.goThru = function()
	{
		player.y = roomH - player.height; //move to south wall
		roomY--;
		enterRoom(roomX, roomY);
	}
	return door;
}

function newSouthDoor(x)
{
	var door = newNorthDoor(x);
	door.y = roomH - door.height;
	door.goThru = function()
	{
		player.y = 0; //move to north wall
		roomY++;
		enterRoom(roomX, roomY);
	}
	return door;
}

function newEastDoor(y)
{
	var door = newWestDoor(y);
	door.x = roomW - door.width;
	door.goThru = function()
	{
		player.x = 0; //move to west wall
		roomX++;
		enterRoom(roomX, roomY);
	}
	return door;
}

function newWestDoor(y)
{
	var door = new Door(0, y);
	//door.y -= door.height/2;
	door.width = 10;
	door.inDoor = function()
	{
		return player.y > door.y && //top
			player.y + player.height < door.y + door.height; //bottom
	}
	door.goThru = function()
	{
		player.x = roomW - player.width; //move to east wall
		roomX--;
		enterRoom(roomX, roomY);
	}
	return door;
}


//rooms
class Room {
	constructor(xx, yy) {
		this.doors = { north: null, east: null, south: null, west: null };
		this.color = '#' + Math.random().toString(16).substr(2, 6);
		this.x = xx;
		this.y = yy;
		this.draw = function () {
			//draw background
			drawGameWin.fillStyle = this.color;
			drawGameWin.fillRect(0, 0, 600, 600);
			for (let direction in this.doors) {
				let door = this.doors[direction];
				if (door != null) {
					door.draw();
				}
			}
			drawGameWin.fillStyle = "black"; //TODO: make white if background too dark
			drawGameWin.fillText("X: " + (this.x - 10), 550, 550);
			drawGameWin.fillText("Y: " + (this.y - 10), 550, 570);
		};
		//TODO: move enterRoom() in here
	}
}

//world
var maxX = 20;
var maxY = 20;

var world = new Array(maxX);
for (let i = 0; i < maxX; i++)
{
	world[i] = new Array(maxY);
}

//start room
var roomX = Math.floor(maxX/2);
var roomY = Math.floor(maxY/2);

var start = world[roomX][roomY] = new Room(10,10);
start.doors.north = newNorthDoor(roomW/2 - 50);
start.doors.east = newEastDoor(roomH/2 - 50);
start.doors.south = newSouthDoor(roomW/2 - 50);
start.doors.west = newWestDoor(roomH/2 - 50);

//generates a room by checking doors of adjacent rooms.
function enterRoom(x, y)
{
	if (world[x][y] != null)
	{
		//don't need to generate room
		console.log("Load room at " + x + ", " + y);
		return false;
	}

	var newRoom = new Room(x, y);
	var newDoors = newRoom.doors;

	//north
	if (y > 0) //if room above exists
	{
		var roomAbove = world[x][y-1];
		if ( roomAbove != null ) //room above exists already
		{
			if (roomAbove.doors.south != null)
				newDoors.north = newNorthDoor(roomAbove.doors.south.x);
		}
		else if (randDoor())
		{
			newDoors.north = newNorthDoor(Math.random() * (roomW - 100)); //TODO: scalable
		}
	}

	//east
	if (x < maxX - 1) //if room right exists
	{
		var roomRight = world[x+1][y];
		if ( roomRight != null )
		{
			if (roomRight.doors.west != null)
				newDoors.east = newEastDoor(roomRight.doors.west.y);
		}
		else if ( randDoor() )
			newDoors.east = newEastDoor(Math.random() * (roomH - 100));
	}

	//south
	if (y < maxY - 1) //if room below exists
	{
		var roomBelow = world[x][y+1];
		if ( roomBelow != null ) {
			if (roomBelow.doors.north != null)
				newDoors.south = newSouthDoor(roomBelow.doors.north.x);
		}
		else if ( randDoor() )
			newDoors.south = newSouthDoor(Math.random() * (roomW - 100));
	}

	//west
	if (x > 0) //if room left exists
	{
		var roomLeft = world[x-1][y];
		if ( roomLeft != null )
		{
			if (roomLeft.doors.east != null)
				newDoors.west = newWestDoor(roomLeft.doors.east.y);
		}
		else if ( randDoor() )
			newDoors.west = newWestDoor(Math.random() * (roomH - 100));
	}

	console.log("New room generated at " + x + ", " + y);
	world[x][y] = newRoom;
	return true;
}

//40% of time returns true
function randDoor()
{
	//console.log("randDoor()");
	return Math.random() < 0.40;
}

var player = new Player(100, 100, "Austin");

$("body").keydown(onDown);
$("body").keyup(onUp);
//when button are pressed, change the movement to true
function onDown(event)
{
	//console.log("down: " + event.keyCode);
	switch(event.keyCode)
	{
		case 87: //w
			player.movingNorth = true;
			break;
		case 65: //a
			player.movingWest = true;
			break;
		case 83: //s
			player.movingSouth = true;
			break;
		case 68: //d
			player.movingEast = true;
			break;
	}

}

//undo the button
function onUp(event)
{
	//console.log("up: " + event.keyCode);
	switch(event.keyCode)
	{
		case 87: //w
			player.movingNorth = false;
			break;
		case 65: //a
			player.movingWest = false;
			break;
		case 83: //s
			player.movingSouth = false;
			break;
		case 68: //d
			player.movingEast = false;
			break;
	}
}




function updateImage()
{
	//draw room
	world[roomX][roomY].draw();
	player.draw();
}

setInterval(updateImage, 1);
