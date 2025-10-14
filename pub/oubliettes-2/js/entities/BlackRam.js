/**
 * Bélier Noir - Invoque des rats géants, ne combat pas directement
 * Convertir un bélier augmente la limite de monstres contrôlables
 */
class BlackRam extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, cartX, cartY, worldOffset = { x: 0, y: 0 }) {
        // Convertir position cartésienne en iso
        const isoPos = IsoUtils.cartToIso(cartX, cartY);

        super(scene, isoPos.x + worldOffset.x, isoPos.y + worldOffset.y, 'black-ram-idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Position dans la grille
        this.cartX = cartX;
        this.cartY = cartY;
        this.worldOffset = worldOffset;

        // Échelle et apparence
        this.setScale(0.25); // Taille appropriée pour le bélier
        this.territoryColor = 0x000000;

        // Origine aux pieds
        this.setOrigin(0.5, 1);

        // Jouer l'animation idle
        this.play('black-ram-idle-anim');

        // Configuration physique
        this.setCollideWorldBounds(false);
        this.body.setSize(28, 16);
        this.body.setOffset(44, 246);

        // Stats
        this.speed = 0; // Ne bouge pas
        this.isMoving = false;

        // Stats de combat (ne combat pas directement)
        this.maxHp = 30;
        this.hp = 30;
        this.damage = 0;

        // Système de loyauté (pour conversion)
        this.maxLoyalty = 150; // Plus difficile à convertir
        this.loyalty = 150;

        // État
        this.state = 'idle'; // idle, summoning, dead
        this.team = 'enemy';

        // Référence à la scène
        this.scene = scene;

        // Système d'invocation
        this.summonCooldown = 0;
        this.summonDelay = 15000; // Invoque un rat toutes les 15 secondes (laisse le temps de convertir)
        this.maxRats = 1; // Maximum 1 rat (un seul)

        // Créer les barres de vie et loyauté
        this.createHealthBar();
        this.createLoyaltyBar();

        // Mettre à jour le z-ordering initial
        this.updateDepth();

        console.log(`Bélier Noir créé à (${cartX}, ${cartY})`);
    }

    /**
     * Créer la barre de vie au-dessus du bélier
     */
    createHealthBar() {
        const barWidth = 30;
        const barHeight = 4;

        this.healthBarBg = this.scene.add.rectangle(
            this.x,
            this.y - 40,
            barWidth,
            barHeight,
            0x333333
        );
        this.healthBarBg.setOrigin(0.5, 0.5);

        this.healthBar = this.scene.add.rectangle(
            this.x - barWidth / 2 + 1,
            this.y - 40,
            barWidth - 2,
            barHeight - 2,
            0xff0000
        );
        this.healthBar.setOrigin(0, 0.5);

        this.maxHealthBarWidth = barWidth - 2;
    }

    /**
     * Créer la barre de loyauté au-dessus du bélier
     */
    createLoyaltyBar() {
        const barWidth = 30;
        const barHeight = 4;

        this.loyaltyBarBg = this.scene.add.rectangle(
            this.x,
            this.y - 50,
            barWidth,
            barHeight,
            0x000000
        );
        this.loyaltyBarBg.setOrigin(0.5, 0.5);

        this.loyaltyBar = this.scene.add.rectangle(
            this.x - barWidth / 2 + 1,
            this.y - 50,
            0,
            barHeight - 2,
            0xff9900
        );
        this.loyaltyBar.setOrigin(0, 0.5);

        this.maxLoyaltyBarWidth = barWidth - 2;
    }

    /**
     * Mettre à jour la barre de vie
     */
    updateHealthBar() {
        if (this.healthBar && this.healthBarBg) {
            const healthPercent = Math.max(0, this.hp / this.maxHp);
            this.healthBar.width = this.maxHealthBarWidth * healthPercent;

            const screenY = this.y - 40;
            this.healthBarBg.setPosition(this.x, screenY);
            this.healthBar.setPosition(this.x - this.maxHealthBarWidth / 2, screenY);

            this.healthBarBg.setDepth(this.depth + 0.01);
            this.healthBar.setDepth(this.depth + 0.02);
        }
    }

    /**
     * Mettre à jour la barre de loyauté
     */
    updateLoyaltyBar() {
        if (this.loyaltyBar && this.loyaltyBarBg) {
            const conversionPercent = Math.max(0, (this.maxLoyalty - this.loyalty) / this.maxLoyalty);
            this.loyaltyBar.width = this.maxLoyaltyBarWidth * conversionPercent;

            const screenY = this.y - 50;
            this.loyaltyBarBg.setPosition(this.x, screenY);
            this.loyaltyBar.setPosition(this.x - this.maxLoyaltyBarWidth / 2, screenY);

            this.loyaltyBarBg.setDepth(this.depth + 0.01);
            this.loyaltyBar.setDepth(this.depth + 0.02);
        }
    }

