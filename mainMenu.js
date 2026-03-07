// MainMenu.js Prefab

class MainMenu extends Phaser.Scene {
    constructor() { super('MainMenu'); }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');
        
        // Position changed slightly
        this.add.text(400, 180, 'SWITCH RUNNER', { fontSize: '48px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        
        // Added Game Instructions
        this.add.text(400, 250, 'SPACE / CLICK - Jump | DOWN - Fast Fall', { fontSize: '18px', fill: '#000' }).setOrigin(0.5);
        this.add.text(400, 275, 'ESC - Pause | Double Jump Enabled', { fontSize: '18px', fill: '#000' }).setOrigin(0.5);
        
        // Moved start prompt down to accommodate instructions
        this.add.text(400, 340, 'Press SPACE to Start', { fontSize: '24px', fill: '#000' }).setOrigin(0.5);
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        }); 
        
        this.input.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}