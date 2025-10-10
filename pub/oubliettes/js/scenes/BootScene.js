class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('BootScene: preload started');
        // Pas besoin d'image de chargement pour BootScene
    }

    create() {
        console.log('BootScene: create started, launching PreloadScene');
        // Configuration du jeu
        this.scene.start('PreloadScene');
    }
}