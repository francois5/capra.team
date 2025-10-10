/**
 * Scène principale du jeu isométrique
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('GameScene: Initialisation...');

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

        // Configurer la caméra
        this.setupCamera();

        // Input pour la caméra
        this.setupCameraControls();

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
        } else if (tile.type === 'wall') {
            sprite = this.add.sprite(screenX, screenY, 'iso-wall');
            // Les murs sont centrés différemment (ils sont plus hauts)
            sprite.setOrigin(0.5, 0.65);
        }

        if (sprite) {
            // Définir l'origine pour que le point d'ancrage soit au milieu du losange
            sprite.setOrigin(0.5, 0.5);

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
            this.player.update();
        }
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
}
