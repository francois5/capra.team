// Configuration principale du jeu Oubliettes
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'gameContainer',
    backgroundColor: '#0d0d0d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Mettre à true pour voir les hitboxes
        }
    },
    scene: [BootScene, PreloadScene, GameScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true, // Pour un rendu net des sprites
    antialias: false
};

// Variables globales du jeu
let game;
let gameData = {
    playerName: "Jeune Accusé",
    daysSinceCapture: 1,
    reputation: -10, // Commence très bas car accusé de sorcellerie
    storyFlags: {
        metWizard: false,
        learnedFirstSpell: false,
        befriendedGuard: false,
        foundSecretPassage: false,
        escapedDungeon: false
    },
    achievements: []
};

// Système de sauvegarde simple
const SaveSystem = {
    save() {
        const saveData = {
            gameData: gameData,
            playerStats: {
                hp: game.scene.getScene('GameScene').player.hp,
                skills: game.scene.getScene('GameScene').player.skills,
                spells: game.scene.getScene('GameScene').player.spells,
                inventory: game.scene.getScene('GameScene').player.inventory,
                x: game.scene.getScene('GameScene').player.x,
                y: game.scene.getScene('GameScene').player.y
            },
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('oubliettes_save', JSON.stringify(saveData));
        console.log('Jeu sauvegardé');
    },

    load() {
        const saveData = localStorage.getItem('oubliettes_save');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                gameData = data.gameData;
                console.log('Sauvegarde chargée');
                return data.playerStats;
            } catch (e) {
                console.error('Erreur lors du chargement de la sauvegarde:', e);
            }
        }
        return null;
    },

    exists() {
        return localStorage.getItem('oubliettes_save') !== null;
    },

    delete() {
        localStorage.removeItem('oubliettes_save');
        console.log('Sauvegarde supprimée');
    }
};

// Système d'achievements
const AchievementSystem = {
    achievements: [
        {
            id: 'first_spell',
            name: 'Premier Sort',
            description: 'Apprendre votre premier sort de magie',
            unlocked: false
        },
        {
            id: 'charismatic',
            name: 'Charisme Naturel',
            description: 'Atteindre le niveau 3 en charisme',
            unlocked: false
        },
        {
            id: 'warrior',
            name: 'Apprenti Guerrier',
            description: 'Atteindre le niveau 3 en combat',
            unlocked: false
        },
        {
            id: 'mage_apprentice',
            name: 'Apprenti Mage',
            description: 'Atteindre le niveau 3 en magie',
            unlocked: false
        },
        {
            id: 'escape_artist',
            name: 'Maître de l\'Évasion',
            description: 'S\'échapper des oubliettes',
            unlocked: false
        }
    ],

    unlock(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            gameData.achievements.push(achievementId);
            this.showAchievementNotification(achievement);
        }
    },

    showAchievementNotification(achievement) {
        // Créer une notification d'achievement
        console.log(`🏆 Achievement débloqué: ${achievement.name} - ${achievement.description}`);

        // TODO: Afficher une notification dans l'UI
        if (game && game.scene.getScene('GameScene').ui) {
            game.scene.getScene('GameScene').ui.showStoryText(
                `🏆 Achievement: ${achievement.name}\n${achievement.description}`,
                3000
            );
        }
    },

    checkProgress(player) {
        // Vérifier les conditions d'achievements
        if (player.spells.length > 0) {
            this.unlock('first_spell');
        }

        const magicLevel = Math.floor(player.skills.magic / 10) + 1;
        const combatLevel = Math.floor(player.skills.combat / 10) + 1;
        const charismaLevel = Math.floor(player.skills.charisma / 10) + 1;

        if (magicLevel >= 3) this.unlock('mage_apprentice');
        if (combatLevel >= 3) this.unlock('warrior');
        if (charismaLevel >= 3) this.unlock('charismatic');
    }
};

// Système de narration dynamique
const StorySystem = {
    getRandomStoryEvent() {
        const events = [
            {
                condition: () => gameData.daysSinceCapture > 3,
                text: "Vous entendez des murmures dans les couloirs... Quelqu'un planifie-t-il quelque chose ?",
                effect: () => gameData.reputation += 1
            },
            {
                condition: () => game.scene.getScene('GameScene').player.skills.magic > 10,
                text: "Votre pratique magique n'est pas passée inaperçue. Les autres prisonniers vous regardent différemment.",
                effect: () => gameData.reputation += 2
            },
            {
                condition: () => game.scene.getScene('GameScene').player.skills.charisma > 15,
                text: "Votre charisme naturel commence à vous attirer des alliés parmi les prisonniers.",
                effect: () => gameData.reputation += 3
            }
        ];

        const availableEvents = events.filter(event => event.condition());
        if (availableEvents.length > 0) {
            const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            return event;
        }
        return null;
    },

    triggerRandomEvent() {
        const event = this.getRandomStoryEvent();
        if (event && Math.random() < 0.1) { // 10% de chance
            if (game && game.scene.getScene('GameScene').ui) {
                game.scene.getScene('GameScene').ui.showStoryText(event.text, 5000);
                event.effect();
            }
        }
    }
};

