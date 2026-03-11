// Game.Js Prefab

class GameScene extends Phaser.Scene {
    constructor() { 
        super('GameScene'); 
    }
    
    preload() {

        // Background layers
        this.load.image('bg-mountains', 'assets/mountains.png');
        this.load.image('bg-sky', 'assets/sky.png');


        // Temporary assets 
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Platform texture (slightly shorter default width)
        graphics.fillStyle(0x33CC33, 1);
        graphics.fillRect(0, 0, 80, 40); // default width reduced from 100 -> 80
        graphics.generateTexture('platform', 80, 40);

        graphics.clear();

        // Load character sprite sheet
        this.load.spritesheet('player', 'Assets/spritesheet.png', { 
            frameWidth: 36, 
            frameHeight: 46 
        });

        // Load custom audio files
        this.load.audio('jump-sound', 'Assets/jump.mp3');
        this.load.audio('fall-sound', 'Assets/fastfall.mp3');
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

        // Setup Audio
        this.sfxJump = this.sound.add('jump-sound', { volume: 0.6 });
        this.sfxFall = this.sound.add('fall-sound', { volume: 0.4 });

        this.bgSky = this.add.tileSprite(0, 0, 800, 600, 'bg-sky').setOrigin(0, 0);
        this.bgMountains = this.add.tileSprite(0, 150, 800, 600, 'bg-mountains').setOrigin(0, 0);

        this.platforms = this.physics.add.group();
        this.spawnPlatform(0, 400); 

        // Setup Player
        this.player = this.physics.add.sprite(150, 400, 'player');
        this.player.setScale(1.5); // scale up the sprite if it is too small
        this.physics.add.collider(this.player, this.platforms);

        // Animation Definitions
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }), 
            frameRate: 12, 
            repeat: -1     
        });

        this.anims.create({
            key: 'jump',
            frames: [ { key: 'player', frame: 2 } ], 
            frameRate: 10
        });

        // Start the game with the player running
        this.player.play('run');

        this.cursors = this.input.keyboard.createCursorKeys();

        // Single-Switch jump buffer input handling
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
        // Gradually increase game speed over time
        if (this.gameSpeed < this.maxSpeed) {
            this.gameSpeed += this.acceleration * (delta / 1000);
        }

        this.score += (this.gameSpeed * delta) / 100000;
        this.scoreText.setText('Distance: ' + Math.floor(this.score) + 'm');

        // Scroll Parallax Backgrounds
        this.bgSky.tilePositionX += (this.gameSpeed * delta) / 1000 * 0.05;
        
        this.bgMountains.tilePositionX += (this.gameSpeed * delta) / 1000 * 0.20;

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
        
        // Single-switch input check for fast fall logic
        const isActionHeld = this.cursors.space.isDown || this.input.activePointer.isDown;

        if (onGround) {
            this.coyoteTimer = this.coyoteTimeMax;
            this.jumpCount = 0;
            
            // === ADD: Reset fast fall, remove tint, play run anim when landing ===
            this.isFastFalling = false;
            this.player.play('run', true);
            this.player.clearTint();

            // Cut the fall sound off smoothly if they land
            if (this.sfxFall.isPlaying) {
                this.sfxFall.stop(); 
            }
        } else {
            this.coyoteTimer -= delta;
            
            // Play the jump pose while in the air
            this.player.play('jump', true);
            
            // Fast fall logic: Player must be falling AND holding the action button
            if (isActionHeld && this.player.body.velocity.y > 0) {
                this.isFastFalling = true;
                this.player.setVelocityY(this.fastFallVelocity);
                
                // Add a yellow visual tint to the sprite for feedback
                this.player.setTint(0xFFFF00); 

                // Play the fall sound ONLY if it isn't already playing
                if (!this.sfxFall.isPlaying) {
                    this.sfxFall.play();
                }
            } else {
                // Stop fast fall when action is released
                this.isFastFalling = false;
                this.player.clearTint();

                if (this.sfxFall.isPlaying) {
                    this.sfxFall.stop(); 
                }
            }
        }

        if (this.jumBufferTimer > 0) this.jumBufferTimer -= delta;

        // Jump Execution
        if (this.jumBufferTimer > 0) {
            if (onGround || this.coyoteTimer > 0) {
                this.player.setVelocityY(this.jumpVelocity);
                this.jumpCount = 1;
                this.coyoteTimer = 0;
                this.jumBufferTimer = 0;

                // Play standard jump sound
                this.sfxJump.play({ detune: 0 }); 
            } else if (this.jumpCount > 0 && this.jumpCount < this.maxJumps) {
                this.player.setVelocityY(this.jumpVelocity);
                this.jumpCount++;
                this.jumBufferTimer = 0;

                // Play double jump sound pitched up
                this.sfxJump.play({ detune: 300 }); 
            }
        }

        // Game Over Transition
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