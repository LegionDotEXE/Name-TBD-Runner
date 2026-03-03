class MainMenu extends Phaser.Scene {
    constructor() { super('MainMenu'); }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');
        this.add.text(400, 200, 'SWITCH RUNNER', { fontSize: '48px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 300, 'Press SPACE to Start', { fontSize: '24px', fill: '#000' }).setOrigin(0.5);
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}