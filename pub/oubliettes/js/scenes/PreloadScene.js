class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        console.log('PreloadScene: preload started');

        // Barre de progression
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222);
        progressBox.fillRect(this.cameras.main.width / 2 - 160, this.cameras.main.height / 2 - 25, 320, 50);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Chargement...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        // Événements de chargement
        this.load.on('progress', (value) => {
            console.log('Loading progress:', Math.round(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffeb3b);
            progressBar.fillRect(this.cameras.main.width / 2 - 150, this.cameras.main.height / 2 - 15, 300 * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });

        this.load.on('complete', () => {
            console.log('PreloadScene: all assets loaded');
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        this.load.on('loaderror', (file) => {
            console.error('Failed to load file:', file.src);
        });

        // Génération des assets de base avec du SVG
        this.createPlayerSprite();
        this.createNPCSprites();
        this.createTileSprites();
        this.createUIAssets();
    }

    createPlayerSprite() {
        // Charger les spritesheets du héros depuis Ludo.ai
        // Créer un sprite simple pour le développement si les assets ne chargent pas

        // Tenter de charger les vraies images
        this.load.spritesheet('hero-idle', 'assets/sprites/hero/idle-256px-16.png', {
            frameWidth: 792,  // Largeur totale si c'est une seule image
            frameHeight: 1768
        });

        this.load.spritesheet('hero-walk-left', 'assets/sprites/hero/walk-left-256px-16.png', {
            frameWidth: 684,
            frameHeight: 1124
        });

        this.load.spritesheet('hero-walk-right', 'assets/sprites/hero/walk-right-256px-16.png', {
            frameWidth: 1000,
            frameHeight: 1760
        });

        // Fallback: créer des sprites SVG simples si les images ne se chargent pas
        this.load.on('loaderror', (file) => {
            if (file.key.startsWith('hero-')) {
                console.warn(`Erreur de chargement de ${file.key}, utilisation du fallback SVG`);
                this.createFallbackPlayerSprite(file.key);
            }
        });
    }

    createFallbackPlayerSprite(key) {
        // Créer un sprite simple en SVG comme fallback
        const playerSVG = `
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
                <circle cx="12" cy="12" r="2" fill="#FFF"/>
                <circle cx="20" cy="12" r="2" fill="#FFF"/>
                <path d="M 10 20 Q 16 24 22 20" stroke="#2E7D32" stroke-width="2" fill="none"/>
            </svg>
        `;
        this.textures.addBase64(key, 'data:image/svg+xml;base64,' + btoa(playerSVG));
    }

    createNPCSprites() {
        // Garde
        const guardSVG = `
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="24" height="24" fill="#FF5722" stroke="#D84315" stroke-width="2"/>
                <rect x="10" y="8" width="12" height="4" fill="#FFF"/>
                <circle cx="16" cy="16" r="3" fill="#D84315"/>
            </svg>
        `;
        this.load.image('npc-guard', 'data:image/svg+xml;base64,' + btoa(guardSVG));

        // Marchand
        const merchantSVG = `
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="24" height="24" fill="#FF9800" stroke="#F57C00" stroke-width="2"/>
                <rect x="8" y="8" width="16" height="8" fill="#FFF"/>
                <circle cx="16" cy="20" r="4" fill="#F57C00"/>
            </svg>
        `;
        this.load.image('npc-merchant', 'data:image/svg+xml;base64,' + btoa(merchantSVG));
    }

    createTileSprites() {
        // Sol
        const floorSVG = `
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#666"/>
                <rect x="0" y="0" width="32" height="32" fill="none" stroke="#444" stroke-width="1"/>
            </svg>
        `;
        this.load.image('tile-floor', 'data:image/svg+xml;base64,' + btoa(floorSVG));

        // Mur
        const wallSVG = `
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#444"/>
                <rect x="2" y="2" width="28" height="28" fill="#555"/>
                <rect x="0" y="0" width="32" height="32" fill="none" stroke="#222" stroke-width="1"/>
            </svg>
        `;
        this.load.image('tile-wall', 'data:image/svg+xml;base64,' + btoa(wallSVG));

        // Porte
        const doorSVG = `
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#8D6E63"/>
                <rect x="4" y="4" width="24" height="24" fill="#A1887F"/>
                <circle cx="22" cy="16" r="2" fill="#5D4037"/>
            </svg>
        `;
        this.load.image('tile-door', 'data:image/svg+xml;base64,' + btoa(doorSVG));
    }

    createUIAssets() {
        // Icônes pour l'inventaire
        const swordSVG = `
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="2" width="4" height="16" fill="#C0C0C0"/>
                <rect x="8" y="18" width="8" height="4" fill="#8D6E63"/>
            </svg>
        `;
        this.load.image('icon-sword', 'data:image/svg+xml;base64,' + btoa(swordSVG));

        const potionSVG = `
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="6" width="8" height="12" rx="4" fill="#E91E63"/>
                <rect x="10" y="4" width="4" height="4" fill="#8D6E63"/>
            </svg>
        `;
        this.load.image('icon-potion', 'data:image/svg+xml;base64,' + btoa(potionSVG));
    }

    create() {
        console.log('PreloadScene: create started, launching GameScene');

        // Masquer l'écran de chargement HTML
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // Démarrer la scène principale
        this.scene.start('GameScene');
    }
}