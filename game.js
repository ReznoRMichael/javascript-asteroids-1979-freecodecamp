// Asteroids 1979 - Practice

/* *********************************************************************************************** */

const FPS = 60; // Frames Per Second
const FRICTION = 0.7; // Friction coefficient of space (0 = no friction, 1 = lots of friction)
const GAME_LIVES = 3; // starting number of lives
const LASER_MAX = 10; // maximum number of lasers on the screen at once
const LASER_SPEED = 500; // speed of lasers (pixels / s)
const LASER_DISTANCE = 0.4; // max distance the laser can travel as fraction of screen width
const LASER_EXPLODE_DURATION = 0.1; // duration of the laser's explosion in sec
const ROIDS_JAG = 0.3; // jaggedness of the asteroids (0 = none, 1 = lots)
const ROIDS_NUM = 1; // starting number of asteroids
const ROIDS_SIZE = 100; // starting size of asteroids in pixels
const ROIDS_SPEED = 50; // max starting speed of asteroids in pixels per second
const ROIDS_VERT = 10; // average number of vertices on each asteroids
const SHIP_SIZE = 30; // ship height in pixels
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second
const SHIP_EXPLODE_DURATION = 0.3; // duration of the ship's explosion
const SHIP_INVISIBILITY_DURATION = 3; // duration of the ship's invulnerability after crash (sec)
const SHIP_BLINK_DURATION = 0.1; // duration of the individual blink during invulnerability (sec)
const TURN_SPEED = 360; // turn speed in degrees per second
const TURN_SPEED_RAD = TURN_SPEED / 180 * Math.PI / FPS; // turn speed converted to radians per second
const SHOW_BOUNDING = false; // show the collision detection bounding
const SHOW_CENTRE_DOT = false; // show the red dot in the center of the ship
const TEXT_FADE_TIME = 2.5; // text fade time in seconds
const TEXT_SIZE = 40; // text font size in pixels

/* *********************************************************************************************** */

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas");
var ctx = canv.getContext("2d");

// set up the game parameters
var level, roids, ship, text, textAlpha, lives;
newGame();

// set up event handlers (keyboard)
document.addEventListener( "keydown", keyDown );
document.addEventListener( "keyup", keyUp );

// set up the game loop for update() function
setInterval(update, 1000 / FPS);

/* *********************************************************************************************** */

function createAsteroidBelt()
{
    roids = [];
    var x, y;
    for (var i = 0; i < ROIDS_NUM + level; i++ )
    {
        do
        {
            x = Math.floor( Math.random() * canv.width );
            y = Math.floor( Math.random() * canv.height );    
        }
        while( distanceBetweenPoints( ship.x, ship.y, x, y ) < ROIDS_SIZE * 2 + ship.r );
        roids.push( newAsteroid(x, y, Math.ceil( ROIDS_SIZE / 2)) );
    }
}

/* *********************************************************************************************** */

function destroyAsteroid( index )
{
    var x = roids[index].x;
    var y = roids[index].y;
    var r = roids[index].r;

    // split the asteroid in two if necessary
    if ( r == Math.ceil(ROIDS_SIZE / 2) )
    {
        roids.push( newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)) );
        roids.push( newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)) );
    }
    else if ( r == Math.ceil(ROIDS_SIZE / 4) )
    {
        roids.push( newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)) );
        roids.push( newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)) );
    }

    // destroy the asteroid
    roids.splice( index, 1 );

    // new level when no more asteroids
    if (roids.length == 0)
    {
        level++;
        newLevel();
    }
}

/* *********************************************************************************************** */

function distanceBetweenPoints(x1, y1, x2, y2)
{
    return Math.sqrt( Math.pow(x2 - x1, 2) + Math.pow( y2 - y1, 2) );
}

/* *********************************************************************************************** */

