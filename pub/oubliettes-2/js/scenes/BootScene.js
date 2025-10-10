class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('BootScene: Démarrage...');
    }

    create() {
        console.log('BootScene: Lancement PreloadScene');
        this.scene.start('PreloadScene');
    }
}
