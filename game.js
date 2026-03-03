class GameScene extends Phaser.Scene {
    constructor() { 
        super('GameScene'); 
    }
    
    preload() {
        // Temporary assests 
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x33CC33, 1);
        graphics.fillRect(0, 0, 100, 40);
        graphics.generateTexture('platform', 100, 40);

        graphics.clear();
        graphics.fillStyle(0xFF3333, 1);
        graphics.fillRect(0, 0, 40, 40);
        graphics.generateTexture('player', 40, 40);
    }

    create() {
        // Game Variables attached to this scene
        this.score = 0;
        this.gameSpeed = 300;
        this.maxSpeed = 700;
        this.acceleration = 10;
        
        // Jump and Accessibility Variables
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.jumpVelocity = -600;
        
        this.coyoteTimer = 0;
        this.coyoteTimeMax = 150; // forgiveness after walking off a ledge

        // Setup Platforms
        this.platforms = this.physics.add.group();
        this.spawnPlatform(0, 800);

        // Setup Player
        this.player = this.physics.add.sprite(150, 400, 'player');
        this.physics.add.collider(this.player, this.platforms);

        // Setup Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Setup Score UI
        this.scoreText = this.add.text(780, 20, 'Distance: 0m', { 
            fontSize: '24px', 
            fill: '#000', 
            fontFamily: 'Arial', 
            fontStyle: 'bold'
        }).setOrigin(1, 0); 
    }

    update(time, delta) {

        // Gradually increase game speed over time
        if (this.gameSpeed < this.maxSpeed) {
            // Adds a tiny fraction of speed every frame (15 units per second)
            this.gameSpeed += this.acceleration * (delta / 1000);
        }
        // Update Distance Score
        this.score += (this.gameSpeed * delta) / 100000;
        this.scoreText.setText('Distance: ' + Math.floor(this.score) + 'm');

        // Move Platforms Left
        let rightmostPlatformX = 0;
        
        this.platforms.getChildren().forEach((platform) => {
            platform.x -= (this.gameSpeed * delta) / 1000;
            
            // Find the furthest platform to know when to spawn the next one
            if (platform.x + platform.displayWidth > rightmostPlatformX) {
                rightmostPlatformX = platform.x + platform.displayWidth;
            }

            // Destroy platforms that go off-screen to save memory
            if (platform.x < -platform.displayWidth) {
                platform.destroy();
            }
        });

        // Platform Spawning Logic (Small and Large Gaps)
        if (rightmostPlatformX < 800) {
            let isLargeGap = Phaser.Math.Between(0, 1) === 1;
            let gapSize = isLargeGap ? Phaser.Math.Between(150, 250) : Phaser.Math.Between(50, 100);
            let platformWidth = Phaser.Math.Between(200, 500);
            
            this.spawnPlatform(800 + gapSize, platformWidth);
        }

        // Coyote Time and Jump Logic
        const onGround = this.player.body.touching.down;

        if (onGround) {
            this.coyoteTimer = this.coyoteTimeMax;
            this.jumpCount = 0;
        } else {
            this.coyoteTimer -= delta;
        }

        const justPressedJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);

        if (justPressedJump) {
            // First jump (either on ground or within coyote time window)
            if (this.coyoteTimer > 0) {
                this.player.setVelocityY(this.jumpVelocity);
                this.jumpCount = 1;      
                this.coyoteTimer = 0; // Consume coyote time so it can't be spammed
            } 
            // Double jump (if coyote time is gone but we still have a jump left)
            else if (this.jumpCount > 0 && this.jumpCount < this.maxJumps) {
                this.player.setVelocityY(this.jumpVelocity);
                this.jumpCount++;
            }
        }

        //  Game Over Condition (falling off screen)
        if (this.player.y > 650) {
            // Transition to GameOver scene and pass the final score data
            this.scene.start('GameOver', { finalScore: this.score });
        }
    }

    spawnPlatform(x, width) {
        let platform = this.physics.add.sprite(x + (width/2), 500, 'platform');
        platform.displayWidth = width;
        this.platforms.add(platform);
        
        platform.body.allowGravity = false;
        platform.body.setImmovable(true);
    }
}