/**
 * Rat Géant - Invoqué par les Béliers Noirs
 * Attaque le joueur et ses alliés
 */
class GiantRat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, cartX, cartY, worldOffset = { x: 0, y: 0 }, summoner = null) {
        // Convertir position cartésienne en iso
        const isoPos = IsoUtils.cartToIso(cartX, cartY);

        super(scene, isoPos.x + worldOffset.x, isoPos.y + worldOffset.y, 'rat-idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Position dans la grille
        this.cartX = cartX;
        this.cartY = cartY;
        this.worldOffset = worldOffset;
        this.summoner = summoner; // Référence au bélier qui l'a invoqué

        // Échelle et apparence (petit)
        this.setScale(0.12);
        this.territoryColor = 0x666666;

        // Origine aux pieds
        this.setOrigin(0.5, 1);

        // Jouer l'animation idle
        this.play('rat-idle-anim');

        // Direction pour les animations
        this.lastDirection = 'right';

        // Configuration physique
        this.setCollideWorldBounds(false);
        // Ajuster la taille du body pour le sprite de rat
        // Spritesheet 4x4 donc chaque frame = 64x64px
        // À l'échelle 0.12: 64 * 0.12 = 7.68px réel par frame
        this.body.setSize(24, 16);
        this.body.setOffset(20, 46); // Centrer le body sur les pieds du rat

        // Stats (plus faible qu'un ennemi normal)
        this.speed = 3; // Plus rapide
        this.isMoving = false;
        this.moveTarget = null;

        // Stats de combat
        this.maxHp = 20;
        this.hp = 20;
        this.damage = 5;
        this.attackCooldown = 0;
        this.attackDelay = 1000; // 1 seconde entre chaque attaque

        // Système de loyauté (pour conversion)
        this.maxLoyalty = 50; // Facile à convertir
        this.loyalty = 50;

        // État
        this.state = 'idle'; // idle, chasing, attacking, dead
        this.team = 'enemy';

        // Référence à la scène
        this.scene = scene;

        // Créer les barres de vie et loyauté
        this.createHealthBar();
        this.createLoyaltyBar();

        // Mettre à jour le z-ordering initial
        this.updateDepth();

        // Animation d'apparition
        this.alpha = 0;
        scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        console.log(`Rat Géant créé à (${cartX}, ${cartY})`);
    }

    /**
     * Créer la barre de vie au-dessus du rat
     */
    createHealthBar() {
        const barWidth = 20;
        const barHeight = 3;

        this.healthBarBg = this.scene.add.rectangle(
            this.x,
            this.y - 25,
            barWidth,
            barHeight,
            0x333333
        );
        this.healthBarBg.setOrigin(0.5, 0.5);

        this.healthBar = this.scene.add.rectangle(
            this.x - barWidth / 2 + 1,
            this.y - 25,
            barWidth - 2,
            barHeight - 2,
            0xff0000
        );
        this.healthBar.setOrigin(0, 0.5);

        this.maxHealthBarWidth = barWidth - 2;
    }

    /**
     * Créer la barre de loyauté au-dessus du rat
     */
    createLoyaltyBar() {
        const barWidth = 20;
        const barHeight = 3;

        this.loyaltyBarBg = this.scene.add.rectangle(
            this.x,
            this.y - 30,
            barWidth,
            barHeight,
            0x000000
        );
        this.loyaltyBarBg.setOrigin(0.5, 0.5);

        this.loyaltyBar = this.scene.add.rectangle(
            this.x - barWidth / 2 + 1,
            this.y - 30,
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

            const screenY = this.y - 25;
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

            const screenY = this.y - 30;
            this.loyaltyBarBg.setPosition(this.x, screenY);
            this.loyaltyBar.setPosition(this.x - this.maxLoyaltyBarWidth / 2, screenY);

            this.loyaltyBarBg.setDepth(this.depth + 0.01);
            this.loyaltyBar.setDepth(this.depth + 0.02);
        }
    }

    /**
     * Réduire la loyauté (sort de conversion)
     */
    reduceLoyalty(amount) {
        if (this.state === 'dead' || this.team === 'ally') return;

        this.loyalty -= amount;
        console.log(`⚡ Loyauté du rat réduite de ${amount} (${this.loyalty}/${this.maxLoyalty})`);

        // Flash bleu
        this.setTint(0x4488ff);
        this.scene.time.delayedCall(200, () => {
            if (this.loyalty > 0) {
                this.clearTint();
            }
        });

        // Si loyauté à 0, convertir
        if (this.loyalty <= 0) {
            this.convert();
        }
    }

