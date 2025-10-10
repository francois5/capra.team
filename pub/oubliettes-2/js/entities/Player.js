/**
 * Joueur avec mouvements isométriques
 */
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, cartX, cartY, worldOffset = { x: 0, y: 0 }) {
        // Convertir position cartésienne en iso
        const isoPos = IsoUtils.cartToIso(cartX, cartY);

        super(scene, isoPos.x + worldOffset.x, isoPos.y + worldOffset.y, 'hero-idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Position dans la grille
        this.cartX = cartX;
        this.cartY = cartY;
        this.worldOffset = worldOffset;

        // Échelle pour adapter le sprite 115x262px à la taille iso
        // On veut environ 65px de haut pour le perso
        this.setScale(0.25); // 262 * 0.25 = 65px

        // Définir l'origine aux pieds du personnage (centre horizontal, bas vertical)
        this.setOrigin(0.5, 1);

        // Configuration physique
        this.setCollideWorldBounds(false); // On gère nous-mêmes les limites
        this.body.setSize(28, 16); // Hitbox iso (largeur, hauteur)
        this.body.setOffset(44, 246); // Offset pour centrer le body aux pieds (115/2 - 28/2 = 43.5, 262 - 16 = 246)

        // Stats
        this.speed = 3; // Vitesse en tiles/sec
        this.isMoving = false;
        this.moveTarget = null;

        // Direction (pour l'animation future)
        this.facing = 'down';

        // Référence à la scène
        this.scene = scene;

        // Contrôles AZERTY (ZQSD)
        this.keys = {
            Z: scene.input.keyboard.addKey('Z'),
            Q: scene.input.keyboard.addKey('Q'),
            S: scene.input.keyboard.addKey('S'),
            D: scene.input.keyboard.addKey('D'),
            SPACE: scene.input.keyboard.addKey('SPACE')
        };
        this.cursors = scene.input.keyboard.createCursorKeys();

        // Créer les animations
        this.createAnimations();

        // Jouer l'animation idle
        this.play('hero-idle-anim');

        // Mettre à jour le z-ordering initial
        this.updateDepth();

        console.log(`Player créé à (${cartX}, ${cartY})`);
    }

    /**
     * Créer les animations du joueur
     */
    createAnimations() {
        // Animation idle (utilise les 16 frames)
        if (!this.scene.anims.exists('hero-idle-anim')) {
            this.scene.anims.create({
                key: 'hero-idle-anim',
                frames: this.scene.anims.generateFrameNumbers('hero-idle', { start: 0, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
        }
    }

    update() {
        if (this.isMoving) {
            this.updateMovement();
        } else {
            this.handleInput();
        }

        // Mettre à jour l'affichage debug
        this.updateDebugInfo();
    }

    /**
     * Gérer les entrées clavier
     */
    handleInput() {
        let targetX = this.cartX;
        let targetY = this.cartY;

        // Mouvements isométriques (suivent les axes visuels iso)
        // Z = Nord-Ouest (haut à gauche visuel) = x-1, y-1
        // S = Sud-Est (bas à droite visuel) = x+1, y+1
        // Q = Sud-Ouest (bas à gauche visuel) = x-1, y+1
        // D = Nord-Est (haut à droite visuel) = x+1, y-1

        if (this.keys.Z.isDown || this.cursors.up.isDown) {
            targetX -= 1;
            targetY -= 1;
            this.facing = 'up';
        } else if (this.keys.S.isDown || this.cursors.down.isDown) {
            targetX += 1;
            targetY += 1;
            this.facing = 'down';
        }

        if (this.keys.Q.isDown || this.cursors.left.isDown) {
            targetX -= 1;
            targetY += 1;
            this.facing = 'left';
        } else if (this.keys.D.isDown || this.cursors.right.isDown) {
            targetX += 1;
            targetY -= 1;
            this.facing = 'right';
        }

        // Si nouvelle position différente et valide, démarrer le mouvement
        if ((targetX !== this.cartX || targetY !== this.cartY)) {
            if (this.scene.world.isPassable(targetX, targetY)) {
                this.startMoveTo(targetX, targetY);
            }
        }
    }

    /**
     * Démarrer un mouvement vers une nouvelle position
     * @param {number} targetX
     * @param {number} targetY
     */
    startMoveTo(targetX, targetY) {
        this.isMoving = true;
        this.moveTarget = { x: targetX, y: targetY };

        // Calculer position iso cible avec offset
        const targetIso = IsoUtils.cartToIso(targetX, targetY);

        // Créer un tween pour le mouvement fluide
        this.scene.tweens.add({
            targets: this,
            x: targetIso.x + this.worldOffset.x,
            y: targetIso.y + this.worldOffset.y,
            duration: 1000 / this.speed, // Durée basée sur la vitesse
            ease: 'Linear',
            onUpdate: () => {
                // Mettre à jour le depth pendant le mouvement
                this.updateDepth();
            },
            onComplete: () => {
                this.cartX = targetX;
                this.cartY = targetY;
                this.isMoving = false;
                this.moveTarget = null;
            }
        });
    }

    /**
     * Mettre à jour le mouvement en cours
     */
    updateMovement() {
        // Le tween gère le mouvement
        // On pourrait ajouter des animations ici
    }

    /**
     * Mettre à jour la profondeur pour le z-ordering
     */
    updateDepth() {
        // Calculer la position cartésienne actuelle (même pendant mouvement)
        // Soustraire l'offset pour obtenir la vraie position iso
        const currentCart = IsoUtils.isoToCart(this.x - this.worldOffset.x, this.y - this.worldOffset.y);
        const depth = IsoUtils.getDepth(currentCart.x, currentCart.y);
        // Joueur = depth + 0.1 pour être au-dessus des tiles de sol
        // mais en-dessous des murs (depth + 0.5)
        this.setDepth(depth + 0.1);
    }

    /**
     * Obtenir la position cartésienne actuelle
     * @returns {{x: number, y: number}}
     */
    getCartPosition() {
        return { x: this.cartX, y: this.cartY };
    }

    /**
     * Téléporter le joueur à une position
     * @param {number} cartX
     * @param {number} cartY
     */
    teleportTo(cartX, cartY) {
        this.cartX = cartX;
        this.cartY = cartY;
        const isoPos = IsoUtils.cartToIso(cartX, cartY);
        this.setPosition(isoPos.x + this.worldOffset.x, isoPos.y + this.worldOffset.y);
        this.updateDepth();
    }

    /**
     * Mettre à jour l'affichage debug
     */
    updateDebugInfo() {
        const posElement = document.getElementById('pos');
        if (posElement) {
            posElement.textContent = `(${this.cartX}, ${this.cartY})`;
        }
    }
}
