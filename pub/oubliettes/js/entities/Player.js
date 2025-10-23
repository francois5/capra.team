class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'hero-idle', 0); // Commencer avec la première frame de l'idle

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configuration physique - Vue top-down
        this.setCollideWorldBounds(true);
        // Hitbox plus petite et centrée pour vue de dessus
        this.body.setSize(24, 24); // Hitbox carrée pour top-down
        this.body.setOffset(4, 8); // Centré sur le sprite

        // Debug: afficher la hitbox
        this.body.debugShowBody = true;
        this.body.debugBodyColor = 0x00ff00;

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

        // Système d'invocation
        this.isInvoking = false;
        this.invocationTarget = null;
        this.invocationRate = 5; // Points de loyauté par seconde

        // Interface utilisateur
        this.ui = scene.ui;

        this.setupAnimations();
        this.updateUI();
    }

    setupAnimations() {
        // Animation idle vers le bas (vue top-down)
        this.scene.anims.create({
            key: 'hero-idle-down',
            frames: this.scene.anims.generateFrameNumbers('hero-idle', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        // Animation marche vers le bas
        this.scene.anims.create({
            key: 'hero-walk-down',
            frames: this.scene.anims.generateFrameNumbers('hero-walk-right', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        // Animation marche vers le haut
        this.scene.anims.create({
            key: 'hero-walk-up',
            frames: this.scene.anims.generateFrameNumbers('hero-walk-right', { start: 8, end: 15 }),
            frameRate: 10,
            repeat: -1
        });

        // Animation marche vers la gauche
        this.scene.anims.create({
            key: 'hero-walk-left',
            frames: this.scene.anims.generateFrameNumbers('hero-walk-left', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        // Animation marche vers la droite
        this.scene.anims.create({
            key: 'hero-walk-right',
            frames: this.scene.anims.generateFrameNumbers('hero-walk-right', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        // Commencer avec l'animation idle
        this.play('hero-idle-down');
    }

    update() {
        if (!this.canMove) return;

        this.handleMovement();
        this.handleActions();
    }

    handleMovement() {
        // Mouvement top-down en 8 directions
        let velocityX = 0;
        let velocityY = 0;

        // Vérifier les contrôles tactiles mobiles en premier
        const mobileControls = window.MobileControls;
        if (mobileControls && mobileControls.joystick.active) {
            // Utiliser le joystick virtuel
            velocityX = mobileControls.joystick.x * this.speed;
            velocityY = mobileControls.joystick.y * this.speed;
        } else {
            // Vérifier les entrées de mouvement clavier
            if (this.keys.A.isDown || this.cursors.left.isDown) {
                velocityX = -this.speed;
            } else if (this.keys.D.isDown || this.cursors.right.isDown) {
                velocityX = this.speed;
            }

            if (this.keys.W.isDown || this.cursors.up.isDown) {
                velocityY = -this.speed;
            } else if (this.keys.S.isDown || this.cursors.down.isDown) {
                velocityY = this.speed;
            }

            // Normaliser la vitesse diagonale pour éviter d'aller plus vite en diagonale
            if (velocityX !== 0 && velocityY !== 0) {
                velocityX *= 0.707; // Math.sqrt(2) / 2
                velocityY *= 0.707;
            }
        }

        // Appliquer la vélocité
        this.setVelocity(velocityX, velocityY);

        // Gérer les animations selon le mouvement et la direction
        const wasMoving = this.isMoving;
        this.isMoving = velocityX !== 0 || velocityY !== 0;

        if (this.isMoving) {
            // Déterminer la direction principale pour l'animation
            if (Math.abs(velocityY) > Math.abs(velocityX)) {
                // Mouvement vertical dominant
                if (velocityY < 0) {
                    this.facing = 'up';
                    if (this.anims.currentAnim?.key !== 'hero-walk-up') {
                        this.play('hero-walk-up');
                    }
                } else {
                    this.facing = 'down';
                    if (this.anims.currentAnim?.key !== 'hero-walk-down') {
                        this.play('hero-walk-down');
                    }
                }
            } else {
                // Mouvement horizontal dominant
                if (velocityX < 0) {
                    this.facing = 'left';
                    if (this.anims.currentAnim?.key !== 'hero-walk-left') {
                        this.play('hero-walk-left');
                    }
                } else {
                    this.facing = 'right';
                    if (this.anims.currentAnim?.key !== 'hero-walk-right') {
                        this.play('hero-walk-right');
                    }
                }
            }
        } else if (!this.isMoving && wasMoving) {
            // Retourner à l'animation idle quand on s'arrête
            this.play('hero-idle-down');
        }
    }

    handleActions() {
        const mobileControls = window.MobileControls;

        // Attaque - Clavier ou bouton tactile
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
            (mobileControls && this.checkButtonJustPressed('attack'))) {
            this.attack();
        }

        // Invocation (maintenir E) - Clavier ou bouton tactile
        const invokePressed = this.keys.E.isDown ||
            (mobileControls && mobileControls.buttons.invoke);

        if (invokePressed) {
            this.tryInvoke();
        } else {
            this.stopInvoking();
        }

        // Interaction - Bouton tactile uniquement (F est géré dans GameScene)
        if (mobileControls && this.checkButtonJustPressed('interact')) {
            this.scene.tryInteraction();
        }
    }

    checkButtonJustPressed(buttonName) {
        // Tracker pour détecter "just pressed" sur les boutons tactiles
        if (!this.mobileButtonStates) {
            this.mobileButtonStates = {
                attack: false,
                invoke: false,
                interact: false
            };
        }

        const mobileControls = window.MobileControls;
        if (!mobileControls) return false;

        const currentState = mobileControls.buttons[buttonName];
        const previousState = this.mobileButtonStates[buttonName];
        this.mobileButtonStates[buttonName] = currentState;

        // Retourne true si le bouton vient d'être pressé (transition false -> true)
        return currentState && !previousState;
    }

    tryInvoke() {
        // Trouver une créature/escalier à invoquer
        const interactionPoint = this.getInteractionPoint();
        const target = this.scene.findInvokableTarget(interactionPoint.x, interactionPoint.y, 50);

        if (target) {
            if (!this.isInvoking || this.invocationTarget !== target) {
                this.startInvoking(target);
            }
            this.continueInvoking();
        } else {
            this.stopInvoking();
        }
    }

    startInvoking(target) {
        this.isInvoking = true;
        this.invocationTarget = target;
        console.log(`Début de l'invocation de ${target.name}...`);

        // Effet visuel
        this.createInvocationEffect();
    }

    continueInvoking() {
        if (!this.invocationTarget || !this.invocationTarget.active) {
            this.stopInvoking();
            return;
        }

        // Augmenter la loyauté à chaque frame
        const delta = this.scene.game.loop.delta;
        const loyaltyGain = (this.invocationRate * delta) / 1000;

        if (this.invocationTarget.gainLoyalty) {
            this.invocationTarget.gainLoyalty(loyaltyGain);
        }

        // Maintenir l'effet visuel
        this.updateInvocationEffect();
    }

    stopInvoking() {
        if (this.isInvoking) {
            this.isInvoking = false;
            this.invocationTarget = null;
            this.destroyInvocationEffect();
        }
    }

    createInvocationEffect() {
        // Particules entre le joueur et la cible
        this.invocationLine = this.scene.add.graphics();
        this.invocationParticles = this.scene.add.particles(this.x, this.y, 'particle', {
            speed: 50,
            scale: { start: 0.5, end: 0 },
            tint: 0x8844ff,
            lifespan: 600,
            frequency: 50,
            blendMode: 'ADD'
        });
    }

    updateInvocationEffect() {
        if (!this.invocationTarget) return;

        // Ligne entre joueur et cible
        if (this.invocationLine) {
            this.invocationLine.clear();
            this.invocationLine.lineStyle(2, 0x8844ff, 0.6);
            this.invocationLine.beginPath();
            this.invocationLine.moveTo(this.x, this.y);
            this.invocationLine.lineTo(this.invocationTarget.x, this.invocationTarget.y);
            this.invocationLine.strokePath();
        }

        // Mettre à jour la position des particules
        if (this.invocationParticles) {
            this.invocationParticles.setPosition(
                (this.x + this.invocationTarget.x) / 2,
                (this.y + this.invocationTarget.y) / 2
            );
        }
    }

    destroyInvocationEffect() {
        if (this.invocationLine) {
            this.invocationLine.destroy();
            this.invocationLine = null;
        }
        if (this.invocationParticles) {
            this.invocationParticles.destroy();
            this.invocationParticles = null;
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