    /**
     * Convertir le rat en allié
     */
    convert() {
        // Vérifier la limite de monstres contrôlables
        if (this.scene.player.controlledMonsters >= this.scene.player.maxControlledMonsters) {
            console.log('⚠️ Limite de monstres contrôlables atteinte !');
            this.loyalty = 0;
            return;
        }

        console.log('✨ Rat Géant converti !');

        // Changer d'équipe
        this.team = 'ally';
        this.scene.player.controlledMonsters++;

        // Animation de conversion (flash vert puis orange)
        this.setTint(0x00ff00);

        this.scene.time.delayedCall(300, () => {
            // Changer la couleur en orange (allié)
            this.setTint(0xff9800);
            this.territoryColor = 0xff9800;

            // GARDER la barre de loyauté visible (pleine et orange)
            // La loyauté reste à 0, donc la barre reste pleine et orange

            this.state = 'idle';
            console.log(`✅ Rat converti en allié (${this.scene.player.controlledMonsters}/${this.scene.player.maxControlledMonsters})`);
        });
    }

    update(delta) {
        if (this.state === 'dead') return;

        // Mettre à jour le cooldown d'attaque
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        // Comportement selon l'équipe
        if (this.team === 'enemy') {
            // Ennemi : poursuivre le joueur
            if (this.state === 'idle' || this.state === 'chasing') {
                if (!this.isMoving) {
                    this.chasePlayer();
                }
            }
        } else if (this.team === 'ally') {
            // Allié : suivre le joueur et attaquer les ennemis
            if (this.state === 'idle' || this.state === 'chasing') {
                if (!this.isMoving) {
                    this.followPlayerAndAttackEnemies();
                }
            }
        }

        // Mettre à jour les barres
        this.updateHealthBar();
        this.updateLoyaltyBar(); // Toujours afficher la barre de loyauté
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

        if (Math.abs(dx) > Math.abs(dy)) {
            nextX = this.cartX + (dx > 0 ? 1 : -1);
        } else {
            nextY = this.cartY + (dy > 0 ? 1 : -1);
        }

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
     * Suivre le joueur et attaquer les ennemis (pour les alliés)
     */
    followPlayerAndAttackEnemies() {
        if (!this.scene.player) return;

        const playerX = this.scene.player.cartX;
        const playerY = this.scene.player.cartY;

        // Chercher un ennemi proche
        let closestEnemy = null;
        let closestDistance = Infinity;

        // Chercher parmi les ennemis normaux
        if (this.scene.enemies) {
            this.scene.enemies.forEach(enemy => {
                if (enemy.team === 'ally' || enemy.state === 'dead') return;

                const dx = enemy.cartX - this.cartX;
                const dy = enemy.cartY - this.cartY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance && distance <= 5) {
                    closestEnemy = enemy;
                    closestDistance = distance;
                }
            });
        }

        // Chercher parmi les rats ennemis (ignorer les alliés)
        if (this.scene.giantRats) {
            this.scene.giantRats.forEach(rat => {
                // Ignorer soi-même, les alliés et les morts
                if (rat === this || rat.state === 'dead') return;
                if (rat.team === 'ally') return; // Ne jamais attaquer un allié

                const dx = rat.cartX - this.cartX;
                const dy = rat.cartY - this.cartY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance && distance <= 5) {
                    closestEnemy = rat;
                    closestDistance = distance;
                }
            });
        }

        // Si un ennemi est proche, l'attaquer
        if (closestEnemy) {
            if (closestDistance <= 1.5) {
                this.attackEnemy(closestEnemy);
                return;
            } else {
                this.moveTowards(closestEnemy.cartX, closestEnemy.cartY);
                this.state = 'chasing';
                return;
            }
        }

