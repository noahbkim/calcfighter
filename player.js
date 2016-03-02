// Player data and computation model.
function Player(name, image, intimage, particleImages, bindings, engine) {
    
    // Engine.
    this.engine = engine;
    
    // Character info.
    this.name = name;
    this.image = image;
    this.integral = intimage;
	
	// Particles.
	this.particleImages = particleImages;
	this.particles = [];
	this.particlesActive = false;
    
    // Position and physics.
    this.x = 100;
    this.y = 100;
    this.xv = 0;
    this.yv = 0;
    this.jump = 0;
    this.jumpTime = 0;
	this.movedDown = false;
    this.grounded = false;
    this.collisions = {};
    this.direction = -1;
    this.deathTime = 0;
    
    // Bullets and shield.
    this.bullet = 2;
    this.bulletTime = 0;
    this.shield = SHIELD_TIME;
    this.shielded = false;

    // Scoring.
    this.score = 0;
    
    // Input.
    this.bindings = bindings;
    
    // Geometry. 
    this.bbox = function() {
        return [this.x, this.y, this.image.width, this.image.height];
    }
    
    // Update.
    this.update = function(delta) {
        
        // Strafing.
        if (this.bindings.left in keys) {
            this.xv -= XV_ACCELERATION;
            this.direction = -1;
        }
        if (this.bindings.right in keys) {
            this.xv += XV_ACCELERATION;
            this.direction = 1;
        }
        
        // X drag and terminal velocity.
        var sign = this.xv > 0 ? 1 : -1;
        this.xv = sign * Math.max(Math.abs(this.xv) - XV_FRICTION, 0);
        if (Math.abs(this.xv) > XV_TERMINAL) this.xv = sign * XV_TERMINAL;
		
        // Jumping.
        if (this.jump < JUMP_MAX && Date.now() - this.jumpTime > JUMP_COOLDOWN && this.bindings.up in keys) {
            this.grounded = false;
            this.jump++;
            this.jumpTime = Date.now();
            this.yv = -JUMP;
        }
        
        // Groundedness.
        if (!this.grounded) {
            this.yv += YV_GRAVITY;
        } else {
            this.yv = 0;
            this.jump = 0;
        }
        
        // Y terminal velocity.
        if (Math.abs(this.yv) > YV_TERMINAL) {
            this.yv = (this.yv > 0 ? 1 : -1) * YV_TERMINAL;
        }
        
        // Actually move the player.
        this.x += this.xv * delta;
        this.y += this.yv * delta;
        
        // Shooting.
        if (this.bullet > 0 && Date.now() - this.bulletTime > BULLET_COOLDOWN && this.bindings.shoot in keys && !this.shielded) {
            this.bullet--;
            this.bulletTime = Date.now();
            this.engine.bullets.push(new Bullet(this));
            this.deathTime = 0;
        }
        
        // Shields after user presses key.
        if (this.shield > 0 && this.bindings.shield in keys && !this.invincible()) {
			if (this.shielded) {
				this.shield -= delta;
			} else {
        		this.shielded = true;
        	}
        } else {
        	this.shielded = false;
        }
		
		// Update particles.
		if (this.particlesActive) {
			this.particlesActive = false;
			for (var i = 0; i < particles.length; i++) {
				this.particles[i].update(delta);
				if (this.particles[i].active) {
					this.particlesActive = true;
				}
			}
		}
        //console.log(this.particlesActive);
        // Make sure the shield is at a sensible value.
        this.shield = Math.max(this.shield, 0);
    
    }
    
    this.render = function(context) {
        // Draw particles
		if (this.particlesActive) {
			for (var i = 0; i < particles.length; i++) {
				this.particles[i].render(context);
			}
		}
		
        // Draw the image.
        if (this.invincible() && Date.now() % 500 < 150) return;
        context.drawImage(this.image, this.x, this.y);
		
		// Draw shield
        if (this.shielded) {
            context.drawImage(this.integral, this.x - this.integral.width, this.y + this.image.height / 2 - this.integral.height / 2);
            context.drawImage(this.integral, this.x + this.image.width, this.y + this.image.height / 2 - this.integral.height / 2);
        }
        
        if (!this.shielded) {
            context.beginPath();
            
            var cx = this.x + (this.direction == -1 ? -5 : this.image.width + 5);
            var cy = this.y + this.image.height / 2;
            
            context.moveTo(cx, cy+3);
            context.lineTo(cx+this.direction*6, cy);
            context.lineTo(cx, cy-3);
            context.fill();
        }
    }

    this.die = function() {
        
        // Time of death.
        this.deathTime = Date.now();
		
		// Spawn particles.
		for (var i = 0; i < particleImages.length; i++) {
			this.particles[i] = new Particle(i, particleImages[i], this, this.engine);
		}
		this.particlesActive = true;
        
        // Set physics.
        this.y = 0;
        this.yv = 0;
        
        // Reload shield.
        this.shield = SHIELD_TIME;

        // Spawn randomly.
        this.x = Math.random() * this.engine.canvas.width;
    }

    this.invincible = function() {

        // Assert the death time is within the invincibility.       
        return Date.now() - this.deathTime < INVINCIBILITY_TIME;

    }
 
}
