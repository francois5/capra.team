// Configuration Phaser pour vue isométrique
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'gameContainer',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true // Mode debug activé pour voir les erreurs
        }
    },
    scene: [BootScene, PreloadScene, GameScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true,
    antialias: false
};

// Variables globales du jeu
let game;
let gameData = {
    currentLevel: 1,
    playerStats: {
        health: 100,
        maxHealth: 100
    }
};

// Initialisation
function initGame() {
    console.log('🎮 Démarrage Oubliettes 2 - Isométrique...');
    game = new Phaser.Game(config);
    setupGlobalEvents();
}

function setupGlobalEvents() {
    // Redimensionnement
    window.addEventListener('resize', () => {
        if (game) {
            game.scale.resize(window.innerWidth, window.innerHeight);
        }
    });

    // Gestion de la visibilité
    document.addEventListener('visibilitychange', () => {
        if (game && game.scene.getScene('GameScene')) {
            const gameScene = game.scene.getScene('GameScene');
            if (document.hidden) {
                gameScene.scene.pause();
            } else {
                gameScene.scene.resume();
            }
        }
    });
}

// Démarrage quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

// Gestion des erreurs
window.addEventListener('error', (e) => {
    console.error('❌ Erreur:', e.error);
});
