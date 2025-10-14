/**
 * Scène principale du jeu isométrique
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    /**
     * Créer les animations pour les entités
     */
    createAnimations() {
        // Animation du bélier noir
        if (!this.anims.exists('black-ram-idle-anim')) {
            this.anims.create({
                key: 'black-ram-idle-anim',
                frames: this.anims.generateFrameNumbers('black-ram-idle', { start: 0, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Animations du rat géant
        if (!this.anims.exists('rat-idle-anim')) {
            this.anims.create({
                key: 'rat-idle-anim',
                frames: this.anims.generateFrameNumbers('rat-idle', { start: 0, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists('rat-walk-left-anim')) {
            this.anims.create({
                key: 'rat-walk-left-anim',
                frames: this.anims.generateFrameNumbers('rat-walk-left', { start: 0, end: 15 }),
                frameRate: 12,
                repeat: -1
            });
        }

        if (!this.anims.exists('rat-walk-right-anim')) {
            this.anims.create({
                key: 'rat-walk-right-anim',
                frames: this.anims.generateFrameNumbers('rat-walk-right', { start: 0, end: 15 }),
                frameRate: 12,
                repeat: -1
            });
        }

        if (!this.anims.exists('rat-attack-left-anim')) {
            this.anims.create({
                key: 'rat-attack-left-anim',
                frames: this.anims.generateFrameNumbers('rat-attack-left', { start: 0, end: 15 }),
                frameRate: 16,
                repeat: 0
            });
        }

        if (!this.anims.exists('rat-attack-right-anim')) {
            this.anims.create({
                key: 'rat-attack-right-anim',
                frames: this.anims.generateFrameNumbers('rat-attack-right', { start: 0, end: 15 }),
                frameRate: 16,
                repeat: 0
            });
        }

        console.log('✅ Animations créées pour BlackRam et GiantRat');
    }

    create() {
        console.log('GameScene: Initialisation...');

        // Créer les animations
        this.createAnimations();

        // Générer le monde
        this.world = new WorldGenerator(20, 20);
        this.worldData = this.world.generate();

        // Container pour organiser les layers
        this.tileSprites = [];

        // Calculer l'offset pour centrer le monde
        this.worldOffset = IsoUtils.getWorldOffset(
            this.cameras.main.width,
            this.cameras.main.height
        );

        // Rendre le monde
        this.renderWorld();

        // Créer le joueur
        this.createPlayer();

        // Initialiser les listes d'entités
        this.enemies = [];
        this.blackRams = [];
        this.giantRats = [];

        // Créer le co-détenu (rat géant allié de départ)
        this.createStartingAlly();

        // Créer UN SEUL bélier noir dans une autre chambre
        this.createSingleBlackRam();

        // Configurer la caméra
        this.setupCamera();

        // Input pour la caméra
        this.setupCameraControls();

        // Créer la barre d'outils
        this.toolBar = new ToolBar(this);

        // Créer les barres de vie/mana
        this.healthManaBar = new HealthManaBar(this, this.player);

        // Créer le gestionnaire de tâches
        this.taskManager = new TaskManager(this);

        // Setup mode creusage
        this.diggingMode = false;
        this.setupDigging();

        // Setup système de sorts
        this.setupSpells();

        // Setup raccourcis clavier pour les sorts
        this.setupSpellShortcuts();

        // État du rayon de conversion continu
        this.conversionBeam = {
            active: false,
            graphics: null,
            targetEnemy: null,
            lastDamageTime: 0,
            manaCostPerSecond: 20, // 20 mana par seconde
            loyaltyDamagePerSecond: 60 // 60 loyauté par seconde
        };

        console.log('✅ GameScene initialisée');
    }

    /**
     * Rendre le monde isométrique
     */
    renderWorld() {
        console.log('Rendu du monde iso...');

        // Parcourir toutes les tiles et les rendre
        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                const tile = this.worldData[y][x];
                this.renderTile(x, y, tile);
            }
        }

        console.log(`✅ ${this.tileSprites.length} tiles rendues`);
    }

    /**
     * Rendre une tile spécifique
     * @param {number} x - Position X dans la grille
     * @param {number} y - Position Y dans la grille
     * @param {Object} tile - Données de la tile
     */
    renderTile(x, y, tile) {
        // Convertir en coordonnées iso
        const isoPos = IsoUtils.cartToIso(x, y);

        // Créer le sprite avec l'offset du monde
        const screenX = isoPos.x + this.worldOffset.x;
        const screenY = isoPos.y + this.worldOffset.y;

        let sprite;
        if (tile.type === 'floor') {
            sprite = this.add.sprite(screenX, screenY, 'iso-floor');
            // Origine au centre du losange de sol
            sprite.setOrigin(0.5, 0.5);
            // Pas de teinte - gris partout
        } else if (tile.type === 'wall') {
            sprite = this.add.sprite(screenX, screenY, 'iso-wall');
            // Pour un cube 1m³ : canvas = 64x96 (width x height)
            // Le point d'ancrage doit être au BAS du cube (losange invisible du bas)
            // Centre du losange du bas = Y = 80 (tileHeight + cubeHeight - tileHeight/2)
            // Origine Y = 80 / 96 ≈ 0.833
            sprite.setOrigin(0.5, 0.833);
        }

        if (sprite) {

            // Z-ordering : calculer la profondeur
            // Les tiles de sol ont depth de base
            // Les murs ont depth + 0.5 pour être au-dessus des entités
            const depth = IsoUtils.getDepth(x, y);
            if (tile.type === 'floor') {
                sprite.setDepth(depth);
            } else if (tile.type === 'wall') {
                sprite.setDepth(depth + 0.5);
            }

            // Sauvegarder la référence
            this.tileSprites.push({
                sprite: sprite,
                cartX: x,
                cartY: y,
                tile: tile
            });
        }
    }

    /**
     * Créer le joueur
     */
    createPlayer() {
        const spawnPoint = this.world.getSpawnPoint();

        // Créer le player avec l'offset du monde
        this.player = new Player(this, spawnPoint.x, spawnPoint.y, this.worldOffset);

        console.log(`✅ Player créé à (${spawnPoint.x}, ${spawnPoint.y})`);
    }

    /**
     * Créer le rat géant ennemi de départ (co-détenu à convertir)
     */
    createStartingAlly() {
        const spawnPoint = this.world.getSpawnPoint();

        // Trouver une position adjacent au joueur
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        let spawnX = spawnPoint.x;
        let spawnY = spawnPoint.y;

        for (const [dx, dy] of directions) {
            const testX = spawnPoint.x + dx;
            const testY = spawnPoint.y + dy;
            if (this.world.isPassable(testX, testY)) {
                spawnX = testX;
                spawnY = testY;
                break;
            }
        }

        // Créer le rat ENNEMI (sans summoner)
        const enemyRat = new GiantRat(this, spawnX, spawnY, this.worldOffset, null);

        // Le garder en tant qu'ennemi (team = 'enemy' par défaut)
        // Pas de tint orange, il reste gris

        this.giantRats.push(enemyRat);

        console.log(`✅ Co-détenu (rat ennemi) créé à (${spawnX}, ${spawnY}) - À CONVERTIR`);
        console.log(`📊 Monstres contrôlés: ${this.player.controlledMonsters}/${this.player.maxControlledMonsters}`);
    }

    /**
     * Créer UN SEUL bélier noir dans une autre chambre
     */
    createSingleBlackRam() {
        // Récupérer les régions de chambres depuis le WorldGenerator
        if (!this.world.chambers || this.world.chambers.length < 2) {
            console.log('⚠️ Pas assez de chambres trouvées pour spawner le bélier');
            return;
        }

        // Prendre la deuxième chambre (index 1, pas la chambre de spawn qui est index 0)
        const chamber = this.world.chambers[1];

        if (chamber.length > 0) {
            const randomTile = chamber[Math.floor(Math.random() * chamber.length)];
            const x = randomTile.x;
            const y = randomTile.y;

            // Vérifier que c'est passable
            if (this.world.isPassable(x, y)) {
                const ram = new BlackRam(this, x, y, this.worldOffset);
                this.blackRams.push(ram);
                console.log(`✅ Bélier Noir créé dans chambre 2 à (${x}, ${y})`);
            }
        }
    }

    /**
     * Spawner des ennemis
     * @param {number} count - Nombre d'ennemis à créer
     */
    spawnEnemies(count) {
        // Spawner des ennemis dans les territoires de la chèvre noire et de la lumière
        const territoriesToSpawn = ['black_goat', 'light'];

        for (let i = 0; i < count; i++) {
            // Trouver une position passable aléatoire dans un territoire
            let x, y, tile;
            let attempts = 0;
            do {
                x = Math.floor(Math.random() * this.world.width);
                y = Math.floor(Math.random() * this.world.height);
                tile = this.worldData[y]?.[x];
                attempts++;
            } while (
                (!this.world.isPassable(x, y) ||
                 !tile ||
                 !territoriesToSpawn.includes(tile.territory)) &&
                attempts < 200
            );

            if (attempts < 200 && tile) {
                const enemy = new Enemy(this, x, y, this.worldOffset, tile.territory);
                this.enemies.push(enemy);
                console.log(`✅ Ennemi ${i + 1} créé à (${x}, ${y}) dans territoire ${tile.territory}`);
            }
        }
    }

    /**
     * Spawner des béliers noirs dans 25% des chambres (sauf spawn)
     */
    spawnBlackRamsInChambers() {
        // Récupérer les régions de chambres depuis le WorldGenerator
        if (!this.world.chambers || this.world.chambers.length === 0) {
            console.log('⚠️ Pas de chambres trouvées pour spawner les béliers');
            return;
        }

        const spawnPoint = this.world.getSpawnPoint();
        const chambers = this.world.chambers;

        chambers.forEach((chamber, index) => {
            // Ignorer la chambre de spawn (index 0 = chambre centrale)
            if (index === 0) return;

            // 25% de chance de spawner un bélier dans cette chambre
            if (Math.random() < 0.25) {
                // Trouver une position dans cette chambre
                if (chamber.length > 0) {
                    const randomTile = chamber[Math.floor(Math.random() * chamber.length)];
                    const x = randomTile.x;
                    const y = randomTile.y;

                    // Vérifier que c'est passable
                    if (this.world.isPassable(x, y)) {
                        const ram = new BlackRam(this, x, y, this.worldOffset);
                        this.blackRams.push(ram);
                        console.log(`✅ Bélier Noir créé dans chambre ${index + 1} à (${x}, ${y})`);
                    }
                }
            }
        });

        console.log(`🐏 ${this.blackRams.length} béliers noirs spawnés dans les chambres`);
    }

    /**
     * Configurer le spawn périodique d'ennemis dans les territoires
     */
    setupPeriodicSpawn() {
        // Spawner un nouvel ennemi toutes les 10 secondes
        this.time.addEvent({
            delay: 10000, // 10 secondes
            callback: () => {
                // Limiter le nombre total d'ennemis à 10
                if (this.enemies.length < 10) {
                    this.spawnEnemies(1);
                    console.log(`🔄 Spawn périodique: ${this.enemies.length} ennemis actifs`);
                }
            },
            loop: true
        });
    }

    /**
     * Configurer la caméra
     */
    setupCamera() {
        // Suivre le joueur
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Zoom
        this.cameras.main.setZoom(1.5);

        // Limites (optionnel)
        // this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    }

    /**
     * Configurer les contrôles de caméra (zoom, pan)
     */
    setupCameraControls() {
        // Zoom avec molette (pas encore implémenté dans ce code)
        // On pourrait ajouter des contrôles pour zoom in/out

        this.input.keyboard.on('keydown-PLUS', () => {
            const currentZoom = this.cameras.main.zoom;
            this.cameras.main.setZoom(Math.min(currentZoom + 0.1, 3));
        });

        this.input.keyboard.on('keydown-MINUS', () => {
            const currentZoom = this.cameras.main.zoom;
            this.cameras.main.setZoom(Math.max(currentZoom - 0.1, 0.5));
        });
    }

    update(time, delta) {
        // Mettre à jour le joueur
        if (this.player) {
            this.player.update(time, delta);
        }

        // Mettre à jour les ennemis
        if (this.enemies) {
            this.enemies.forEach(enemy => {
                enemy.update(delta);
            });
        }

        // Mettre à jour les béliers noirs
        if (this.blackRams) {
            this.blackRams.forEach(ram => {
                ram.update(delta);
            });
        }

        // Mettre à jour les rats géants
        if (this.giantRats) {
            this.giantRats.forEach(rat => {
                rat.update(delta);
            });
        }

        // Mettre à jour les workers
        if (this.workers) {
            this.workers.forEach(worker => {
                worker.update(delta);
            });
        }

        // Mettre à jour les barres de vie/mana et le compteur de contrôle
        if (this.healthManaBar && this.player) {
            this.healthManaBar.update(
                this.player.hp,
                this.player.maxHp,
                this.player.mana,
                this.player.maxMana,
                this.player.controlledMonsters,
                this.player.maxControlledMonsters
            );
        }

        // Mettre à jour le rayon de conversion
        if (this.conversionBeam.active) {
            this.updateConversionBeam(delta);
        }

        // Mettre à jour la transparence des murs
        this.updateWallTransparency();
    }

    /**
     * Obtenir le sprite de tile à une position
     * @param {number} x
     * @param {number} y
     * @returns {Object|null}
     */
    getTileSpriteAt(x, y) {
        return this.tileSprites.find(t => t.cartX === x && t.cartY === y);
    }

    /**
     * Mettre en surbrillance une tile (utile pour le debug)
     * @param {number} x
     * @param {number} y
     */
    highlightTile(x, y) {
        const tileSprite = this.getTileSpriteAt(x, y);
        if (tileSprite) {
            tileSprite.sprite.setTint(0xffff00);
            this.time.delayedCall(200, () => {
                tileSprite.sprite.clearTint();
            });
        }
    }

    /**
     * Configurer le système de creusage
     */
    setupDigging() {
        // Rendre tous les sprites de murs cliquables
        this.tileSprites.forEach(tileData => {
            if (tileData.tile.type === 'wall') {
                tileData.sprite.setInteractive();

                // Debug: Stocker la référence pour pouvoir la nettoyer
                if (!tileData.interactiveHandlers) {
                    tileData.interactiveHandlers = {};
                }

                // Highlight au survol
                const overHandler = () => {
                    if (this.toolBar.getCurrentTool() === 'pickaxe') {
                        tileData.sprite.setTint(0xff0000); // Rouge pour creusage
                    }
                };
                tileData.sprite.on('pointerover', overHandler);
                tileData.interactiveHandlers.over = overHandler;

                const outHandler = () => {
                    tileData.sprite.clearTint();
                };
                tileData.sprite.on('pointerout', outHandler);
                tileData.interactiveHandlers.out = outHandler;

                // Marquer pour creusage au clic
                const downHandler = () => {
                    if (this.toolBar.getCurrentTool() === 'pickaxe') {
                        this.taskManager.addDigTask(tileData.cartX, tileData.cartY);
                    }
                };
                tileData.sprite.on('pointerdown', downHandler);
                tileData.interactiveHandlers.down = downHandler;
            }
        });
    }

    /**
     * Creuser un mur
     * @param {number} x
     * @param {number} y
     */
    digWall(x, y) {
        const tileData = this.getTileSpriteAt(x, y);
        if (tileData && tileData.tile.type === 'wall') {
            console.log(`Creusage du mur en (${x}, ${y})`);

            // Position du mur
            const isoPos = IsoUtils.cartToIso(x, y);
            const screenX = isoPos.x + this.worldOffset.x;
            const screenY = isoPos.y + this.worldOffset.y;

            // Animation de particules/débris
            this.createDigParticles(screenX, screenY - 30);

            // Retirer explicitement chaque handler si on les a stockés
            if (tileData.interactiveHandlers) {
                if (tileData.interactiveHandlers.over) {
                    tileData.sprite.off('pointerover', tileData.interactiveHandlers.over);
                }
                if (tileData.interactiveHandlers.out) {
                    tileData.sprite.off('pointerout', tileData.interactiveHandlers.out);
                }
                if (tileData.interactiveHandlers.down) {
                    tileData.sprite.off('pointerdown', tileData.interactiveHandlers.down);
                }
                delete tileData.interactiveHandlers;
            }

            // Retirer tous les autres listeners
            tileData.sprite.removeAllListeners();

            // IMPORTANT: Retirer du plugin d'input de Phaser (seule méthode qui fonctionne!)
            if (tileData.sprite.input) {
                this.input.clear(tileData.sprite);
            }

            // Détruire le sprite du mur
            tileData.sprite.destroy();

            // Convertir en floor dans les données du monde
            tileData.tile.type = 'floor';
            tileData.tile.passable = true;  // IMPORTANT: Rendre traversable !

            // Créer un nouveau sprite de floor à la place (NON interactif)
            const floorSprite = this.add.sprite(screenX, screenY, 'iso-floor');
            floorSprite.setOrigin(0.5, 0.5);
            floorSprite.setDepth(IsoUtils.getDepth(x, y));

            // Mettre à jour les données
            tileData.sprite = floorSprite;

            console.log(`✅ Mur détruit et remplacé par floor`);
        }
    }

    /**
     * Configurer le système de sorts
     */
    setupSpells() {
        // Rendre tout le sol cliquable pour le sort de guérison
        this.input.on('pointerdown', (pointer) => {
            const tool = this.toolBar.getCurrentTool();

            // Seulement pour le sort de guérison
            if (tool === 'heal') {
                // Convertir position écran en position grille
                const worldX = pointer.x - this.worldOffset.x;
                const worldY = pointer.y - this.worldOffset.y;
                const cart = IsoUtils.isoToCart(worldX, worldY);
                const tileX = Math.floor(cart.x);
                const tileY = Math.floor(cart.y);

                // Position iso de la cible
                const targetIso = IsoUtils.cartToIso(tileX + 0.5, tileY + 0.5);
                const targetScreenX = targetIso.x + this.worldOffset.x;
                const targetScreenY = targetIso.y + this.worldOffset.y;

                // Position du joueur
                const playerIso = IsoUtils.cartToIso(this.player.cartX + 0.5, this.player.cartY + 0.5);
                const playerScreenX = playerIso.x + this.worldOffset.x;
                const playerScreenY = playerIso.y + this.worldOffset.y - 30;

                // Lancer le sort
                this.castHeal(playerScreenX, playerScreenY, targetScreenX, targetScreenY);
            }
        });
    }

    /**
     * Configurer les raccourcis clavier pour les sorts
     */
    setupSpellShortcuts() {
        // Touche C pour le rayon de conversion continu
        const keyC = this.input.keyboard.addKey('C');

        // Quand C est enfoncée, activer le rayon
        keyC.on('down', () => {
            this.startConversionBeam();
        });

        // Quand C est relâchée, désactiver le rayon
        keyC.on('up', () => {
            this.stopConversionBeam();
        });

        // Touche H pour sélectionner le sort de guérison
        this.input.keyboard.on('keydown-H', () => {
            this.toolBar.selectTool('heal');
            console.log('❤️ Sort de Guérison sélectionné (touche H)');
        });

        // Touche P pour sélectionner la pioche
        this.input.keyboard.on('keydown-P', () => {
            this.toolBar.selectTool('pickaxe');
            console.log('⛏ Pioche sélectionnée (touche P)');
        });
    }

    /**
     * Lancer le sort de conversion (éclair bleu)
     */
    castConversion(fromX, fromY, toX, toY, tileX, tileY) {
        const manaCost = 10;
        const loyaltyReduction = 30; // Réduit la loyauté de l'ennemi

        // Vérifier si assez de mana
        if (this.player.mana < manaCost) {
            console.log('⚠️ Pas assez de mana !');
            return;
        }

        console.log(`⚡ Sort de conversion lancé sur (${tileX}, ${tileY})`);

        // Consommer la mana
        this.player.mana -= manaCost;

        // Effet d'éclair bleu
        LightningEffect.create(this, fromX, fromY, toX, toY, 0x00aaff, 400);

        // Chercher un ennemi à cette position
        const enemyHit = this.enemies.find(enemy => {
            const dx = Math.abs(enemy.cartX - tileX);
            const dy = Math.abs(enemy.cartY - tileY);
            return dx <= 0.5 && dy <= 0.5; // Adjacent ou même case
        });

        if (enemyHit) {
            // Réduire la loyauté de l'ennemi
            this.time.delayedCall(200, () => {
                enemyHit.reduceLoyalty(loyaltyReduction);
            });
        } else {
            // Logique: convertir un mur en sol (même effet que creuser)
            const tileData = this.getTileSpriteAt(tileX, tileY);
            if (tileData && tileData.tile.type === 'wall') {
                // Attendre la fin de l'éclair avant de transformer
                this.time.delayedCall(200, () => {
                    this.digWall(tileX, tileY);
                });
            }
        }
    }

    /**
     * Lancer le sort de guérison (éclair rouge)
     */
    castHeal(fromX, fromY, toX, toY) {
        const manaCost = 15;
        const healAmount = 30;

        // Vérifier si assez de mana
        if (this.player.mana < manaCost) {
            console.log('⚠️ Pas assez de mana !');
            return;
        }

        // Ne pas guérir si déjà pleine vie
        if (this.player.hp >= this.player.maxHp) {
            console.log('⚠️ Vie déjà au maximum !');
            return;
        }

        console.log('❤️ Sort de guérison lancé');

        // Consommer la mana
        this.player.mana -= manaCost;

        // Effet d'éclair rouge
        LightningEffect.create(this, fromX, fromY, toX, toY, 0xff0000, 400);

        // Régénérer HP
        this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
        console.log(`❤️ +${healAmount} HP (${this.player.hp}/${this.player.maxHp})`);
    }

    /**
     * Créer des particules de débris quand un mur est creusé
     * @param {number} x - Position X à l'écran
     * @param {number} y - Position Y à l'écran
     */
    createDigParticles(x, y) {
        // Créer 8-12 particules de débris
        const particleCount = Phaser.Math.Between(8, 12);

        for (let i = 0; i < particleCount; i++) {
            // Créer un petit carré pour représenter un débris
            const size = Phaser.Math.Between(3, 6);
            const particle = this.add.rectangle(x, y, size, size, 0x8b6f47);
            particle.setDepth(10001);

            // Direction aléatoire
            const angle = Phaser.Math.Between(0, 360);
            const speed = Phaser.Math.Between(50, 150);
            const velocityX = Math.cos(angle * Math.PI / 180) * speed;
            const velocityY = Math.sin(angle * Math.PI / 180) * speed - 50; // Bias vers le haut

            // Animation de la particule
            this.tweens.add({
                targets: particle,
                x: x + velocityX * 0.01 * 500,
                y: y + velocityY * 0.01 * 500 + 100, // Gravité
                alpha: 0,
                duration: 500,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    /**
     * Vérifier si une position est occupée par une entité
     * @param {number} x - Position X dans la grille
     * @param {number} y - Position Y dans la grille
     * @param {Object} excludeEntity - Entité à exclure de la vérification
     * @returns {boolean}
     */
    isPositionOccupied(x, y, excludeEntity = null) {
        // Le joueur peut passer par-dessus ses fidèles
        const isPlayer = excludeEntity === this.player;

        // Vérifier le joueur
        if (this.player && this.player !== excludeEntity &&
            this.player.cartX === x && this.player.cartY === y) {
            return true;
        }

        // Vérifier les ennemis
        if (this.enemies) {
            for (const enemy of this.enemies) {
                if (enemy !== excludeEntity && enemy.state !== 'dead' &&
                    enemy.cartX === x && enemy.cartY === y) {
                    return true;
                }
            }
        }

        // Vérifier les béliers noirs
        if (this.blackRams) {
            for (const ram of this.blackRams) {
                if (ram !== excludeEntity && ram.state !== 'dead' &&
                    ram.cartX === x && ram.cartY === y) {
                    // Le joueur peut passer sur les béliers alliés
                    if (isPlayer && ram.team === 'ally') {
                        continue;
                    }
                    return true;
                }
            }
        }

        // Vérifier les rats géants
        if (this.giantRats) {
            for (const rat of this.giantRats) {
                if (rat !== excludeEntity && rat.state !== 'dead' &&
                    rat.cartX === x && rat.cartY === y) {
                    // Le joueur peut passer sur les rats alliés
                    if (isPlayer && rat.team === 'ally') {
                        continue;
                    }
                    return true;
                }
            }
        }

        // Vérifier les workers
        if (this.workers) {
            for (const worker of this.workers) {
                if (worker !== excludeEntity && worker.state !== 'dead' &&
                    worker.cartX === x && worker.cartY === y) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Trouver l'ennemi le plus proche du joueur dans la même chambre
     * @returns {Enemy|BlackRam|null}
     */
    findNearestEnemy() {
        let nearestEnemy = null;
        let nearestDistance = Infinity;

        // Chercher parmi les ennemis normaux
        if (this.enemies) {
            this.enemies.forEach(enemy => {
                if (enemy.state === 'dead' || enemy.team === 'ally') return;

                // Vérifier si dans la même chambre
                if (!this.world.areInSameChamber(this.player.cartX, this.player.cartY, enemy.cartX, enemy.cartY)) {
                    return;
                }

                const dx = enemy.cartX - this.player.cartX;
                const dy = enemy.cartY - this.player.cartY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            });
        }

        // Chercher parmi les béliers noirs
        if (this.blackRams) {
            this.blackRams.forEach(ram => {
                if (ram.state === 'dead' || ram.team === 'ally') return;

                // Vérifier si dans la même chambre
                if (!this.world.areInSameChamber(this.player.cartX, this.player.cartY, ram.cartX, ram.cartY)) {
                    return;
                }

                const dx = ram.cartX - this.player.cartX;
                const dy = ram.cartY - this.player.cartY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = ram;
                }
            });
        }

        // Chercher parmi les rats géants ennemis
        if (this.giantRats) {
            this.giantRats.forEach(rat => {
                if (rat.state === 'dead' || rat.team === 'ally') return;

                // Vérifier si dans la même chambre
                if (!this.world.areInSameChamber(this.player.cartX, this.player.cartY, rat.cartX, rat.cartY)) {
                    return;
                }

                const dx = rat.cartX - this.player.cartX;
                const dy = rat.cartY - this.player.cartY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = rat;
                }
            });
        }

        // Limiter la portée du rayon à 10 tiles
        if (nearestDistance > 10) {
            return null;
        }

        return nearestEnemy;
    }

    /**
     * Démarrer le rayon de conversion
     */
    startConversionBeam() {
        // Vérifier si assez de mana
        if (this.player.mana <= 0) {
            console.log('⚠️ Pas assez de mana !');
            return;
        }

        // Trouver l'ennemi le plus proche
        const enemy = this.findNearestEnemy();
        if (!enemy) {
            console.log('⚠️ Aucun ennemi à portée !');
            return;
        }

        console.log('⚡ Rayon de conversion activé !');
        this.conversionBeam.active = true;
        this.conversionBeam.targetEnemy = enemy;
        this.conversionBeam.lastDamageTime = 0;

        // Créer le graphics pour le rayon
        this.conversionBeam.graphics = this.add.graphics();
        this.conversionBeam.graphics.setDepth(9999);
    }

    /**
     * Mettre à jour le rayon de conversion
     * @param {number} delta - Temps écoulé en ms
     */
    updateConversionBeam(delta) {
        const beam = this.conversionBeam;

        // Vérifier si assez de mana
        if (this.player.mana <= 0) {
            this.stopConversionBeam();
            console.log('⚠️ Mana épuisée !');
            return;
        }

        // Vérifier si la cible est toujours valide
        if (!beam.targetEnemy || beam.targetEnemy.state === 'dead' || beam.targetEnemy.loyalty <= 0) {
            // Chercher un nouvel ennemi
            beam.targetEnemy = this.findNearestEnemy();
            if (!beam.targetEnemy) {
                this.stopConversionBeam();
                console.log('⚠️ Plus d\'ennemi à portée !');
                return;
            }
        }

        // Consommer la mana (proportionnel au delta)
        const manaConsumption = (beam.manaCostPerSecond * delta) / 1000;
        this.player.mana = Math.max(0, this.player.mana - manaConsumption);

        // Infliger des dégâts de loyauté périodiquement (tous les 100ms)
        beam.lastDamageTime += delta;
        if (beam.lastDamageTime >= 100) {
            const loyaltyDamage = (beam.loyaltyDamagePerSecond * beam.lastDamageTime) / 1000;
            beam.targetEnemy.reduceLoyalty(loyaltyDamage);
            beam.lastDamageTime = 0;
        }

        // Dessiner le rayon
        this.drawConversionBeam();
    }

    /**
     * Dessiner le rayon de conversion
     */
    drawConversionBeam() {
        const beam = this.conversionBeam;
        if (!beam.graphics || !beam.targetEnemy) return;

        // Effacer le rayon précédent
        beam.graphics.clear();

        // Position du joueur
        const playerIso = IsoUtils.cartToIso(this.player.cartX + 0.5, this.player.cartY + 0.5);
        const playerX = playerIso.x + this.worldOffset.x;
        const playerY = playerIso.y + this.worldOffset.y - 30;

        // Position de l'ennemi
        const enemyIso = IsoUtils.cartToIso(beam.targetEnemy.cartX + 0.5, beam.targetEnemy.cartY + 0.5);
        const enemyX = enemyIso.x + this.worldOffset.x;
        const enemyY = enemyIso.y + this.worldOffset.y - 30;

        // Générer des points avec zigzag pour effet d'éclair
        const points = this.generateBeamPoints(playerX, playerY, enemyX, enemyY);

        // Dessiner le rayon principal (bleu)
        beam.graphics.lineStyle(3, 0x00aaff, 1);
        beam.graphics.beginPath();
        beam.graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            beam.graphics.lineTo(points[i].x, points[i].y);
        }
        beam.graphics.strokePath();

        // Dessiner un halo plus large et transparent
        beam.graphics.lineStyle(8, 0x00aaff, 0.3);
        beam.graphics.beginPath();
        beam.graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            beam.graphics.lineTo(points[i].x, points[i].y);
        }
        beam.graphics.strokePath();

        // Flash au point d'impact
        const circle = this.add.circle(enemyX, enemyY, 8, 0x00aaff, 0.8);
        circle.setDepth(10000);
        this.tweens.add({
            targets: circle,
            alpha: 0,
            duration: 100,
            onComplete: () => {
                circle.destroy();
            }
        });
    }

    /**
     * Générer les points d'un rayon avec effet zigzag
     */
    generateBeamPoints(x1, y1, x2, y2) {
        const points = [];
        const segments = 12;

        points.push({ x: x1, y: y1 });

        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;

            // Ajouter une variation aléatoire perpendiculaire
            const dx = x2 - x1;
            const dy = y2 - y1;
            const perpX = -dy;
            const perpY = dx;
            const length = Math.sqrt(perpX * perpX + perpY * perpY);
            const offset = (Math.random() - 0.5) * 15; // Moins de zigzag pour un rayon continu

            points.push({
                x: x + (perpX / length) * offset,
                y: y + (perpY / length) * offset
            });
        }

        points.push({ x: x2, y: y2 });

        return points;
    }

    /**
     * Arrêter le rayon de conversion
     */
    stopConversionBeam() {
        console.log('⚡ Rayon de conversion désactivé');
        this.conversionBeam.active = false;
        this.conversionBeam.targetEnemy = null;

        if (this.conversionBeam.graphics) {
            this.conversionBeam.graphics.destroy();
            this.conversionBeam.graphics = null;
        }
    }

    /**
     * Mettre à jour la transparence des murs pour voir les personnages cachés
     */
    updateWallTransparency() {
        if (!this.player) return;

        // Collecter toutes les entités (joueur, ennemis, rats, béliers)
        const entities = [this.player];

        if (this.enemies) {
            entities.push(...this.enemies.filter(e => e.state !== 'dead'));
        }
        if (this.giantRats) {
            entities.push(...this.giantRats.filter(r => r.state !== 'dead'));
        }
        if (this.blackRams) {
            entities.push(...this.blackRams.filter(r => r.state !== 'dead'));
        }
        if (this.workers) {
            entities.push(...this.workers.filter(w => w.state !== 'dead'));
        }

        // Réinitialiser l'alpha de tous les murs et entités
        this.tileSprites.forEach(tileData => {
            if (tileData.tile.type === 'wall') {
                tileData.sprite.setAlpha(1);
                // Profondeur normale pour les murs opaques (au-dessus des entités)
                const depth = IsoUtils.getDepth(tileData.cartX, tileData.cartY);
                tileData.sprite.setDepth(depth + 0.5);
            }
        });

        // Réinitialiser l'alpha de toutes les entités
        entities.forEach(entity => {
            entity.setAlpha(1);
            // Réinitialiser les barres de santé/loyauté aussi
            if (entity.healthBar) entity.healthBar.setAlpha(1);
            if (entity.healthBarBg) entity.healthBarBg.setAlpha(1);
            if (entity.loyaltyBar) entity.loyaltyBar.setAlpha(1);
            if (entity.loyaltyBarBg) entity.loyaltyBarBg.setAlpha(1);
            if (entity.manaBar) entity.manaBar.setAlpha(1);
            if (entity.manaBarBg) entity.manaBarBg.setAlpha(1);
        });

        // Pour chaque entité, vérifier si elle est cachée par un mur
        entities.forEach(entity => {
            let isHiddenByWall = false;

            // Vérifier les murs autour et devant l'entité (dans la direction iso)
            const checkPositions = [
                // Positions "devant" en coordonnées isométriques (vers la caméra)
                { x: entity.cartX - 1, y: entity.cartY },
                { x: entity.cartX, y: entity.cartY - 1 },
                { x: entity.cartX - 1, y: entity.cartY - 1 },
            ];

            checkPositions.forEach(pos => {
                const tileData = this.getTileSpriteAt(pos.x, pos.y);
                if (tileData && tileData.tile.type === 'wall') {
                    // Calculer la profondeur relative
                    const wallDepth = IsoUtils.getDepth(pos.x, pos.y);
                    const entityDepth = IsoUtils.getDepth(entity.cartX, entity.cartY);

                    // Si le mur est "devant" l'entité en profondeur iso
                    if (wallDepth >= entityDepth) {
                        isHiddenByWall = true;
                        // Rendre le mur semi-transparent
                        tileData.sprite.setAlpha(0.3);
                    }
                }
            });

            // Si l'entité est cachée, la rendre semi-transparente mais visible
            if (isHiddenByWall) {
                entity.setAlpha(0.5);
                // Rendre les barres aussi semi-transparentes
                if (entity.healthBar) entity.healthBar.setAlpha(0.5);
                if (entity.healthBarBg) entity.healthBarBg.setAlpha(0.5);
                if (entity.loyaltyBar) entity.loyaltyBar.setAlpha(0.5);
                if (entity.loyaltyBarBg) entity.loyaltyBarBg.setAlpha(0.5);
                if (entity.manaBar) entity.manaBar.setAlpha(0.5);
                if (entity.manaBarBg) entity.manaBarBg.setAlpha(0.5);
            }
        });
    }
}
