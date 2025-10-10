class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        console.log('PreloadScene: Chargement des assets...');

        // Barre de progression
        this.createLoadingBar();

        // Créer les assets isométriques
        this.createIsoTiles();
        this.createPlayerSprite();
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xf4a460);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }

    createIsoTiles() {
        // Tile isométrique de base (losange)
        // Ratio 2:1 classique - 64x32
        const tileWidth = 64;
        const tileHeight = 32;

        // Sol (tile plat)
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = tileWidth;
        floorCanvas.height = tileHeight;
        const floorCtx = floorCanvas.getContext('2d');

        floorCtx.fillStyle = '#5a5a5a';
        floorCtx.beginPath();
        floorCtx.moveTo(tileWidth / 2, 0);
        floorCtx.lineTo(tileWidth, tileHeight / 2);
        floorCtx.lineTo(tileWidth / 2, tileHeight);
        floorCtx.lineTo(0, tileHeight / 2);
        floorCtx.closePath();
        floorCtx.fill();

        // Contour
        floorCtx.strokeStyle = '#3a3a3a';
        floorCtx.lineWidth = 1;
        floorCtx.stroke();

        this.textures.addCanvas('iso-floor', floorCanvas);

        // Mur (cube iso avec face visible)
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = tileWidth;
        wallCanvas.height = tileHeight + 32; // Hauteur du mur
        const wallCtx = wallCanvas.getContext('2d');

        // Face avant du cube
        wallCtx.fillStyle = '#4a3828';
        wallCtx.beginPath();
        wallCtx.moveTo(tileWidth / 2, 0);
        wallCtx.lineTo(tileWidth, tileHeight / 2);
        wallCtx.lineTo(tileWidth, tileHeight / 2 + 32);
        wallCtx.lineTo(tileWidth / 2, tileHeight + 32);
        wallCtx.lineTo(0, tileHeight / 2 + 32);
        wallCtx.lineTo(0, tileHeight / 2);
        wallCtx.closePath();
        wallCtx.fill();

        // Face gauche (plus sombre)
        wallCtx.fillStyle = '#3a2818';
        wallCtx.beginPath();
        wallCtx.moveTo(tileWidth / 2, 0);
        wallCtx.lineTo(0, tileHeight / 2);
        wallCtx.lineTo(0, tileHeight / 2 + 32);
        wallCtx.lineTo(tileWidth / 2, tileHeight + 32);
        wallCtx.closePath();
        wallCtx.fill();

        // Face droite (encore plus sombre)
        wallCtx.fillStyle = '#2a1808';
        wallCtx.beginPath();
        wallCtx.moveTo(tileWidth / 2, 0);
        wallCtx.lineTo(tileWidth, tileHeight / 2);
        wallCtx.lineTo(tileWidth, tileHeight / 2 + 32);
        wallCtx.lineTo(tileWidth / 2, tileHeight + 32);
        wallCtx.closePath();
        wallCtx.fill();

        // Face du haut
        wallCtx.fillStyle = '#6a5848';
        wallCtx.beginPath();
        wallCtx.moveTo(tileWidth / 2, 0);
        wallCtx.lineTo(tileWidth, tileHeight / 2);
        wallCtx.lineTo(tileWidth / 2, tileHeight);
        wallCtx.lineTo(0, tileHeight / 2);
        wallCtx.closePath();
        wallCtx.fill();

        this.textures.addCanvas('iso-wall', wallCanvas);

        console.log('✅ Tiles isométriques créées');
    }

    createPlayerSprite() {
        // Charger le spritesheet du héros
        // Spritesheet 4x4 = 16 frames (460x1048 px total)
        this.load.spritesheet('hero-idle', 'assets/sprites/hero/idle-st-256px-16.png', {
            frameWidth: 115,  // 460 / 4 colonnes
            frameHeight: 262  // 1048 / 4 rangées
        });

        console.log('✅ Hero spritesheet chargé');
    }

    create() {
        console.log('PreloadScene: Lancement GameScene');
        this.scene.start('GameScene');
    }
}
