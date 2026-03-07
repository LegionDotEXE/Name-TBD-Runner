// Game.Js Prefab

class GameScene extends Phaser.Scene {
    constructor() { 
        super('GameScene'); 
    }
    
    preload() {
        // Temporary assets 
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Platform texture (slightly shorter default width)
        graphics.fillStyle(0x33CC33, 1);
        graphics.fillRect(0, 0, 80, 40); // default width reduced from 100 -> 80
        graphics.generateTexture('platform', 80, 40);

        graphics.clear();

        // Player circle
        graphics.fillStyle(0xFF3333, 1);
        graphics.fillCircle(20, 20, 20); // radius = 20, center at (20,20)
        graphics.generateTexture('player', 40, 40);
        
        // optional but added here -- Test
        graphics.clear();
        graphics.fillStyle(0xFFFF00, 1); // Yellow for fast fall
        graphics.fillCircle(20, 20, 20);
        graphics.generateTexture('player-fastfall', 40, 40);
    }

    create() {
        this.score = 0;
        this.gameSpeed = 300;
        this.maxSpeed = 700;
        this.acceleration = 10;

        this.jumpCount = 0;
        this.maxJumps = 2;
        this.jumpVelocity = -600;
        
        // Fast fall velocity 
        this.fastFallVelocity = 400; // Downward speed when fast falling

        this.jumBufferTimer = 0;
        this.jumBufferTimeMax = 150;

        this.coyoteTimer = 0;
        this.coyoteTimeMax = 150;
        
        // Fast fall state flag
        this.isFastFalling = false;

        this.platforms = this.physics.add.group();
        this.spawnPlatform(0, 400); 

        this.player = this.physics.add.sprite(150, 400, 'player');
        this.player.setCircle(20);
        this.physics.add.collider(this.player, this.platforms);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown-SPACE', () => {
            this.jumBufferTimer = this.jumBufferTimeMax;
        });
        this.input.on('pointerdown', () => {
            this.jumBufferTimer = this.jumBufferTimeMax;
        });

        this.scoreText = this.add.text(780, 20, 'Distance: 0m', { 
            fontSize: '24px', 
            fill: '#000', 
            fontFamily: 'Arial', 
            fontStyle: 'bold'
        }).setOrigin(1, 0); 
    }

    update(time, delta) {
        if (this.gameSpeed < this.maxSpeed) {
            this.gameSpeed += this.acceleration * (delta / 1000);
        }

        this.score += (this.gameSpeed * delta) / 100000;
        this.scoreText.setText('Distance: ' + Math.floor(this.score) + 'm');

        let rightmostPlatformX = 0;

        this.platforms.getChildren().forEach((platform) => {
            platform.x -= (this.gameSpeed * delta) / 1000;
            platform.body.reset(platform.x, platform.y);

            if (platform.x + platform.displayWidth > rightmostPlatformX) {
                rightmostPlatformX = platform.x + platform.displayWidth;
            }

            if (platform.x < -platform.displayWidth) {
                platform.destroy();
            }
        });

        // Spawn platforms with vertical variation
        if (rightmostPlatformX < 800) {
            let isLargeGap = Phaser.Math.Between(0, 1) === 1;
            
            let gapSize = isLargeGap 
                ? Phaser.Math.Between(120, 180) 
                : Phaser.Math.Between(80, 130);
            
            let platformWidth = Phaser.Math.Between(150, 250);

            let newY = 500; // Fixed Y position

            this.spawnPlatform(rightmostPlatformX + gapSize, platformWidth, newY);
        }

        const onGround = this.player.body.touching.down;

        if (onGround) {
            this.coyoteTimer = this.coyoteTimeMax;
            this.jumpCount = 0;
            // === ADD: Reset fast fall when landing ===
            this.isFastFalling = false;
            this.player.setTexture('player');
        } else {
            this.coyoteTimer -= delta;
            
            // Added FastBall logic
            // player must be falling (velocity.y > 0) and DOWN key must be pressed to initiate fast fall
            if (this.cursors.down.isDown && this.player.body.velocity.y > 0) {
                this.isFastFalling = true;
                this.player.setVelocityY(this.fastFallVelocity);
                this.player.setTexture('player-fastfall'); // Visual feedback
            } else if (this.isFastFalling && !this.cursors.down.isDown) {
                // Stop fast fall when DOWN is released
                this.isFastFalling = false;
                this.player.setTexture('player');
            }
        }

        if (this.jumBufferTimer > 0) this.jumBufferTimer -= delta;

        if (this.jumBufferTimer > 0) {
            if (onGround || this.coyoteTimer > 0) {
                this.player.setVelocityY(this.jumpVelocity);
                this.jumpCount = 1;
                this.coyoteTimer = 0;
                this.jumBufferTimer = 0;
            } else if (this.jumpCount > 0 && this.jumpCount < this.maxJumps) {
                this.player.setVelocityY(this.jumpVelocity);
                this.jumpCount++;
                this.jumBufferTimer = 0;
            }
        }

        if (this.player.y > 650) {
            this.scene.start('GameOver', { finalScore: this.score });
        }
    }

    // Updated spawnPlatform to accept variable y-position
    spawnPlatform(x, width, y = 500) {
        let platform = this.physics.add.sprite(x + (width/2), y, 'platform');
        platform.displayWidth = width;
        this.platforms.add(platform);

        platform.body.allowGravity = false;
        platform.body.setImmovable(true);
    }
}