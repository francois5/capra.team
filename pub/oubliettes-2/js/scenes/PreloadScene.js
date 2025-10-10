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
        // Cube isométrique parfait (1m³)
        // Ratio 2:1 pour l'isométrie
        const tileWidth = 64;   // Largeur du losange
        const tileHeight = 32;  // Hauteur du losange
        const cubeHeight = 32;  // Hauteur du cube (même que tileHeight pour un cube parfait)

        // Sol (losange plat - vue du dessus d'un cube)
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = tileWidth;
        floorCanvas.height = tileHeight;
        const floorCtx = floorCanvas.getContext('2d');

        // Dessiner le losange (face du haut)
        floorCtx.fillStyle = '#5a5a5a';
        floorCtx.beginPath();
        floorCtx.moveTo(tileWidth / 2, 0);           // Haut
        floorCtx.lineTo(tileWidth, tileHeight / 2);  // Droite
        floorCtx.lineTo(tileWidth / 2, tileHeight);  // Bas
        floorCtx.lineTo(0, tileHeight / 2);          // Gauche
        floorCtx.closePath();
        floorCtx.fill();

        // Contour pour définition
        floorCtx.strokeStyle = '#3a3a3a';
        floorCtx.lineWidth = 1;
        floorCtx.stroke();

        this.textures.addCanvas('iso-floor', floorCanvas);

        // Mur (cube isométrique parfait avec 3 faces visibles)
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = tileWidth;
        wallCanvas.height = tileHeight + cubeHeight;
        const wallCtx = wallCanvas.getContext('2d');

        // Face GAUCHE (côté ombre) - Parallélogramme
        wallCtx.fillStyle = '#3a2818';
        wallCtx.strokeStyle = '#2a1808';
        wallCtx.lineWidth = 1;
        wallCtx.beginPath();
        wallCtx.moveTo(0, tileHeight / 2);               // Bas gauche
        wallCtx.lineTo(0, tileHeight / 2 + cubeHeight);  // Haut gauche (sur l'écran = bas)
        wallCtx.lineTo(tileWidth / 2, tileHeight + cubeHeight);  // Haut milieu
        wallCtx.lineTo(tileWidth / 2, tileHeight);       // Bas milieu
        wallCtx.closePath();
        wallCtx.fill();
        wallCtx.stroke();

        // Face DROITE (côté lumière) - Parallélogramme
        wallCtx.fillStyle = '#5a4838';
        wallCtx.strokeStyle = '#4a3828';
        wallCtx.lineWidth = 1;
        wallCtx.beginPath();
        wallCtx.moveTo(tileWidth / 2, tileHeight);           // Bas milieu
        wallCtx.lineTo(tileWidth / 2, tileHeight + cubeHeight);  // Haut milieu
        wallCtx.lineTo(tileWidth, tileHeight / 2 + cubeHeight);  // Haut droit
        wallCtx.lineTo(tileWidth, tileHeight / 2);           // Bas droit
        wallCtx.closePath();
        wallCtx.fill();
        wallCtx.stroke();

        // Face du HAUT - Losange (la plus claire)
        wallCtx.fillStyle = '#6a5848';
        wallCtx.strokeStyle = '#5a4838';
        wallCtx.lineWidth = 1;
        wallCtx.beginPath();
        wallCtx.moveTo(tileWidth / 2, 0);                    // Haut
        wallCtx.lineTo(tileWidth, tileHeight / 2);           // Droite
        wallCtx.lineTo(tileWidth / 2, tileHeight);           // Bas
        wallCtx.lineTo(0, tileHeight / 2);                   // Gauche
        wallCtx.closePath();
        wallCtx.fill();
        wallCtx.stroke();

        this.textures.addCanvas('iso-wall', wallCanvas);

        console.log('✅ Cubes isométriques parfaits créés (1m³)');
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
