// Asteroids 1979 - Practice

const FPS = 60; // Frames Per Second
const FRICTION = 0.7; // Friction coefficient of space (0 = no friction, 1 = lots of friction)
const ROIDS_JAG = 0.3; // jaggedness of the asteroids (0 = none, 1 = lots)
const ROIDS_NUM = 8; // starting number of asteroids
const ROIDS_SIZE = 100; // starting size of asteroids in pixels
const ROIDS_SPEED = 50; // max starting speed of asteroids in pixels per second
const ROIDS_VERT = 10; // average number of vertices on each asteroids
const SHIP_SIZE = 30; // ship height in pixels
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second
const TURN_SPEED = 360; // turn speed in degrees per second
const TURN_SPEED_RAD = TURN_SPEED / 180 * Math.PI / FPS; // turn speed converted to radians per second

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas");
var ctx = canv.getContext("2d");

// ship JavaScript object
var ship = {
    // center of the canvas
    x: canv.width / 2,
    y: canv.height / 2,
    // radius of the ship (half of size)
    r: SHIP_SIZE / 2,
    // direction of the ship - angle
    // 90 - face up
    a: 90 / 180 * Math.PI, // convert to radians
    rot: 0, // ship rotation (start = no rotation)
    thrusting: false, // toggle thrusting
    thrust: {
        // set the thrust power for continuous thrusting
        // default 0 = ship not moving
        x: 0,
        y: 0
    }
}

// set up asteroids
var roids = [];
createAsteroidBelt();

// set up event handlers (keyboard)
document.addEventListener( "keydown", keyDown );
document.addEventListener( "keyup", keyUp );

// set up the game loop for update() function
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
    roids = [];
    var x, y;
    for (var i = 0; i < ROIDS_NUM; i++ )
    {
        do
        {
            x = Math.floor( Math.random() * canv.width );
            y = Math.floor( Math.random() * canv.height );    
        }
        while( distanceBetweenPoints( ship.x, ship.y, x, y ) < ROIDS_SIZE * 2 + ship.r );
        roids.push( newAsteroid(x, y) );
    }
}

function distanceBetweenPoints(x1, y1, x2, y2)
{
    return Math.sqrt( Math.pow(x2 - x1, 2) + Math.pow( y2 - y1, 2) );
}

function keyDown(/** @type {KeyboardEvent} */ ev ) {
    switch(ev.keyCode) {
        case 38: // up arrow (thrust ship forward)
            ship.thrusting = true;
            break;

        case 37: // left arrow (rotate ship left)
            ship.rot = TURN_SPEED_RAD;
            break;

        case 39: // right arrow (rotate ship right)
            ship.rot = -TURN_SPEED_RAD;
            break;
    }
}

function keyUp(/** @type {KeyboardEvent} */ ev ) {
    switch(ev.keyCode) {
        case 38: // up arrow (stop thrusting)
            ship.thrusting = false;
            break;

        case 37: // left arrow (stop rotating left)
            ship.rot = 0;
            break;
            
        case 39: // right arrow (stop rotating right)
            ship.rot = 0;
            break;
    }
}