function drawShip(x, y, a)
{
    ctx.strokeStyle = "white";
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    // 4/3 because the actual center of a triangle is about 1/3 below it
    // negative represents 'upwards' on the screen
    ctx.moveTo( // nose of the ship (tip)
        x + 4 / 3 * ship.r * Math.cos( a ),
        y - 4 / 3 * ship.r * Math.sin( a )
    );
    ctx.lineTo( // rear left of the ship
        x - ship.r * ( 2 / 3 * Math.cos( a ) + Math.sin( a ) ),
        y + ship.r * ( 2 / 3 * Math.sin( a ) - Math.cos( a ) )
    );
    ctx.lineTo( // rear right of the ship
        x - ship.r * ( 2 / 3 * Math.cos( a ) - Math.sin( a ) ),
        y + ship.r * ( 2 / 3 * Math.sin( a ) + Math.cos( a ) )
    );
    ctx.closePath();
    ctx.stroke(); // draws a path
}

/* *********************************************************************************************** */

function explodeShip()
{
    ship.explodeTime = Math.ceil( SHIP_EXPLODE_DURATION * FPS );
    // ctx.fillStyle = "lime";
    // ctx.strokeStyle = "lime";
    // ctx.beginPath();
    // ctx.arc( ship.x, ship.y, ship.r, 0, Math.PI * 2, false ); // circle
    // ctx.fill();
    // ctx.stroke();
}

/* *********************************************************************************************** */

function keyDown(/** @type {KeyboardEvent} */ ev )
{
    switch(ev.keyCode) {
        case 32: // spacebar (shoot laser)
            shootLaser();
            break;
            
        case 37: // left arrow (rotate ship left)
            ship.rot = TURN_SPEED_RAD;
            break;

        case 38: // up arrow (thrust ship forward)
            ship.thrusting = true;
            break;

        case 39: // right arrow (rotate ship right)
            ship.rot = -TURN_SPEED_RAD;
            break;
    }
}

/* *********************************************************************************************** */

function keyUp(/** @type {KeyboardEvent} */ ev )
{
    switch(ev.keyCode) {
        case 32: // spacebar (allow shooting again)
            ship.canShoot = true;
            break;

        case 37: // left arrow (stop rotating left)
        ship.rot = 0;
        break;

        case 38: // up arrow (stop thrusting)
            ship.thrusting = false;
            break;
        
        case 39: // right arrow (stop rotating right)
            ship.rot = 0;
            break;
    }
}

/* *********************************************************************************************** */

