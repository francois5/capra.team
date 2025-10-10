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
        // Ne rien charger ici, tout sera créé dans create()
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
        console.log('PreloadScene: create started, creating fallback sprites');

        // Créer les spritesheets programmatiques
        this.createFallbackPlayerSprites();

        // Masquer l'écran de chargement HTML
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        console.log('PreloadScene: launching GameScene');
        // Démarrer la scène principale
        this.scene.start('GameScene');
    }

    createFallbackPlayerSprites() {
        // Créer un canvas pour le spritesheet idle (4 frames)
        const idleCanvas = document.createElement('canvas');
        idleCanvas.width = 32 * 4;
        idleCanvas.height = 32;
        const idleCtx = idleCanvas.getContext('2d');

        for (let i = 0; i < 4; i++) {
            const x = i * 32;
            idleCtx.fillStyle = '#4CAF50';
            idleCtx.beginPath();
            idleCtx.arc(x + 16, 16, 12, 0, Math.PI * 2);
            idleCtx.fill();
            idleCtx.fillStyle = '#FFF';
            idleCtx.beginPath();
            idleCtx.arc(x + 12, 12, 2, 0, Math.PI * 2);
            idleCtx.arc(x + 20, 12, 2, 0, Math.PI * 2);
            idleCtx.fill();
        }

        this.textures.addCanvas('hero-idle', idleCanvas);
        this.textures.get('hero-idle').add('__BASE', 0, 0, 0, 32, 32);
        for (let i = 0; i < 4; i++) {
            this.textures.get('hero-idle').add(i, 0, i * 32, 0, 32, 32);
        }

        // Créer canvas pour walk-left
        const leftCanvas = document.createElement('canvas');
        leftCanvas.width = 32 * 8;
        leftCanvas.height = 32;
        const leftCtx = leftCanvas.getContext('2d');

        for (let i = 0; i < 8; i++) {
            const x = i * 32;
            const shade = i % 2 === 0 ? '#4CAF50' : '#66BB6A';
            leftCtx.fillStyle = shade;
            leftCtx.beginPath();
            leftCtx.arc(x + 16, 16, 12, 0, Math.PI * 2);
            leftCtx.fill();
            leftCtx.fillStyle = '#FFF';
            leftCtx.beginPath();
            leftCtx.arc(x + 12, 12, 2, 0, Math.PI * 2);
            leftCtx.arc(x + 20, 12, 2, 0, Math.PI * 2);
            leftCtx.fill();
        }

        this.textures.addCanvas('hero-walk-left', leftCanvas);
        this.textures.get('hero-walk-left').add('__BASE', 0, 0, 0, 32, 32);
        for (let i = 0; i < 8; i++) {
            this.textures.get('hero-walk-left').add(i, 0, i * 32, 0, 32, 32);
        }

        // Créer canvas pour walk-right
        const rightCanvas = document.createElement('canvas');
        rightCanvas.width = 32 * 16; // 16 frames pour up et down
        rightCanvas.height = 32;
        const rightCtx = rightCanvas.getContext('2d');

        for (let i = 0; i < 16; i++) {
            const x = i * 32;
            const shade = i % 2 === 0 ? '#4CAF50' : '#66BB6A';
            rightCtx.fillStyle = shade;
            rightCtx.beginPath();
            rightCtx.arc(x + 16, 16, 12, 0, Math.PI * 2);
            rightCtx.fill();
            rightCtx.fillStyle = '#FFF';
            rightCtx.beginPath();
            rightCtx.arc(x + 12, 12, 2, 0, Math.PI * 2);
            rightCtx.arc(x + 20, 12, 2, 0, Math.PI * 2);
            rightCtx.fill();
        }

        this.textures.addCanvas('hero-walk-right', rightCanvas);
        this.textures.get('hero-walk-right').add('__BASE', 0, 0, 0, 32, 32);
        for (let i = 0; i < 16; i++) {
            this.textures.get('hero-walk-right').add(i, 0, i * 32, 0, 32, 32);
        }

        console.log('✅ Fallback player sprites created');
    }
}