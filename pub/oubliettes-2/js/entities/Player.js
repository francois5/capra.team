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

        // Système de tâches
        this.currentTask = null;
        this.state = 'idle'; // idle, moving_to_task, digging

        // Stats du héros
        this.maxHp = 100;
        this.hp = 100;
        this.maxMana = 50;
        this.mana = 50;
        this.manaRegenRate = 5; // Régénération de 5 mana par seconde
        this.hpRegenRate = 1; // Régénération de 1 HP par seconde (lente)

        // Système de contrôle des monstres
        this.controlledMonsters = 0; // Nombre actuel de monstres contrôlés
        this.maxControlledMonsters = 1; // Limite de départ (augmente en convertissant des béliers)

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

        // Créer les barres au-dessus du héros (mana en haut, vie en bas)
        this.createManaBar();
        this.createHealthBar();

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

    /**
     * Créer la barre de mana en haut (comme la loyauté chez les monstres)
     */
    createManaBar() {
        const barWidth = 40;
        const barHeight = 5;

        // Fond de la barre
        this.manaBarBg = this.scene.add.rectangle(
            this.x,
            this.y - 50,
            barWidth,
            barHeight,
            0x333333
        );
        this.manaBarBg.setOrigin(0.5, 0.5);

        // Barre de mana (bleue)
        this.manaBar = this.scene.add.rectangle(
            this.x - barWidth / 2 + 1,
            this.y - 50,
            barWidth - 2,
            barHeight - 2,
            0x00aaff
        );
        this.manaBar.setOrigin(0, 0.5);

        this.maxManaBarWidth = barWidth - 2;
    }

    /**
     * Créer la barre de vie en bas
     */
    createHealthBar() {
        const barWidth = 40;
        const barHeight = 5;

        // Fond de la barre
        this.healthBarBg = this.scene.add.rectangle(
            this.x,
            this.y - 44,
            barWidth,
            barHeight,
            0x333333
        );
        this.healthBarBg.setOrigin(0.5, 0.5);

        // Barre de vie (rouge)
        this.healthBar = this.scene.add.rectangle(
            this.x - barWidth / 2 + 1,
            this.y - 44,
            barWidth - 2,
            barHeight - 2,
            0xff0000
        );
        this.healthBar.setOrigin(0, 0.5);

        this.maxHealthBarWidth = barWidth - 2;
    }

    /**
     * Mettre à jour les barres de vie et mana
     */
    updatePlayerBars() {
        // Barre de mana (en haut)
        if (this.manaBar && this.manaBarBg) {
            const manaPercent = Math.max(0, this.mana / this.maxMana);
            this.manaBar.width = this.maxManaBarWidth * manaPercent;

            // Position de la barre (suit le héros)
            const screenY = this.y - 50;
            this.manaBarBg.setPosition(this.x, screenY);
            this.manaBar.setPosition(this.x - this.maxManaBarWidth / 2, screenY);

            // Depth
            this.manaBarBg.setDepth(this.depth + 0.01);
            this.manaBar.setDepth(this.depth + 0.02);
        }

        // Barre de vie (en bas)
        if (this.healthBar && this.healthBarBg) {
            const healthPercent = Math.max(0, this.hp / this.maxHp);
            this.healthBar.width = this.maxHealthBarWidth * healthPercent;

            // Position de la barre (suit le héros)
            const screenY = this.y - 44;
            this.healthBarBg.setPosition(this.x, screenY);
            this.healthBar.setPosition(this.x - this.maxHealthBarWidth / 2, screenY);

            // Depth
            this.healthBarBg.setDepth(this.depth + 0.01);
            this.healthBar.setDepth(this.depth + 0.02);
        }
    }

    update(time, delta) {
        // Régénération de la mana et de la vie
        this.regenerateMana(delta);
        this.regenerateHealth(delta);

        // Gérer les états du player
        switch (this.state) {
            case 'idle':
                // Contrôle manuel ou chercher une tâche
                if (this.isMoving) {
                    this.updateMovement();
                } else {
                    this.handleInput();
                    // Si pas de mouvement manuel, chercher une tâche
                    if (!this.isMoving) {
                        this.lookForTask();
                    }
                }
                break;
            case 'moving_to_task':
                // Se déplacer vers la tâche
                if (this.isMoving) {
                    this.updateMovement();
                } else {
                    this.moveToTask();
                }
                break;
            case 'digging':
                // En train de creuser, rien à faire (timer en cours)
                break;
        }

        // Mettre à jour l'affichage debug
        this.updateDebugInfo();

        // Mettre à jour les barres de vie/mana
        this.updatePlayerBars();
    }

    /**
     * Régénérer la mana
     * @param {number} delta - Temps écoulé en ms
     */
    regenerateMana(delta) {
        if (this.mana < this.maxMana) {
            // Régénérer la mana proportionnellement au temps écoulé
            const manaRegen = (this.manaRegenRate * delta) / 1000;
            this.mana = Math.min(this.mana + manaRegen, this.maxMana);
        }
    }

    /**
     * Régénérer la vie lentement
     * @param {number} delta - Temps écoulé en ms
     */
    regenerateHealth(delta) {
        if (this.hp < this.maxHp) {
            // Régénérer la vie proportionnellement au temps écoulé
            const hpRegen = (this.hpRegenRate * delta) / 1000;
            this.hp = Math.min(this.hp + hpRegen, this.maxHp);
        }
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
            posElement.textContent = `(${this.cartX}, ${this.cartY}) - ${this.state}`;
        }
    }

    /**
     * Chercher une tâche non assignée
     */
    lookForTask() {
        if (!this.scene.taskManager) return;

        const task = this.scene.taskManager.getUnassignedTask();
        if (task) {
            this.currentTask = task;
            this.scene.taskManager.assignTask(task, this);
            this.state = 'moving_to_task';
            console.log(`Héros va creuser en (${task.x}, ${task.y})`);
        }
    }

    /**
     * Se déplacer vers la tâche
     */
    moveToTask() {
        if (!this.currentTask) {
            this.state = 'idle';
            return;
        }

        const targetX = this.currentTask.x;
        const targetY = this.currentTask.y;

        // Calculer la distance
        const dx = targetX - this.cartX;
        const dy = targetY - this.cartY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Si on est adjacent, commencer à creuser
        if (distance <= 1.5) {
            this.startDigging();
            return;
        }

        // Déterminer la prochaine case à atteindre
        let nextX = this.cartX;
        let nextY = this.cartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Bouger en X
            nextX = this.cartX + (dx > 0 ? 1 : -1);
        } else {
            // Bouger en Y
            nextY = this.cartY + (dy > 0 ? 1 : -1);
        }

        // Vérifier si c'est passable
        if (this.scene.world.isPassable(nextX, nextY)) {
            this.startMoveTo(nextX, nextY);
        } else {
            // Bloqué, essayer l'autre axe
            if (Math.abs(dx) > Math.abs(dy)) {
                nextX = this.cartX;
                nextY = this.cartY + (dy > 0 ? 1 : -1);
            } else {
                nextX = this.cartX + (dx > 0 ? 1 : -1);
                nextY = this.cartY;
            }

            if (this.scene.world.isPassable(nextX, nextY)) {
                this.startMoveTo(nextX, nextY);
            } else {
                // Impossible de se déplacer, supprimer définitivement la tâche
                console.log(`⚠️ Impossible d'atteindre le mur en (${this.currentTask.x}, ${this.currentTask.y}) - tâche supprimée`);
                this.scene.taskManager.removeTask(this.currentTask);
                this.currentTask = null;
                this.state = 'idle';
            }
        }
    }

    /**
     * Commencer à creuser
     */
    startDigging() {
        this.state = 'digging';
        console.log(`Héros commence à creuser en (${this.currentTask.x}, ${this.currentTask.y})`);

        // Simuler le temps de creusage (2 secondes)
        this.scene.time.delayedCall(2000, () => {
            this.finishDigging();
        });
    }

    /**
     * Finir de creuser
     */
    finishDigging() {
        if (!this.currentTask) return;

        // Creuser le mur
        this.scene.digWall(this.currentTask.x, this.currentTask.y);

        // Compléter la tâche
        this.scene.taskManager.completeTask(this.currentTask);
        this.currentTask = null;
        this.state = 'idle';

        console.log('Héros a fini de creuser');
    }

    /**
     * Prendre des dégâts
     * @param {number} amount - Montant des dégâts
     */
    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        console.log(`❤️ Héros prend ${amount} dégâts (${this.hp}/${this.maxHp})`);

        // Flash rouge
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        // Si mort
        if (this.hp <= 0) {
            console.log('💀 Héros mort!');
            // TODO: Game over
        }
    }
}