function newAsteroid(x, y) {
    var roid = {
        // position
        x: x,
        y: y,
        // the velocity
        xv: Math.random() * ROIDS_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ROIDS_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: ROIDS_SIZE / 2, // the radius
        a: Math.random() * Math.PI * 2, // randomize Angle in radians
        // choose the number of vertices for each asteroid
        vert: Math.floor( Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2 ),
        offs: []
    };

    // create the vertex offsets array
    for (var i = 0; i < roid.vert; i++)
    {
        roid.offs.push( Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }
    return roid;
}

function update() {
    // draw background (space)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);

    // thrust the ship
    if ( ship.thrusting ) {
        // increase the ship acceleration by a constant value each time the Up arrow is pressed
        ship.thrust.x += SHIP_THRUST * Math.cos( ship.a ) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin( ship.a ) / FPS;

        // draw the flames
        ctx.fillStyle = "red";
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = SHIP_SIZE / 20;
        ctx.beginPath();
        ctx.moveTo( // start the flames at rear left
            ship.x - ship.r * ( 2 / 3 * Math.cos( ship.a ) + 0.5 * Math.sin( ship.a ) ),
            ship.y + ship.r * ( 2 / 3 * Math.sin( ship.a ) - 0.5 * Math.cos( ship.a ) )
        );
        ctx.lineTo( // move to rear center (behind the ship)
            ship.x - ship.r * 5 / 3 * Math.cos( ship.a ),
            ship.y + ship.r * 5 / 3 * Math.sin( ship.a )
        );
        ctx.lineTo( // rear right of the ship
            ship.x - ship.r * ( 2 / 3 * Math.cos( ship.a ) - 0.5 * Math.sin( ship.a ) ),
            ship.y + ship.r * ( 2 / 3 * Math.sin( ship.a ) + 0.5 * Math.cos( ship.a ) )
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke(); // draws a path
    }
    else
    {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }

    // draw a triangular ship
    ctx.strokeStyle = "white";
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    // 4/3 because the actual center of a triangle is about 1/3 below it
    // negative represents 'upwards' on the screen
    ctx.moveTo( // nose of the ship (tip)
        ship.x + 4 / 3 * ship.r * Math.cos( ship.a ),
        ship.y - 4 / 3 * ship.r * Math.sin( ship.a )
    );
    ctx.lineTo( // rear left of the ship
        ship.x - ship.r * ( 2 / 3 * Math.cos( ship.a ) + Math.sin( ship.a ) ),
        ship.y + ship.r * ( 2 / 3 * Math.sin( ship.a ) - Math.cos( ship.a ) )
    );
    ctx.lineTo( // rear right of the ship
        ship.x - ship.r * ( 2 / 3 * Math.cos( ship.a ) - Math.sin( ship.a ) ),
        ship.y + ship.r * ( 2 / 3 * Math.sin( ship.a ) + Math.cos( ship.a ) )
    );
    ctx.closePath();
    ctx.stroke(); // draws a path

    // draw the asteroids
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = SHIP_SIZE / 20;
    var x, y, r, a, vert, offs;

    for (var i = 0; i < roids.length; i++)
    {
        // get the asteroid properties
        x = roids[i].x;
        y = roids[i].y;
        r = roids[i].r;
        a = roids[i].a;
        vert = roids[i].vert;
        offs = roids[i].offs;

        // draw a path of the asteroid
        ctx.beginPath();
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a),
        );

        // draw the polygon
        for(var j = 1; j < vert; j++)
        {
            ctx.lineTo(
                x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
            );
        }
        ctx.closePath();
        ctx.stroke();

        // move the asteroid
        roids[i].x += roids[i].xv;
        roids[i].y += roids[i].yv;

        // handle edge of screen
        if(roids[i].x < 0 - roids[i].r)
        {
            roids[i].x = canv.width + roids[i].r;
        }
        else if(roids[i].x > canv.width + roids[i].r)
        {
            roids[i].x = 0 - roids[i].r;
        }
        if(roids[i].y < 0 - roids[i].r)
        {
            roids[i].y = canv.height + roids[i].r;
        }
        else if(roids[i].y > canv.height + roids[i].r)
        {
            roids[i].y = 0 - roids[i].r;
        }
    }


    // rotate ship
    ship.a += ship.rot;


    // move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    // handle edge of screen
    if ( ship.x < 0 - ship.r )
    {
        ship.x = canv.width + ship.r;
    }
    else if ( ship.x > canv.width + ship.r )
    {
        ship.x = 0 - ship.r;
    }
    if ( ship.y < 0 - ship.r )
    {
        ship.y = canv.height + ship.r;
    }
    else if ( ship.y > canv.height + ship.r )
    {
        ship.y = 0 - ship.r;
    }

    // center dot
    ctx.fillStyle = "red";
    ctx.fillRect( ship.x - 1, ship.y - 1, 2, 2 );
}