class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'hero-idle', 0); // Commencer avec la première frame de l'idle

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configuration physique - ajustée pour les sprites haute résolution de Ludo.ai
        this.setCollideWorldBounds(true);
        // Les sprites font ~1700px de haut, avec échelle 0.02 = ~34px
        this.body.setSize(12, 20); // Hitbox de taille raisonnable
        this.body.setOffset(6, 14); // Centré sur le personnage

        // Stats du joueur
        this.maxHp = 100;
        this.hp = 100;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 100;
        this.speed = 160;

        // État du joueur
        this.facing = 'down';
        this.isMoving = false;
        this.canMove = true;

        // Inventaire
        this.inventory = [
            { type: 'weapon', name: 'Épée de fer', quantity: 1 },
            { type: 'consumable', name: 'Potion', quantity: 3 }
        ];

        // Contrôles
        this.keys = scene.input.keyboard.addKeys('W,S,A,D,SPACE,E');
        this.cursors = scene.input.keyboard.createCursorKeys();

        // Interface utilisateur
        this.ui = scene.ui;

        this.setupAnimations();
        this.updateUI();
    }

    setupAnimations() {
        // Animation idle (repos) - 16 frames
        this.scene.anims.create({
            key: 'hero-idle',
            frames: this.scene.anims.generateFrameNumbers('hero-idle', { start: 0, end: 15 }),
            frameRate: 8, // 8 frames par seconde pour une animation fluide
            repeat: -1    // Répéter à l'infini
        });

        // Animation marche vers la gauche - 16 frames
        this.scene.anims.create({
            key: 'hero-walk-left',
            frames: this.scene.anims.generateFrameNumbers('hero-walk-left', { start: 0, end: 15 }),
            frameRate: 12, // Un peu plus rapide pour la marche
            repeat: -1
        });

        // Animation marche vers la droite - 16 frames
        this.scene.anims.create({
            key: 'hero-walk-right',
            frames: this.scene.anims.generateFrameNumbers('hero-walk-right', { start: 0, end: 15 }),
            frameRate: 12, // Même vitesse que la marche gauche
            repeat: -1
        });

        // Commencer avec l'animation idle
        this.play('hero-idle');
    }

    update() {
        if (!this.canMove) return;

        this.handleMovement();
        this.handleActions();
    }

    handleMovement() {
        const speed = this.speed;
        let velocityX = 0;
        let velocityY = 0;

        // Vérifier les entrées de mouvement
        if (this.keys.A.isDown || this.cursors.left.isDown) {
            velocityX = -speed;
            this.facing = 'left';
        } else if (this.keys.D.isDown || this.cursors.right.isDown) {
            velocityX = speed;
            this.facing = 'right';
        }

        if (this.keys.W.isDown || this.cursors.up.isDown) {
            velocityY = -speed;
            this.facing = 'up';
        } else if (this.keys.S.isDown || this.cursors.down.isDown) {
            velocityY = speed;
            this.facing = 'down';
        }

        // Appliquer la vélocité
        this.setVelocity(velocityX, velocityY);

        // Gérer les animations selon le mouvement et la direction
        const wasMoving = this.isMoving;
        this.isMoving = velocityX !== 0 || velocityY !== 0;

        if (this.isMoving) {
            // Choisir l'animation selon la direction
            if (this.facing === 'left') {
                if (this.anims.currentAnim?.key !== 'hero-walk-left') {
                    this.play('hero-walk-left');
                }
            } else if (this.facing === 'right') {
                if (this.anims.currentAnim?.key !== 'hero-walk-right') {
                    this.play('hero-walk-right');
                }
            } else {
                // Pour up/down, on garde la dernière direction de marche ou on utilise right par défaut
                if (this.anims.currentAnim?.key !== 'hero-walk-left' && this.anims.currentAnim?.key !== 'hero-walk-right') {
                    this.play('hero-walk-right');
                }
            }
        } else if (!this.isMoving && wasMoving) {
            // Retourner à l'animation idle quand on s'arrête
            this.play('hero-idle');
        }
    }

    handleActions() {
        // Attaque
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.attack();
        }

        // Ouvrir l'inventaire
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.toggleInventory();
        }
    }

    attack() {
        if (!this.canMove) return;

        console.log('Attaque du joueur!');

        // Créer une zone d'attaque temporaire
        const attackRange = 40;
        let attackX = this.x;
        let attackY = this.y;

        switch (this.facing) {
            case 'up':
                attackY -= attackRange;
                break;
            case 'down':
                attackY += attackRange;
                break;
            case 'left':
                attackX -= attackRange;
                break;
            case 'right':
                attackX += attackRange;
                break;
        }

        // Vérifier s'il y a des ennemis dans la zone d'attaque
        this.scene.checkAttackHit(attackX, attackY, attackRange);

        // Animation d'attaque simple
        this.canMove = false;
        this.setTint(0xff0000);

        this.scene.time.delayedCall(200, () => {
            this.clearTint();
            this.canMove = true;
        });
    }

    toggleInventory() {
        console.log('Inventaire:', this.inventory);
        // TODO: Ouvrir/fermer l'interface d'inventaire
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.updateUI();

        // Effet visuel de dégâts - tinter en rouge temporairement
        this.setTint(0xff0000);
        this.scene.time.delayedCall(300, () => {
            this.clearTint();
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.updateUI();

        // Effet visuel de soin
        this.setTint(0x00ff00);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
    }

    gainXP(amount) {
        this.xp += amount;
        this.updateUI();

        if (this.xp >= this.xpToNext) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp = 0;
        this.xpToNext = Math.floor(this.xpToNext * 1.5);
        this.maxHp += 20;
        this.hp = this.maxHp;

        console.log(`Niveau supérieur! Nouveau niveau: ${this.level}`);
        this.updateUI();

        // Effet visuel de montée de niveau
        this.setTint(0xffeb3b);
        this.scene.time.delayedCall(500, () => {
            this.clearTint();
        });
    }

    die() {
        console.log('Le joueur est mort!');
        this.canMove = false;
        this.setTint(0x666666);
        // TODO: Écran de game over
    }

    addItem(item) {
        const existingItem = this.inventory.find(i => i.name === item.name);
        if (existingItem && item.type === 'consumable') {
            existingItem.quantity += item.quantity || 1;
        } else {
            this.inventory.push(item);
        }
        this.updateUI();
    }

    useItem(itemName) {
        const itemIndex = this.inventory.findIndex(i => i.name === itemName);
        if (itemIndex === -1) return false;

        const item = this.inventory[itemIndex];

        if (item.type === 'consumable') {
            if (item.name === 'Potion') {
                this.heal(30);
                item.quantity--;
                if (item.quantity <= 0) {
                    this.inventory.splice(itemIndex, 1);
                }
                this.updateUI();
                return true;
            }
        }

        return false;
    }

    updateUI() {
        if (this.ui) {
            this.ui.updatePlayerStats({
                hp: this.hp,
                maxHp: this.maxHp,
                level: this.level,
                xp: this.xp,
                xpToNext: this.xpToNext,
                skills: this.skills || { magic: 0, combat: 0, charisma: 0 }
            });

            this.ui.updateInventory(this.inventory);
        }
    }

    getInteractionPoint() {
        const interactionDistance = 35;
        let x = this.x;
        let y = this.y;

        switch (this.facing) {
            case 'up':
                y -= interactionDistance;
                break;
            case 'down':
                y += interactionDistance;
                break;
            case 'left':
                x -= interactionDistance;
                break;
            case 'right':
                x += interactionDistance;
                break;
        }

        return { x, y };
    }
}