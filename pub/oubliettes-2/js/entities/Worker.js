/**
 * Entité Worker - Creuse les murs et construit
 */
class Worker extends Phaser.GameObjects.Sprite {
    constructor(scene, cartX, cartY, worldOffset) {
        // Position isométrique
        const isoPos = IsoUtils.cartToIso(cartX, cartY);
        const screenX = isoPos.x + worldOffset.x;
        const screenY = isoPos.y + worldOffset.y;

        // Créer le sprite avec le même sprite que le héros
        super(scene, screenX, screenY, 'hero-idle');

        this.scene = scene;
        this.scene.add.existing(this);

        // Position dans la grille
        this.cartX = cartX;
        this.cartY = cartY;
        this.worldOffset = worldOffset;

        // État
        this.currentTask = null;
        this.state = 'idle'; // idle, following, attacking
        this.speed = 2; // vitesse de déplacement (tiles/sec)

        // Combat
        this.damage = 15;
        this.attackCooldown = 0;
        this.attackDelay = 1000; // 1 seconde entre chaque attaque
        this.isMoving = false;

        // Apparence - même que le héros mais en orange
        this.setScale(0.25);
        this.setOrigin(0.5, 1); // Origine aux pieds
        this.setTint(0xff9800); // Orange pour différencier des ennemis
        this.setDepth(IsoUtils.getDepth(cartX, cartY) + 0.3);

        // Créer l'animation idle si elle n'existe pas déjà
        if (!scene.anims.exists('hero-idle-anim')) {
            scene.anims.create({
                key: 'hero-idle-anim',
                frames: scene.anims.generateFrameNumbers('hero-idle', { start: 0, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Jouer l'animation
        this.play('hero-idle-anim');

        console.log(`Worker créé à (${cartX}, ${cartY})`);
    }

    update(delta) {
        // Mettre à jour le cooldown d'attaque
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        switch (this.state) {
            case 'idle':
            case 'following':
                if (!this.isMoving) {
                    this.followAndDefendPlayer();
                }
                break;
            case 'attacking':
                // L'attaque est gérée séparément
                break;
        }
    }

    /**
     * Suivre et défendre le joueur
     */
    followAndDefendPlayer() {
        if (!this.scene.player) return;

        const playerX = this.scene.player.cartX;
        const playerY = this.scene.player.cartY;

        // Chercher un ennemi proche (dans un rayon de 5 tiles)
        let closestEnemy = null;
        let closestDistance = Infinity;

        if (this.scene.enemies) {
            this.scene.enemies.forEach(enemy => {
                const dx = enemy.cartX - this.cartX;
                const dy = enemy.cartY - this.cartY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance && distance <= 5) {
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
                this.state = 'following';
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
            this.state = 'following';
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
     * Démarrer un mouvement vers une nouvelle position
     */
    startMoveTo(targetX, targetY) {
        this.isMoving = true;

        const targetIso = IsoUtils.cartToIso(targetX, targetY);

        this.scene.tweens.add({
            targets: this,
            x: targetIso.x + this.worldOffset.x,
            y: targetIso.y + this.worldOffset.y,
            duration: 1000 / this.speed,
            ease: 'Linear',
            onUpdate: () => {
                this.setDepth(IsoUtils.getDepth(this.cartX, this.cartY) + 0.3);
            },
            onComplete: () => {
                this.cartX = targetX;
                this.cartY = targetY;
                this.isMoving = false;
            }
        });
    }

    /**
     * Attaquer un ennemi
     */
    attackEnemy(enemy) {
        if (this.attackCooldown > 0) return;

        this.state = 'attacking';
        this.attackCooldown = this.attackDelay;

        // Infliger des dégâts
        if (enemy) {
            enemy.takeDamage(this.damage);
            console.log(`⚔️ Worker attaque l'ennemi : -${this.damage} HP`);

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
}
