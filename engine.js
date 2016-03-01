// Physics constants.
var XV_ACCELERATION = 0.085;
var XV_TERMINAL = 0.6;
var XV_FRICTION = 0.05;
var YV_GRAVITY = 0.05;
var YV_TERMINAL = 100;
var JUMP = 0.9;
var JUMP_MAX = 2;
var JUMP_COOLDOWN = 400;
var CLIP_THRESHOLD = 2;

// Animation limits.
var FPS_CAP = 100;
var FPS_INTERVAL = 1000 / FPS_CAP;
var F = 0;
var S = 0;

// Input
var keys = {};

// Animation
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Rectangular intersection.
function intersects(r1, r2) {
    return !(r1[0]+r1[2] < r2[0] || r1[0] > r2[0]+r2[2] || r1[1]+r1[3] < r2[1] || r1[1] > r2[1]+r2[3]);
}

// The main game engine class.
function Engine(canvas) {
    
    // Graphics.
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.context.font = "20px Verdana";

    // Set up timing.
    this.time = Date.now();

    // Input binding.
    addEventListener("keydown", function(e) { keys[e.keyCode] = true; }, false);
    addEventListener("keyup", function(e) { delete keys[e.keyCode]; }, false);

    // Game objects.
    this.platforms = [
        new Platform((canvas.width - 400)/2, canvas.height * 13/20, 400, PLATFORM_THICKNESS), 
		new Platform((canvas.width - 650)/2, canvas.height * 9/20, 150, PLATFORM_THICKNESS), 
		new Platform((canvas.width + 350)/2, canvas.height * 9/20, 150, PLATFORM_THICKNESS)
    ];
    this.bullets = [];
    this.players = {
        zero: new Player("zero", "zero.png", {left: 65, right: 68, up: 87, down: 83, shoot: 49}, this),
        infinitus: new Player("infinitus", "infinity.png", {left: 37, right: 39, up: 38, down: 40, shoot: 220}, this)
    };
                
    // Update the game.
    this.update = function(delta) {
 
        // Update the players
        for (var name in this.players) this.players[name].update(delta);
        for (var i = 0; i < this.bullets.length; i++) {
            var bullet = this.bullets[i];
            bullet.update(delta);
            
            // Check if a bullet has died.
            if (bullet.x+bullet.image.width < 0 || bullet.x > canvas.width) {
                this.bullets.splice(i, 1);
                bullet.player.bullet++;
            }
        }
        
        // Collision detection
        for (var name in this.players) {
            
            // Get the actual player.
            var player = this.players[name];
            
            // Generate boundary boxes.
            var bbox = player.bbox();
            
            // Platform collision.
            player.grounded = false;
            for (var i = 0; i < this.platforms.length; i++) {
                
                // Access the individual platform. 
                var platform = this.platforms[i];
                
                // Check if colliding with platform while FALLING.
                if (player.yv > 0 && intersects(bbox, platform.bbox()) && !(i in player.collisions)) {
                    //console.log(platform.bbox());
                    player.y = platform.y - player.image.height;
                    player.yv = 0;
                    player.grounded = true;
                    player.jump = 0;
                    player.collisions[i] = true;
                } else {
                    delete player.collisions[i];
                }
                
            }
            
            for (var i = 0; i < this.bullets.length; i++) {
                
                // Access the bullet.
                var bullet = this.bullets[i];
                
                // Intersection with bullet.
                if (!player.invincible() && intersects(bbox, bullet.bbox())) {
                    this.die(player);
                }
                
            }
            
            // Edge detection.
            if (player.x < 0) player.x = 0;
            else if (player.x+player.image.width > canvas.width) player.x = canvas.width - player.image.width;
            if (player.y < 0) player.y = 0;
            else if (player.y + player.image.height > canvas.height + 150) this.die(player);

        }
        
    }
    
    // Draw the game to the canvas. 
    this.render = function() {
        
        // Redraw the background.
        this.context.fillStyle = "#CCC";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the platforms.
        this.context.fillStyle = "#000";
        for (var i = 0; i < this.platforms.length; i++) {
            this.platforms[i].render(this.context);
        }
        
        // Draw the players.
        for (var name in this.players) {
            this.players[name].render(this.context);
        }
        
        // Draw the bullets.
        for (var i = 0; i < this.bullets.length; i++) {
            this.bullets[i].render(this.context);
        }
        
        // Draw frames per second.
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
        this.context.fillText(Math.round(F/(Date.now() - S) * 100000) / 100, 10, 10);
        this.context.textBaseline = "bottom"
        this.context.fillText("Zero: " + this.players.zero.score, 10, canvas.height-10);
        this.context.textAlign = "right";
        this.context.fillText("Infinity: " + this.players.infinitus.score, canvas.width-10, canvas.height-10);

    }
        
    // The main game loop.
    this.main = function() {
        
        // Record timing.
        var now = Date.now();
        var delta = now - this.time;
        
        if (delta > FPS_INTERVAL) {
        
            // Update and render.
            this.update(delta);
            this.render();

            // Update timing.
            this.time = now;
            
            // Update frame count.
            F++;
        
        }
            
        // Next frame
        requestAnimationFrame(this.main.bind(this));
        
    }
    
    // Called when a player dies.
    this.die = function(player) {
        
        // Move the player and update score.
        if (player.name == "zero") this.players.infinitus.score++;
        else if (player.name == "infinitus") this.players.zero.score++;
        player.die();
        console.log("DIE");
        
    }
    
    // Wait for resources before going to main.
    this.start = function() {
        S = Date.now();
        this.main(); 
    }
    
}

// Start the game.
function start() {
    var canvas = document.getElementById("canvas");
    var e = new Engine(canvas);
    e.start();
}