        // Sinon, suivre le joueur
        const dx = playerX - this.cartX;
        const dy = playerY - this.cartY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 2) {
            this.moveTowards(playerX, playerY);
            this.state = 'chasing';
        } else {
            this.state = 'idle';
        }
    }

    /**
     * Se déplacer vers une position
     */
    moveTowards(targetX, targetY) {
        const dx = targetX - this.cartX;
        const dy = targetY - this.cartY;

        let nextX = this.cartX;
        let nextY = this.cartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            nextX = this.cartX + (dx > 0 ? 1 : -1);
        } else {
            nextY = this.cartY + (dy > 0 ? 1 : -1);
        }

        if (this.scene.world.isPassable(nextX, nextY)) {
            this.startMoveTo(nextX, nextY);
        } else {
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

        // Vérifier que l'ennemi existe et n'est pas mort
        if (!enemy || enemy.state === 'dead') {
            this.state = 'idle';
            return;
        }

        // Sécurité : ne jamais attaquer un allié
        if (enemy.team === 'ally') {
            console.log('⚠️ Rat allié refuse d\'attaquer un autre allié');
            return;
        }

        this.state = 'attacking';
        this.attackCooldown = this.attackDelay;

        // Jouer l'animation d'attaque selon la direction
        const attackAnim = this.lastDirection === 'left' ? 'rat-attack-left-anim' : 'rat-attack-right-anim';
        this.play(attackAnim);

        if (enemy) {
            enemy.takeDamage(this.damage);
            console.log(`🐀 Rat allié attaque : -${this.damage} HP`);

            this.scene.tweens.add({
                targets: enemy,
                alpha: 0.5,
                duration: 100,
                yoyo: true,
                repeat: 1
            });
        }

        this.scene.time.delayedCall(300, () => {
            this.state = 'idle';
            this.play('rat-idle-anim', true);
        });
    }

    /**
     * Attaquer le joueur
     */
    attackPlayer() {
        if (this.attackCooldown > 0) return;

        // Vérifier que le joueur existe
        if (!this.scene.player || this.scene.player.state === 'dead') {
            this.state = 'idle';
            return;
        }

        this.state = 'attacking';
        this.attackCooldown = this.attackDelay;

        // Jouer l'animation d'attaque selon la direction
        const attackAnim = this.lastDirection === 'left' ? 'rat-attack-left-anim' : 'rat-attack-right-anim';
        this.play(attackAnim);

        if (this.scene.player) {
            this.scene.player.takeDamage(this.damage);
            console.log(`🐀 Rat attaque le joueur : -${this.damage} HP`);

            // Effet visuel d'attaque
            this.scene.tweens.add({
                targets: this.scene.player,
                alpha: 0.5,
                duration: 100,
                yoyo: true,
                repeat: 1
            });
        }

        this.scene.time.delayedCall(500, () => {
            this.state = 'idle';
            this.play('rat-idle-anim', true);
        });
    }

    /**
     * Démarrer un mouvement
     */
    startMoveTo(targetX, targetY) {
        this.isMoving = true;
        this.moveTarget = { x: targetX, y: targetY };

        // Déterminer la direction
        const dx = targetX - this.cartX;

        // Jouer l'animation de marche selon la direction
        if (dx > 0) {
            this.lastDirection = 'right';
            this.play('rat-walk-right-anim', true);
        } else if (dx < 0) {
            this.lastDirection = 'left';
            this.play('rat-walk-left-anim', true);
        }

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

                // Revenir à l'animation idle
                this.play('rat-idle-anim', true);
            }
        });
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
     * Prendre des dégâts
     */
    takeDamage(amount) {
        if (this.state === 'dead') return;

        this.hp -= amount;
        console.log(`💥 Rat prend ${amount} dégâts (${this.hp}/${this.maxHp})`);

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
        console.log('💀 Rat Géant mort');

        // Animation de mort
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 0.05,
            scaleY: 0.05,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });

        // Détruire toutes les barres
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.loyaltyBar) this.loyaltyBar.destroy();
        if (this.loyaltyBarBg) this.loyaltyBarBg.destroy();
    }

    /**
     * Détruire le rat
     */
    destroy() {
        // Retirer de la liste des rats
        if (this.scene.giantRats) {
            const index = this.scene.giantRats.indexOf(this);
            if (index > -1) {
                this.scene.giantRats.splice(index, 1);
            }
        }

        // Détruire toutes les barres
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.loyaltyBar) this.loyaltyBar.destroy();
        if (this.loyaltyBarBg) this.loyaltyBarBg.destroy();

        super.destroy();
    }
}
