class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialiser l'UI
        this.ui = new UIManager(this);

        // Créer le monde
        this.setupWorld();

        // Créer le joueur
        this.setupPlayer();

        // Créer les NPCs
        this.setupNPCs();

        // Configurer la physique
        this.setupPhysics();

        // Configurer les contrôles
        this.setupInput();

        // Démarrer l'histoire
        this.startStory();

        // Système de pause
        this.isPaused = false;
    }

    setupWorld() {
        // Générer le donjon
        this.dungeonGenerator = new DungeonGenerator(60, 40);
        this.dungeonData = this.dungeonGenerator.generate();

        // Créer le groupe de tiles
        this.tileGroup = this.add.group();

        // Créer les tiles physiques pour les collisions
        this.wallGroup = this.physics.add.staticGroup();

        this.renderDungeon();

        // Limites du monde
        this.physics.world.setBounds(0, 0, 60 * 32, 40 * 32);

        // Ambiance sombre des oubliettes
        this.cameras.main.setBackgroundColor('#0d0d0d');
    }

    renderDungeon() {
        for (let y = 0; y < this.dungeonGenerator.height; y++) {
            for (let x = 0; x < this.dungeonGenerator.width; x++) {
                const tileType = this.dungeonData[y][x];
                const tileX = x * 32;
                const tileY = y * 32;

                let sprite;
                switch (tileType) {
                    case 'floor':
                        sprite = this.add.sprite(tileX, tileY, 'tile-floor');
                        break;
                    case 'wall':
                        sprite = this.add.sprite(tileX, tileY, 'tile-wall');
                        // Ajouter collision pour les murs
                        const wallSprite = this.physics.add.sprite(tileX, tileY, 'tile-wall');
                        wallSprite.body.setImmovable(true);
                        wallSprite.body.setSize(32, 32);
                        this.wallGroup.add(wallSprite);
                        break;
                    case 'door':
                        sprite = this.add.sprite(tileX, tileY, 'tile-door');
                        break;
                }

                if (sprite) {
                    sprite.setOrigin(0, 0);
                    this.tileGroup.add(sprite);
                }
            }
        }
    }

    setupPlayer() {
        // Point de spawn du joueur
        const spawnPoint = this.dungeonGenerator.getSpawnPoint();
        this.player = new Player(this, spawnPoint.x, spawnPoint.y);

        // Configuration spéciale pour un adolescent de 15 ans
        this.player.age = 15;
        this.player.backstory = "Accusé à tort de sorcellerie";

        // Stats initiales d'un jeune inexpérimenté
        this.player.maxHp = 60; // Moins de HP qu'un adulte
        this.player.hp = 60;
        this.player.level = 1;
        this.player.speed = 140; // Assez rapide, c'est un ado

        // Ajuster l'échelle pour les sprites Ludo.ai
        // Les sprites font ~1700px de haut, on les réduit pour faire 2 blocs (64px)
        // 64px / 1700px = 0.0376
        this.player.setScale(0.038); // 1700 * 0.038 = ~64px de haut (2 blocs)
        // La hitbox est configurée dans Player.js (2 blocs = 64px)

        // Système de compétences principal
        this.player.skills = {
            magic: 0,      // Commence à 0, doit apprendre
            combat: 1,     // Très basique
            charisma: 2    // Un peu naturel pour un jeune
        };

        // Sorts connus (commence vide)
        this.player.spells = [];

        // Configuration de la caméra pour suivre le joueur
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(0.1, 0.1);
        this.cameras.main.setZoom(1.2); // Zoom un peu plus proche pour l'ambiance

        // Debug: afficher la hitbox (désactiver en production)
        this.physics.world.createDebugGraphic();

        // Effet de vignette pour l'ambiance sombre
        this.createVignetteEffect();
    }

    createVignetteEffect() {
        const graphics = this.add.graphics();
        graphics.setScrollFactor(0);

        // Créer un gradient radial pour l'effet de vignette
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Rectangle noir avec transparence croissante vers le centre
        graphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.6, 0.6, 0.6, 0.6);
        graphics.fillRect(0, 0, width, height);

        // Trou au centre
        graphics.fillStyle(0x000000, 0);
        graphics.fillCircle(width/2, height/2, Math.min(width, height) * 0.4);

        graphics.setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    setupNPCs() {
        this.npcGroup = this.physics.add.group();

        const npcSpawnPoints = this.dungeonGenerator.getNPCSpawnPoints();

        // Créer des NPCs spécifiques à l'histoire
        npcSpawnPoints.forEach(spawn => {
            let npc;
            if (spawn.type === 'guard') {
                npc = new NPC(this, spawn.x, spawn.y, 'guard');
                // Gardes hostiles au début
                npc.dialogues = [
                    "Toi ! Le petit sorcier !",
                    "Tu restes ici jusqu'à ton jugement !",
                    "N'essaie pas de t'échapper !",
                    "Les oubliettes t'apprendront l'humilité."
                ];
                npc.mood = 'hostile';
            } else if (spawn.type === 'merchant') {
                npc = new NPC(this, spawn.x, spawn.y, 'merchant');
                // Un marchand sympathique, peut-être un ancien prisonnier
                npc.name = "Vieux Marcel";
                npc.dialogues = [
                    "Psst... nouveau prisonnier ?",
                    "J'ai quelques objets cachés si tu veux...",
                    "Les gardes ne fouillent jamais vraiment.",
                    "Tu apprendras à survivre ici, gamin.",
                    "Dis-moi si tu trouves des objets magiques..."
                ];
            }

            if (npc) {
                this.npcGroup.add(npc);
            }
        });

        // Ajouter un mystérieux mentor magique dans une salle cachée
        const wizardRoom = this.dungeonGenerator.rooms.find(room => room.type === 'boss');
        if (wizardRoom) {
            const wizard = new NPC(this,
                (wizardRoom.x + 2) * 32,
                (wizardRoom.y + 2) * 32,
                'wizard'
            );
            wizard.name = "Maître Eldrath";
            wizard.dialogues = [
                "Jeune homme... je sens un potentiel en toi.",
                "La vraie magie vient du cœur, pas de la peur.",
                "Je peux t'enseigner les bases si tu le souhaites.",
                "Mais d'abord, prouve-moi ta détermination.",
                "Trouve-moi trois cristaux magiques dans ces oubliettes."
            ];
            wizard.canTeachMagic = true;
            this.npcGroup.add(wizard);
        }
    }

    setupPhysics() {
        // Collisions joueur-murs
        this.physics.add.collider(this.player, this.wallGroup);

        // Collisions joueur-NPCs (avec interaction)
        this.physics.add.overlap(this.player, this.npcGroup, (player, npc) => {
            // L'interaction se fait via les contrôles, pas automatiquement
        });

        // Empêcher les NPCs de traverser les murs
        this.physics.add.collider(this.npcGroup, this.wallGroup);
    }

    setupInput() {
        // Ajouter les contrôles d'interaction
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.magicKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    }

    startStory() {
        // Introduction narrative
        this.ui.showStoryText(
            "Tu es dans les oubliettes du château...\nAccusé à tort de sorcellerie à 15 ans.\nTu dois apprendre à survivre et à t'échapper.",
            6000
        );

        // Après quelques secondes, donner des conseils
        this.time.delayedCall(7000, () => {
            this.ui.showStoryText(
                "Explore les cellules, parle aux prisonniers.\nApprends la magie, le combat et le charisme pour t'en sortir.",
                5000
            );
        });
    }

    update(time, delta) {
        if (this.isPaused) return;

        // Mettre à jour le joueur
        if (this.player) {
            this.player.update();
        }

        // Mettre à jour les NPCs
        this.npcGroup.children.entries.forEach(npc => {
            npc.update(time, delta);
        });

        // Gérer les interactions
        this.handleInteractions();

        // Vérifier les conditions de progression
        this.checkProgressionConditions();
    }

    handleInteractions() {
        // Interaction avec F
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.tryInteraction();
        }

        // Lancer un sort avec Q
        if (Phaser.Input.Keyboard.JustDown(this.magicKey)) {
            this.tryMagic();
        }

        // Gérer l'UI
        if (Phaser.Input.Keyboard.JustDown(this.player.keys.SPACE)) {
            if (!this.ui.handleInput('SPACE')) {
                this.player.attack();
            }
        }
    }

    tryInteraction() {
        const interactionPoint = this.player.getInteractionPoint();

        // Vérifier s'il y a un NPC proche
        let nearestNPC = null;
        let nearestDistance = Infinity;

        this.npcGroup.children.entries.forEach(npc => {
            const distance = Phaser.Math.Distance.Between(
                interactionPoint.x, interactionPoint.y,
                npc.x, npc.y
            );

            if (distance < npc.getInteractionRange() && distance < nearestDistance) {
                nearestNPC = npc;
                nearestDistance = distance;
            }
        });

        if (nearestNPC) {
            nearestNPC.interact(this.player);

            // Progresser le charisme en parlant aux NPCs
            this.gainSkillXP('charisma', 1);
        }
    }

    tryMagic() {
        if (this.player.spells.length === 0) {
            this.ui.showFloatingText(this.player.x, this.player.y - 20, "Pas de sorts connus!", '#ff0000');
            return;
        }

        // Utiliser le premier sort connu (pour l'instant)
        const spell = this.player.spells[0];
        this.castSpell(spell);
    }

    castSpell(spell) {
        console.log(`Lancement du sort: ${spell.name}`);

        // Effets visuels basiques
        this.createMagicEffect(this.player.x, this.player.y, spell.color || 0x9c27b0);

        // Progresser la compétence magie
        this.gainSkillXP('magic', 2);

        // Coût en mana (si implémenté)
        this.ui.showFloatingText(this.player.x, this.player.y - 30, spell.name, '#9c27b0');
    }

    createMagicEffect(x, y, color) {
        const effect = this.add.graphics();
        effect.fillStyle(color);
        effect.fillCircle(x, y, 5);

        this.tweens.add({
            targets: effect,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    gainSkillXP(skillName, amount) {
        this.player.skills[skillName] += amount;

        // Vérifier les montées de niveau de compétence
        const skillLevel = Math.floor(this.player.skills[skillName] / 10) + 1;
        const previousLevel = Math.floor((this.player.skills[skillName] - amount) / 10) + 1;

        if (skillLevel > previousLevel) {
            this.ui.showSkillUpNotification(skillName.charAt(0).toUpperCase() + skillName.slice(1), skillLevel);

            // Débloquer de nouveaux sorts avec la progression magique
            if (skillName === 'magic') {
                this.checkMagicUnlocks(skillLevel);
            }
        }

        // Mettre à jour l'UI
        this.player.updateUI();
    }

    checkMagicUnlocks(magicLevel) {
        const spellsToUnlock = [
            { level: 1, name: "Lueur", description: "Une petite lumière", color: 0xffeb3b },
            { level: 2, name: "Projectile Magique", description: "Un dard d'énergie", color: 0x2196f3 },
            { level: 3, name: "Soins Mineurs", description: "Soigne les blessures légères", color: 0x4caf50 }
        ];

        spellsToUnlock.forEach(spell => {
            if (magicLevel >= spell.level && !this.player.spells.find(s => s.name === spell.name)) {
                this.player.spells.push(spell);
                this.ui.showMagicSpellLearned(spell.name);
            }
        });
    }

    checkAttackHit(x, y, range) {
        // Vérifier les hits sur les NPCs
        this.npcGroup.children.entries.forEach(npc => {
            const distance = Phaser.Math.Distance.Between(x, y, npc.x, npc.y);
            if (distance <= range) {
                npc.takeDamage(10);
                this.gainSkillXP('combat', 1);
            }
        });
    }

    checkProgressionConditions() {
        // Conditions pour progresser dans l'histoire
        const totalSkillLevel = Object.values(this.player.skills).reduce((sum, skill) => sum + Math.floor(skill / 10), 0);

        // Exemple: si le joueur atteint un certain niveau total, débloquer de nouvelles zones
        if (totalSkillLevel >= 5 && !this.hasUnlockedSecondFloor) {
            this.hasUnlockedSecondFloor = true;
            this.ui.showStoryText("Vous entendez un mécanisme s'activer... Une nouvelle zone s'est ouverte!", 4000);
        }
    }
}