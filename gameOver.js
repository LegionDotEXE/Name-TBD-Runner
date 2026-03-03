class GameOver extends Phaser.Scene {
    constructor() { super('GameOver'); }
    
    init(data) {
        this.finalScore = data.finalScore || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');
        
        if (this.finalScore > window.highScore) {
            window.highScore = this.finalScore;
        }

        this.add.text(400, 150, 'GAME OVER', { fontSize: '48px', fill: '#f00', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 250, 'Distance: ' + Math.floor(this.finalScore) + 'm', { fontSize: '28px', fill: '#000' }).setOrigin(0.5);
        this.add.text(400, 300, 'High Score: ' + Math.floor(window.highScore) + 'm', { fontSize: '28px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 420, 'Press SPACE to Restart', { fontSize: '24px', fill: '#000' }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}