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
        // Cube isométrique 1m³ (comme Dungeon Keeper)
        // Base 1m x 1m, hauteur 1m
        const tileWidth = 64;   // Largeur du losange (base 1m x 1m)
        const tileHeight = 32;  // Hauteur du losange (tileWidth / 2)
        const cubeHeight = 64;  // Hauteur du cube = 1m = tileWidth

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
        wallCanvas.height = cubeHeight + tileHeight;
        const wallCtx = wallCanvas.getContext('2d');

        // Face GAUCHE (côté ombre) - Parallélogramme
        // Part du coin gauche du losange du haut et descend de cubeHeight
        wallCtx.fillStyle = '#3a2818';
        wallCtx.strokeStyle = '#2a1808';
        wallCtx.lineWidth = 1;
        wallCtx.beginPath();
        wallCtx.moveTo(0, tileHeight / 2);                    // Coin gauche du losange
        wallCtx.lineTo(tileWidth / 2, tileHeight);            // Coin bas du losange
        wallCtx.lineTo(tileWidth / 2, tileHeight + cubeHeight); // Descend de 128px
        wallCtx.lineTo(0, tileHeight / 2 + cubeHeight);       // Coin bas-gauche du cube
        wallCtx.closePath();
        wallCtx.fill();
        wallCtx.stroke();

        // Face DROITE (côté lumière) - Parallélogramme
        // Part du coin droit du losange du haut et descend de cubeHeight
        wallCtx.fillStyle = '#5a4838';
        wallCtx.strokeStyle = '#4a3828';
        wallCtx.lineWidth = 1;
        wallCtx.beginPath();
        wallCtx.moveTo(tileWidth, tileHeight / 2);            // Coin droit du losange
        wallCtx.lineTo(tileWidth / 2, tileHeight);            // Coin bas du losange
        wallCtx.lineTo(tileWidth / 2, tileHeight + cubeHeight); // Descend de 128px
        wallCtx.lineTo(tileWidth, tileHeight / 2 + cubeHeight); // Coin bas-droit du cube
        wallCtx.closePath();
        wallCtx.fill();
        wallCtx.stroke();

        // Face du HAUT - Losange (la plus claire)
        wallCtx.fillStyle = '#6a5848';
        wallCtx.strokeStyle = '#5a4838';
        wallCtx.lineWidth = 1;
        wallCtx.beginPath();
        wallCtx.moveTo(tileWidth / 2, 0);                    // Sommet du cube
        wallCtx.lineTo(tileWidth, tileHeight / 2);           // Coin droit
        wallCtx.lineTo(tileWidth / 2, tileHeight);           // Coin bas
        wallCtx.lineTo(0, tileHeight / 2);                   // Coin gauche
        wallCtx.closePath();
        wallCtx.fill();
        wallCtx.stroke();

        this.textures.addCanvas('iso-wall', wallCanvas);

        console.log('✅ Cubes isométriques créés (1m³, style Dungeon Keeper)');
    }

    createPlayerSprite() {
        // Charger le spritesheet du héros
        // Spritesheet 4x4 = 16 frames (460x1048 px total)
        this.load.spritesheet('hero-idle', 'assets/sprites/hero/idle-st-256px-16.png', {
            frameWidth: 115,  // 460 / 4 colonnes
            frameHeight: 262  // 1048 / 4 rangées
        });

        // Charger le spritesheet du bélier noir
        // Spritesheet 4x4 = 16 frames (1024x1024 px total)
        this.load.spritesheet('black-ram-idle', 'assets/sprites/black-ram/black-sheep-256px-16.png', {
            frameWidth: 256,  // 1024 / 4 colonnes
            frameHeight: 256  // 1024 / 4 rangées
        });

        // Charger les spritesheets des rats géants
        // Tous en 4x4 = 16 frames (1024x1024 px total)
        this.load.spritesheet('rat-idle', 'assets/sprites/giant-rat/idle-256px-16.png', {
            frameWidth: 256,
            frameHeight: 256
        });

        this.load.spritesheet('rat-walk-left', 'assets/sprites/giant-rat/walk-left-giant-rat-256px-16.png', {
            frameWidth: 256,
            frameHeight: 256
        });

        this.load.spritesheet('rat-walk-right', 'assets/sprites/giant-rat/walk-right-giant-rat-256px-16.png', {
            frameWidth: 256,
            frameHeight: 256
        });

        this.load.spritesheet('rat-attack-left', 'assets/sprites/giant-rat/attaque-left-256px-16.png', {
            frameWidth: 256,
            frameHeight: 256
        });

        this.load.spritesheet('rat-attack-right', 'assets/sprites/giant-rat/attaque-right-256px-16.png', {
            frameWidth: 256,
            frameHeight: 256
        });

        console.log('✅ Hero, Black Ram et Giant Rat spritesheets chargés');
    }

    create() {
        console.log('PreloadScene: Lancement GameScene');
        this.scene.start('GameScene');
    }
}