// Initialisation du jeu
function initGame() {
    console.log('🎮 Initialisation d\'Oubliettes...');

    // Vérifier s'il y a une sauvegarde
    if (SaveSystem.exists()) {
        console.log('💾 Sauvegarde détectée');
    }

    // Créer le jeu
    game = new Phaser.Game(config);

    // Ajouter des gestionnaires d'événements globaux
    setupGlobalEvents();

    // Système de sauvegarde automatique toutes les 2 minutes
    setInterval(() => {
        if (game && game.scene.getScene('GameScene').player) {
            SaveSystem.save();
        }
    }, 120000);

    console.log('✅ Oubliettes initialisé avec succès !');
}

function setupGlobalEvents() {
    // Gérer le redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        if (game) {
            game.scale.resize(window.innerWidth, window.innerHeight);
        }
    });

    // Gestionnaire de visibilité pour pause/reprise
    document.addEventListener('visibilitychange', () => {
        if (game && game.scene.getScene('GameScene')) {
            const gameScene = game.scene.getScene('GameScene');
            if (document.hidden) {
                gameScene.isPaused = true;
                console.log('⏸️ Jeu en pause');
            } else {
                gameScene.isPaused = false;
                console.log('▶️ Jeu repris');
            }
        }
    });

    // Contrôles globaux
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'F1':
                e.preventDefault();
                showHelp();
                break;
            case 'F5':
                e.preventDefault();
                SaveSystem.save();
                break;
            case 'F9':
                e.preventDefault();
                if (SaveSystem.exists()) {
                    location.reload(); // Recharger pour charger la sauvegarde
                }
                break;
        }
    });
}

function showHelp() {
    const helpText = `
🎮 OUBLIETTES - Aide

🎯 Objectif: S'échapper des oubliettes en développant vos compétences

⌨️ Contrôles:
WASD / Flèches: Déplacement
F: Interagir avec les NPCs
Q: Lancer un sort (si vous en connaissez)
Espace: Attaquer / Fermer dialogue
E: Inventaire (futur)

📊 Compétences:
🔮 Magie: Apprenez des sorts auprès du maître
⚔️ Combat: Améliorez vos capacités de combat
💬 Charisme: Influencez les autres prisonniers

💾 Sauvegarde:
F5: Sauvegarder manuellement
F9: Charger la sauvegarde

🎭 Histoire:
Vous êtes un jeune de 15 ans accusé à tort de sorcellerie.
Explorez, apprenez et trouvez un moyen de vous échapper !
    `;

    alert(helpText);
}

// Ajouter des utilitaires de développement
const DevTools = {
    enabled: window.location.hostname === 'localhost',

    addSkill(skillName, amount) {
        if (!this.enabled) return;
        const scene = game.scene.getScene('GameScene');
        if (scene && scene.player) {
            scene.gainSkillXP(skillName, amount);
            console.log(`Ajouté ${amount} XP en ${skillName}`);
        }
    },

    learnSpell(spellName) {
        if (!this.enabled) return;
        const scene = game.scene.getScene('GameScene');
        if (scene && scene.player) {
            const spell = { name: spellName, description: "Sort de test", color: 0xff0000 };
            scene.player.spells.push(spell);
            scene.ui.showMagicSpellLearned(spellName);
        }
    },

    toggleDebug() {
        if (!this.enabled) return;
        const scene = game.scene.getScene('GameScene');
        if (scene) {
            scene.physics.world.debugGraphic.visible = !scene.physics.world.debugGraphic.visible;
        }
    }
};

// Exposer les outils de développement dans la console
if (DevTools.enabled) {
    window.DevTools = DevTools;
    window.SaveSystem = SaveSystem;
    window.gameData = gameData;
    console.log('🛠️ Outils de développement activés. Tapez DevTools pour voir les commandes.');
}

// Démarrer le jeu quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

// Gestion des erreurs globales
window.addEventListener('error', (e) => {
    console.error('❌ Erreur dans Oubliettes:', e.error);
});

// Événement personnalisé pour la progression du joueur
document.addEventListener('playerProgress', (e) => {
    const { player } = e.detail;
    AchievementSystem.checkProgress(player);
    StorySystem.triggerRandomEvent();
    gameData.daysSinceCapture += 0.1; // Progression du temps
});