function newAsteroid(x, y, r)
{
    // asteroid speed multiplier per level
    var lvlMult = 1 + 0.1 * level;
    var roid = {
        // position
        x: x,
        y: y,
        // the velocity
        xv: Math.random() * ROIDS_SPEED * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ROIDS_SPEED * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: r, // the radius
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

/* *********************************************************************************************** */

function newGame()
{
    level = 0;
    lives = GAME_LIVES;
    // set up the ship JavaScript object
    ship = newShip();
    newLevel();  
}

function newLevel()
{
    text = "level " + (level + 1);
    textAlpha = 1.0;
    createAsteroidBelt();
}

function newShip()
{
    // new ship creation (JS object)
    return {
        // center of the canvas
        x: canv.width / 2,
        y: canv.height / 2,
        // radius of the ship (half of size)
        r: SHIP_SIZE / 2,
        // direction of the ship - angle
        // 90 - face up
        a: 90 / 180 * Math.PI, // convert to radians
        // how many times the ship will blink during invulnerability (30 % 2)
        blinkNum: Math.ceil( SHIP_INVISIBILITY_DURATION / SHIP_BLINK_DURATION ),
        // how long the single blinking animation will last (s)
        blinkTime: Math.ceil( SHIP_BLINK_DURATION * FPS ),
        canShoot: true,
        lasers: [],
        explodeTime: 0,
        rot: 0, // ship rotation (start = no rotation)
        thrusting: false, // toggle thrusting
        thrust: {
            // set the thrust power for continuous thrusting
            // default 0 = ship not moving
            x: 0,
            y: 0
        }
    }
}

/* *********************************************************************************************** */

function shootLaser()
{
    // create laser object
    if (ship.canShoot && ship.lasers.length < LASER_MAX)
    {
        ship.lasers.push({ // from the nose of the ship
            x: ship.x + 4 / 3 * ship.r * Math.cos( ship.a ),
            y: ship.y - 4 / 3 * ship.r * Math.sin( ship.a ),
            xv: LASER_SPEED * Math.cos(ship.a) / FPS,
            yv: -LASER_SPEED * Math.sin(ship.a) / FPS,
            dist: 0,
            explodeTime: 0
        });
    }

    // prevent further shooting
    ship.canShoot = false;
}

/* *********************************************************************************************** */
// Main Animation loop
/* *********************************************************************************************** */

function update()
{
    var exploding = ship.explodeTime > 0;
    var blinkOn = ship.blinkNum % 2 == 0;

    // draw background (space)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);

    // thrust the ship
    if (ship.thrusting)
    {
        // increase the ship acceleration by a constant value each time the Up arrow is pressed
        ship.thrust.x += SHIP_THRUST * Math.cos( ship.a ) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin( ship.a ) / FPS;

        // draw the thruster flames if the ship is not exploding and not blinking
        if (!exploding && blinkOn)
        {
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
    }
    else
    {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }

    // draw a triangular ship
    if (!exploding)
    {
        if (blinkOn)
        {
            drawShip(ship.x, ship.y, ship.a);
        }

        // handle blinking during invulnerability
        if (ship.blinkNum > 0)
        {
            // reduce the blink time
            ship.blinkTime--;

            // reduce the blink num
            if (ship.blinkTime == 0)
            {
                ship.blinkTime = Math.ceil( SHIP_BLINK_DURATION * FPS );
                ship.blinkNum--;
            }
        }
    }
    else
    {
        // draw the explosion
        ctx.fillStyle = "darkred";
        ctx.beginPath();
        ctx.arc( ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false ); // circle
        ctx.fill();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc( ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false ); // circle
        ctx.fill();
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc( ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false ); // circle
        ctx.fill();
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc( ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false ); // circle
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc( ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false ); // circle
        ctx.fill();
    }

    // draw collision detection circle
    if (SHOW_BOUNDING)
    {
        ctx.strokeStyle = "lime";
        ctx.beginPath();
        ctx.arc( ship.x, ship.y, ship.r, 0, Math.PI * 2, false ); // circle
        ctx.stroke();
    }

    // draw the asteroids
    var x, y, r, a, vert, offs;

    for (var i = 0; i < roids.length; i++)
    {
        // get the asteroid properties
        ctx.strokeStyle = "slategrey";
        ctx.lineWidth = SHIP_SIZE / 20;
        x = roids[i].x;
        y = roids[i].y;
        r = roids[i].r;
        a = roids[i].a;
        vert = roids[i].vert;
        offs = roids[i].offs;

        // draw asteroid path
        ctx.beginPath();
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a),
        );

        // draw asteroid polygon
        for (var j = 1; j < vert; j++)
        {
            ctx.lineTo(
                x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
            );
        }
        ctx.closePath();
        ctx.stroke();

        // draw asteroid collision detection circle
        if (SHOW_BOUNDING)
        {
            ctx.strokeStyle = "lime";
            ctx.beginPath();
            ctx.arc( x, y, r, 0, Math.PI * 2, false ); // circle
            ctx.stroke();
        }
    }

    // ship center dot
    if (SHOW_CENTRE_DOT)
    {
        ctx.fillStyle = "red";
        ctx.fillRect( ship.x - 1, ship.y - 1, 2, 2 );
    }

    // draw the lasers
    for (var i=0; i < ship.lasers.length; i++)
    {
        // draw the laser if the laser is not exploding
        if (ship.lasers[i].explodeTime == 0)
        {
            ctx.fillStyle = "salmon";
            ctx.beginPath();
            ctx.arc( ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false );
            ctx.fill();
        }
        else
        {
            // draw the laser explosion
            ctx.fillStyle = "orangered";
            ctx.beginPath();
            ctx.arc( ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false );
            ctx.fill();
            ctx.fillStyle = "salmon";
            ctx.beginPath();
            ctx.arc( ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false );
            ctx.fill();
            ctx.fillStyle = "pink";
            ctx.beginPath();
            ctx.arc( ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.3, 0, Math.PI * 2, false );
            ctx.fill();
        }
    }

    // draw the game text
    if (textAlpha >= 0)
    {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
        ctx.fillText(text, canv.width / 2, canv.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
    }

    // draw the amount of lives (represented by ship icons)
    for (var i=0; i < lives; i++)
    {
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI);
    }

    // detect laser hits on asteroids
    var ax, ay, ar, lx, ly;
    for (var i=roids.length - 1; i >= 0; i--)
    {
        // grab the asteroid properties
        ax = roids[i].x;
        ay = roids[i].y;
        ar = roids[i].r;

        // loop over the lasers
        for (var j = ship.lasers.length - 1; j >= 0; j--)
        {
            // grab the laser properties
            lx = ship.lasers[j].x;
            ly = ship.lasers[j].y;

            // detect hits
            if (ship.lasers[j].explodeTime == 0 && distanceBetweenPoints( ax, ay, lx, ly ) < ar)
            {
                // remove / destroy the asteroid and activate the laser explosion
                destroyAsteroid( i );
                ship.lasers[j].explodeTime = Math.ceil( LASER_EXPLODE_DURATION * FPS );
                break;
            }
        }
    }

    // if not exploding, check for collisions, rotate and move ship
    if (!exploding)
    {
        // invulnerability
        // check for asteroid/ship collision if the ship is not blinking
        if (ship.blinkNum == 0)
        {
            for (var i = 0; i < roids.length; i++)
            {
                // destroy the ship and the asteroid if they collide
                if(distanceBetweenPoints( ship.x, ship.y, roids[i].x, roids[i].y ) < ship.r + roids[i].r)
                {
                    explodeShip();
                    destroyAsteroid( i );
                    break;
                }
            }
        }

        // rotate ship
        ship.a += ship.rot;

        // move ship
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
    }
    // else when the ship is exploding
    else
    {
        // reduce the amount of time left to explosion
        ship.explodeTime--;

        // create a new ship
        if (ship.explodeTime == 0)
        {
            ship = newShip();
        }
    }

    // handle ship edge of screen
    if (ship.x < 0 - ship.r)
    {
        ship.x = canv.width + ship.r;
    }
    else if (ship.x > canv.width + ship.r)
    {
        ship.x = 0 - ship.r;
    }
    if (ship.y < 0 - ship.r)
    {
        ship.y = canv.height + ship.r;
    }
    else if (ship.y > canv.height + ship.r)
    {
        ship.y = 0 - ship.r;
    }

    // move the lasers
    for (var i=ship.lasers.length - 1; i >= 0; i--)
    {
        // check distance travelled and if it's greater delete the laser from array
        if (ship.lasers[i].dist > LASER_DISTANCE * canv.width)
        {
            ship.lasers.splice( i, 1 ); // delete laser
            continue; // and skip the next for loop iteration
        }

        // handle the explosion
        if (ship.lasers[i].explodeTime > 0)
        {
            ship.lasers[i].explodeTime--;

            // destroy the laser after the duration is over
            if(ship.lasers[i].explodeTime == 0)
            {
                // remove the laser
                ship.lasers.splice( i, 1 );
                continue; // and continue the next loop iteration
            }
        }
        else
        {
            // move the laser
            ship.lasers[i].x += ship.lasers[i].xv;
            ship.lasers[i].y += ship.lasers[i].yv;
    
            // calculate distance travelled
            ship.lasers[i].dist += Math.sqrt( Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2) );
        }


        // handle edge of screen
        if (ship.lasers[i].x < 0)
        {
            ship.lasers[i].x = canv.width;
        }
        else if (ship.lasers[i].x > canv.width)
        {
            ship.lasers[i].x = 0;
        }
        if (ship.lasers[i].y < 0)
        {
            ship.lasers[i].y = canv.height;
        }
        else if (ship.lasers[i].y > canv.height)
        {
            ship.lasers[i].y = 0;
        }
    }

    // move the asteroid
    for (var i = 0; i < roids.length; i++)
    {
        roids[i].x += roids[i].xv;
        roids[i].y += roids[i].yv;
    
        // handle asteroid edge of screen
        if (roids[i].x < 0 - roids[i].r)
        {
            roids[i].x = canv.width + roids[i].r;
        }
        else if (roids[i].x > canv.width + roids[i].r)
        {
            roids[i].x = 0 - roids[i].r;
        }
        if (roids[i].y < 0 - roids[i].r)
        {
            roids[i].y = canv.height + roids[i].r;
        }
        else if (roids[i].y > canv.height + roids[i].r)
        {
            roids[i].y = 0 - roids[i].r;
        }
    }

}