/**
 * Ennemi qui poursuit et attaque le joueur
 */
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, cartX, cartY, worldOffset = { x: 0, y: 0 }, territory = 'void') {
        // Convertir position cartésienne en iso
        const isoPos = IsoUtils.cartToIso(cartX, cartY);

        super(scene, isoPos.x + worldOffset.x, isoPos.y + worldOffset.y, 'hero-idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Position dans la grille
        this.cartX = cartX;
        this.cartY = cartY;
        this.worldOffset = worldOffset;
        this.territory = territory;

        // Échelle et teinte selon le territoire
        this.setScale(0.25);

        // Définir la couleur selon le territoire
        if (territory === 'black_goat') {
            this.setTint(0xaa00ff); // Violet pour chèvre noire
            this.territoryColor = 0xaa00ff;
        } else if (territory === 'light') {
            this.setTint(0xffaa00); // Orange pour lumière
            this.territoryColor = 0xffaa00;
        } else {
            this.setTint(0xff4444); // Rouge par défaut
            this.territoryColor = 0xff4444;
        }

        // Origine aux pieds
        this.setOrigin(0.5, 1);

        // Configuration physique
        this.setCollideWorldBounds(false);
        this.body.setSize(28, 16);
        this.body.setOffset(44, 246);

        // Stats
        this.speed = 2; // Un peu plus lent que le héros
        this.isMoving = false;
        this.moveTarget = null;

        // Stats de combat
        this.maxHp = 50;
        this.hp = 50;
        this.damage = 10;
        this.attackCooldown = 0;
        this.attackDelay = 1500; // 1.5 secondes entre chaque attaque

        // Système de loyauté (pour conversion)
        this.maxLoyalty = 100;
        this.loyalty = 100;

        // État
        this.state = 'idle'; // idle, chasing, attacking, dead
        this.targetPlayer = null;

        // Team: 'enemy' ou 'ally'
        this.team = 'enemy';
        this.convertedColor = 0xff9800; // Orange pour les convertis

        // Référence à la scène
        this.scene = scene;

        // Créer une barre de vie et de loyauté au-dessus de l'ennemi
        this.createHealthBar();
        this.createLoyaltyBar();

        // Mettre à jour le z-ordering initial
        this.updateDepth();

        console.log(`Ennemi créé à (${cartX}, ${cartY})`);
    }

    /**
     * Créer la barre de vie au-dessus de l'ennemi
     */
    createHealthBar() {
        const barWidth = 30;
        const barHeight = 4;

        // Fond de la barre
        this.healthBarBg = this.scene.add.rectangle(
            this.x,
            this.y - 40,
            barWidth,
            barHeight,
            0x333333
        );
        this.healthBarBg.setOrigin(0.5, 0.5);

        // Barre de vie
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
     * Créer la barre de loyauté au-dessus de l'ennemi
     */
    createLoyaltyBar() {
        const barWidth = 30;
        const barHeight = 4;

        // Fond de la barre (noir)
        this.loyaltyBarBg = this.scene.add.rectangle(
            this.x,
            this.y - 50,
            barWidth,
            barHeight,
            0x000000
        );
        this.loyaltyBarBg.setOrigin(0.5, 0.5);

        // Barre de loyauté (orange, part de 0 et se remplit)
        this.loyaltyBar = this.scene.add.rectangle(
            this.x - barWidth / 2 + 1,
            this.y - 50,
            0, // Commence à 0
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

            // Position de la barre (suit l'ennemi)
            const screenY = this.y - 40;
            this.healthBarBg.setPosition(this.x, screenY);
            this.healthBar.setPosition(this.x - this.maxHealthBarWidth / 2, screenY);

            // Depth
            this.healthBarBg.setDepth(this.depth + 0.01);
            this.healthBar.setDepth(this.depth + 0.02);
        }
    }

    /**
     * Mettre à jour la barre de loyauté
     */
    updateLoyaltyBar() {
        if (this.loyaltyBar && this.loyaltyBarBg) {
            // Inverser: barre se remplit quand loyalty diminue
            const conversionPercent = Math.max(0, (this.maxLoyalty - this.loyalty) / this.maxLoyalty);
            this.loyaltyBar.width = this.maxLoyaltyBarWidth * conversionPercent;

            // Position de la barre (suit l'ennemi)
            const screenY = this.y - 50;
            this.loyaltyBarBg.setPosition(this.x, screenY);
            this.loyaltyBar.setPosition(this.x - this.maxLoyaltyBarWidth / 2, screenY);

            // Depth
            this.loyaltyBarBg.setDepth(this.depth + 0.01);
            this.loyaltyBar.setDepth(this.depth + 0.02);
        }
    }

    update(delta) {
        if (this.state === 'dead') return;

        // Mettre à jour le cooldown d'attaque
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        // Logique différente selon l'équipe
        if (this.team === 'enemy') {
            // Ennemi: poursuivre le joueur
            if (this.state === 'idle' || this.state === 'chasing') {
                if (!this.isMoving) {
                    this.chasePlayer();
                }
            }
        } else if (this.team === 'ally') {
            // Allié: suivre le joueur et attaquer les ennemis
            if (this.state === 'idle' || this.state === 'chasing') {
                if (!this.isMoving) {
                    this.followPlayerAndAttackEnemies();
                }
            }
        }

        // Mettre à jour la barre de vie
        this.updateHealthBar();

        // Mettre à jour la barre de loyauté (seulement pour les ennemis)
        if (this.team === 'enemy') {
            this.updateLoyaltyBar();
        }
    }

    /**
     * Poursuivre le joueur
     */
    chasePlayer() {
        if (!this.scene.player) return;

        const playerX = this.scene.player.cartX;
        const playerY = this.scene.player.cartY;

        // Calculer la distance
        const dx = playerX - this.cartX;
        const dy = playerY - this.cartY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Si adjacent, attaquer
        if (distance <= 1.5) {
            this.attackPlayer();
            return;
        }

        // Sinon, se déplacer vers le joueur
        this.state = 'chasing';

        let nextX = this.cartX;
        let nextY = this.cartY;

        // Déplacement simple : privilégier le plus grand écart
        if (Math.abs(dx) > Math.abs(dy)) {
            nextX = this.cartX + (dx > 0 ? 1 : -1);
        } else {
            nextY = this.cartY + (dy > 0 ? 1 : -1);
        }

        // Vérifier si passable
        if (this.scene.world.isPassable(nextX, nextY)) {
            this.startMoveTo(nextX, nextY);
        } else {
            // Essayer l'autre axe
            if (Math.abs(dx) > Math.abs(dy)) {
                nextX = this.cartX;
                nextY = this.cartY + (dy > 0 ? 1 : -1);
            } else {
                nextX = this.cartX + (dx > 0 ? 1 : -1);
                nextY = this.cartY;
            }

            if (this.scene.world.isPassable(nextX, nextY)) {
                this.startMoveTo(nextX, nextY);
            }
        }
    }

    /**
     * Attaquer le joueur
     */
    attackPlayer() {
        if (this.attackCooldown > 0) return;

        this.state = 'attacking';
        this.attackCooldown = this.attackDelay;

        // Infliger des dégâts
        if (this.scene.player) {
            this.scene.player.takeDamage(this.damage);
            console.log(`💀 Ennemi attaque le joueur : -${this.damage} HP`);

            // Effet visuel d'attaque (flash rouge)
            this.scene.tweens.add({
                targets: this.scene.player,
                alpha: 0.5,
                duration: 100,
                yoyo: true,
                repeat: 1
            });
        }

        // Retour à l'état idle
        this.scene.time.delayedCall(500, () => {
            this.state = 'idle';
        });
    }

    /**
     * Suivre le joueur et attaquer les ennemis (pour les alliés)
     */
    followPlayerAndAttackEnemies() {
        if (!this.scene.player) return;

        const playerX = this.scene.player.cartX;
        const playerY = this.scene.player.cartY;

        // Chercher un ennemi proche (dans un rayon de 6 tiles)
        let closestEnemy = null;
        let closestDistance = Infinity;

        if (this.scene.enemies) {
            this.scene.enemies.forEach(enemy => {
                // Ignorer les alliés et soi-même
                if (enemy === this || enemy.team === 'ally' || enemy.state === 'dead') return;

                const dx = enemy.cartX - this.cartX;
                const dy = enemy.cartY - this.cartY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance && distance <= 6) {
                    closestEnemy = enemy;
                    closestDistance = distance;
                }
            });
        }

        // Si un ennemi est proche, l'attaquer
        if (closestEnemy) {
            if (closestDistance <= 1.5) {
                // Adjacent, attaquer
                this.attackEnemy(closestEnemy);
                return;
            } else {
                // Se déplacer vers l'ennemi
                this.moveTowards(closestEnemy.cartX, closestEnemy.cartY);
                this.state = 'chasing';
                return;
            }
        }

        // Sinon, suivre le joueur à distance
        const dx = playerX - this.cartX;
        const dy = playerY - this.cartY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Garder une distance de 2-3 tiles du joueur
        if (distance > 3) {
            this.moveTowards(playerX, playerY);
            this.state = 'chasing';
        } else {
            this.state = 'idle';
        }
    }

    /**
     * Se déplacer vers une position cible
     */
    moveTowards(targetX, targetY) {
        const dx = targetX - this.cartX;
        const dy = targetY - this.cartY;

        let nextX = this.cartX;
        let nextY = this.cartY;

        // Déplacement simple : privilégier le plus grand écart
        if (Math.abs(dx) > Math.abs(dy)) {
            nextX = this.cartX + (dx > 0 ? 1 : -1);
        } else {
            nextY = this.cartY + (dy > 0 ? 1 : -1);
        }

        // Vérifier si passable
        if (this.scene.world.isPassable(nextX, nextY)) {
            this.startMoveTo(nextX, nextY);
        } else {
            // Essayer l'autre axe
            if (Math.abs(dx) > Math.abs(dy)) {
                nextX = this.cartX;
                nextY = this.cartY + (dy > 0 ? 1 : -1);
            } else {
                nextX = this.cartX + (dx > 0 ? 1 : -1);
                nextY = this.cartY;
            }

            if (this.scene.world.isPassable(nextX, nextY)) {
                this.startMoveTo(nextX, nextY);
            }
        }
    }

    /**
     * Attaquer un ennemi (pour les alliés)
     */
    attackEnemy(enemy) {
        if (this.attackCooldown > 0) return;

        this.state = 'attacking';
        this.attackCooldown = this.attackDelay;

        // Infliger des dégâts
        if (enemy && enemy.team === 'enemy') {
            enemy.takeDamage(this.damage);
            console.log(`⚔️ Allié attaque l'ennemi : -${this.damage} HP`);

            // Effet visuel d'attaque (flash jaune)
            this.scene.tweens.add({
                targets: enemy,
                alpha: 0.5,
                duration: 100,
                yoyo: true,
                repeat: 1
            });
        }

        // Retour à l'état idle
        this.scene.time.delayedCall(300, () => {
            this.state = 'idle';
        });
    }

    /**
     * Démarrer un mouvement vers une nouvelle position
     */
    startMoveTo(targetX, targetY) {
        this.isMoving = true;
        this.moveTarget = { x: targetX, y: targetY };

        const targetIso = IsoUtils.cartToIso(targetX, targetY);

        this.scene.tweens.add({
            targets: this,
            x: targetIso.x + this.worldOffset.x,
            y: targetIso.y + this.worldOffset.y,
            duration: 1000 / this.speed,
            ease: 'Linear',
            onUpdate: () => {
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
     * Mettre à jour la profondeur pour le z-ordering
     */
    updateDepth() {
        const currentCart = IsoUtils.isoToCart(this.x - this.worldOffset.x, this.y - this.worldOffset.y);
        const depth = IsoUtils.getDepth(currentCart.x, currentCart.y);
        this.setDepth(depth + 0.1);
    }

    /**
     * Prendre des dégâts
     */
    takeDamage(amount) {
        if (this.state === 'dead') return;

        this.hp -= amount;
        console.log(`💥 Ennemi prend ${amount} dégâts (${this.hp}/${this.maxHp})`);

        // Flash blanc
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.hp > 0) {
                this.setTint(this.territoryColor);
            }
        });

        // Si mort
        if (this.hp <= 0) {
            this.die();
        }
    }

    /**
     * Réduire la loyauté (sort de conversion)
     */
    reduceLoyalty(amount) {
        if (this.state === 'dead') return;

        this.loyalty -= amount;
        console.log(`⚡ Loyauté réduite de ${amount} (${this.loyalty}/${this.maxLoyalty})`);

        // Flash bleu (pour effet de conversion)
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
     * Convertir l'ennemi en allié
     */
    convert() {
        // Vérifier si le joueur peut contrôler plus de monstres
        if (this.scene.player.controlledMonsters >= this.scene.player.maxControlledMonsters) {
            console.log('⚠️ Limite de monstres contrôlables atteinte !');
            // Simplement retirer la loyauté mais ne pas convertir
            this.loyalty = 0;
            return;
        }

        console.log('✨ Ennemi converti en allié !');

        // Augmenter le compteur de monstres contrôlés
        this.scene.player.controlledMonsters++;
        console.log(`📊 Monstres contrôlés: ${this.scene.player.controlledMonsters}/${this.scene.player.maxControlledMonsters}`);

        // Changer d'équipe
        this.team = 'ally';

        // Animation de conversion (flash vert puis orange)
        this.setTint(0x00ff00);

        this.scene.time.delayedCall(300, () => {
            // Changer la couleur en orange
            this.setTint(this.convertedColor);
            this.territoryColor = this.convertedColor;

            // Détruire la barre de loyauté (plus nécessaire)
            if (this.loyaltyBar) {
                this.loyaltyBar.destroy();
                this.loyaltyBar = null;
            }
            if (this.loyaltyBarBg) {
                this.loyaltyBarBg.destroy();
                this.loyaltyBarBg = null;
            }

            // Reset l'état
            this.state = 'idle';

            console.log(`✅ Ennemi converti en allié orange`);
        });
    }

    /**
     * Mourir
     */
    die() {
        this.state = 'dead';
        console.log('💀 Ennemi mort');

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
     * Détruire l'ennemi
     */
    destroy() {
        // Retirer de la liste des ennemis dans la scène
        if (this.scene.enemies) {
            const index = this.scene.enemies.indexOf(this);
            if (index > -1) {
                this.scene.enemies.splice(index, 1);
            }
        }

        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.loyaltyBar) this.loyaltyBar.destroy();
        if (this.loyaltyBarBg) this.loyaltyBarBg.destroy();

        super.destroy();
    }
}