    update(delta) {
        if (this.state === 'dead') return;

        // Mettre à jour le cooldown d'invocation
        if (this.summonCooldown > 0) {
            this.summonCooldown -= delta;
        }

        // Invoquer des rats périodiquement (même quand allié)
        this.summonRats();

        // Mettre à jour les barres
        this.updateHealthBar();
        this.updateLoyaltyBar(); // Toujours afficher la barre de loyauté
    }

    /**
     * Invoquer des rats géants
     */
    summonRats() {
        if (this.summonCooldown > 0) return;

        // Compter le nombre de rats vivants invoqués par ce bélier
        const aliveRats = this.scene.giantRats ?
            this.scene.giantRats.filter(rat => rat.summoner === this && rat.state !== 'dead').length : 0;

        if (aliveRats >= this.maxRats) return;

        // Invoquer un rat
        this.state = 'summoning';
        this.summonCooldown = this.summonDelay;

        // Trouver une position adjacent pour invoquer le rat
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [1, -1], [-1, 1], [1, 1]
        ];

        for (const [dx, dy] of directions) {
            const spawnX = this.cartX + dx;
            const spawnY = this.cartY + dy;

            if (this.scene.world.isPassable(spawnX, spawnY)) {
                // Créer le rat géant
                const rat = new GiantRat(this.scene, spawnX, spawnY, this.worldOffset, this);

                if (!this.scene.giantRats) {
                    this.scene.giantRats = [];
                }
                this.scene.giantRats.push(rat);

                console.log(`🐀 Bélier invoque un rat géant en (${spawnX}, ${spawnY})`);

                // Animation d'invocation (flash violet)
                this.setTint(0x8800ff);
                this.scene.time.delayedCall(200, () => {
                    this.setTint(this.territoryColor);
                });

                break;
            }
        }

        this.scene.time.delayedCall(500, () => {
            this.state = 'idle';
        });
    }

    /**
     * Réduire la loyauté (sort de conversion)
     */
    reduceLoyalty(amount) {
        if (this.state === 'dead' || this.team === 'ally') return;

        this.loyalty -= amount;
        console.log(`⚡ Loyauté du bélier réduite de ${amount} (${this.loyalty}/${this.maxLoyalty})`);

        // Flash bleu
        this.setTint(0x4488ff);
        this.scene.time.delayedCall(200, () => {
            if (this.loyalty > 0) {
                this.setTint(this.territoryColor);
            }
        });

        // Si loyauté à 0, convertir
        if (this.loyalty <= 0) {
            this.convert();
        }
    }

    /**
     * Convertir le bélier en allié
     */
    convert() {
        console.log('✨ Bélier Noir converti !');

        // Changer d'équipe
        this.team = 'ally';

        // Augmenter la limite de contrôle du joueur
        if (this.scene.player) {
            this.scene.player.maxControlledMonsters++;
            console.log(`📈 Limite de contrôle augmentée: ${this.scene.player.controlledMonsters}/${this.scene.player.maxControlledMonsters}`);
        }

        // Animation de conversion (flash vert puis or)
        this.setTint(0x00ff00);

        this.scene.time.delayedCall(300, () => {
            // Changer la couleur en or (bélier spécial converti)
            this.setTint(0xffd700);
            this.territoryColor = 0xffd700;

            // GARDER la barre de loyauté visible (pleine et orange)
            // La loyauté reste à 0, donc la barre reste pleine et orange

            this.state = 'idle';
            console.log(`✅ Bélier converti en allié doré`);
        });
    }

    /**
     * Prendre des dégâts
     */
    takeDamage(amount) {
        if (this.state === 'dead') return;

        this.hp -= amount;
        console.log(`💥 Bélier prend ${amount} dégâts (${this.hp}/${this.maxHp})`);

        // Flash blanc
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.hp > 0) {
                this.setTint(this.territoryColor);
            }
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    /**
     * Mourir
     */
    die() {
        this.state = 'dead';
        console.log('💀 Bélier Noir mort');

        // Animation de mort
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 0.1,
            scaleY: 0.1,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });

        // Détruire les barres
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.loyaltyBar) this.loyaltyBar.destroy();
        if (this.loyaltyBarBg) this.loyaltyBarBg.destroy();
    }

    /**
     * Mettre à jour la profondeur
     */
    updateDepth() {
        const currentCart = IsoUtils.isoToCart(this.x - this.worldOffset.x, this.y - this.worldOffset.y);
        const depth = IsoUtils.getDepth(currentCart.x, currentCart.y);
        this.setDepth(depth + 0.1);
    }

    /**
     * Détruire le bélier
     */
    destroy() {
        // Retirer de la liste des béliers
        if (this.scene.blackRams) {
            const index = this.scene.blackRams.indexOf(this);
            if (index > -1) {
                this.scene.blackRams.splice(index, 1);
            }
        }

        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.loyaltyBar) this.loyaltyBar.destroy();
        if (this.loyaltyBarBg) this.loyaltyBarBg.destroy();

        super.destroy();
    }
}
