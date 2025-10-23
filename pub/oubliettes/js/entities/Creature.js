/**
 * Classe de base pour toutes les créatures du jeu (alliées ou ennemies)
 * Gère la loyauté, le comportement IA, et la conversion
 */
class Creature extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, spriteKey, config = {}) {
        super(scene, x, y, spriteKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configuration de base
        this.name = config.name || 'Créature';
        this.creatureType = config.type || 'neutral';

        // Stats de combat
        this.maxHp = config.maxHp || 50;
        this.hp = this.maxHp;
        this.damage = config.damage || 5;
        this.speed = config.speed || 80;

        // Système de loyauté (-100 = ennemi, 0 = neutre, 100 = allié)
        this.maxLoyalty = 100;
        this.loyalty = config.loyalty || -50; // Par défaut légèrement hostile
        this.isConverted = false;
        this.conversionThreshold = 50; // Loyauté nécessaire pour être converti

        // État de l'IA
        this.aiState = 'idle'; // idle, wander, chase, flee, follow
        this.target = null;
        this.homePosition = { x, y };
        this.wanderRadius = config.wanderRadius || 100;

        // Timers pour l'IA
        this.aiTimer = 0;
        this.aiInterval = 2000; // Réévaluer l'IA toutes les 2 secondes
        this.attackCooldown = 0;
        this.attackInterval = 2000; // Attaquer toutes les 2 secondes

        // Barres de vie et loyauté
        this.createHealthBar();
        this.createLoyaltyBar();

        // Hitbox
        this.body.setSize(24, 24);
        this.body.setOffset(4, 4);

        // Effet visuel selon l'allégeance
        this.updateAllegianceVisual();
    }

    createHealthBar() {
        // Conteneur pour la barre de vie
        this.healthBarBg = this.scene.add.graphics();
        this.healthBarFill = this.scene.add.graphics();
        this.healthBarWidth = 32;
        this.healthBarHeight = 4;
    }

    createLoyaltyBar() {
        // Conteneur pour la barre de loyauté
        this.loyaltyBarBg = this.scene.add.graphics();
        this.loyaltyBarFill = this.scene.add.graphics();
        this.loyaltyBarWidth = 32;
        this.loyaltyBarHeight = 3;
    }

    updateHealthBar() {
        this.healthBarBg.clear();
        this.healthBarFill.clear();

        const barX = this.x - this.healthBarWidth / 2;
        const barY = this.y - 25;

        // Fond noir
        this.healthBarBg.fillStyle(0x000000);
        this.healthBarBg.fillRect(barX, barY, this.healthBarWidth, this.healthBarHeight);

        // Barre de vie (verte/jaune/rouge selon HP)
        const hpPercent = this.hp / this.maxHp;
        let color = 0x00ff00; // Vert
        if (hpPercent < 0.3) color = 0xff0000; // Rouge
        else if (hpPercent < 0.6) color = 0xffaa00; // Orange

        this.healthBarFill.fillStyle(color);
        this.healthBarFill.fillRect(barX + 1, barY + 1,
            (this.healthBarWidth - 2) * hpPercent, this.healthBarHeight - 2);
    }

    updateLoyaltyBar() {
        this.loyaltyBarBg.clear();
        this.loyaltyBarFill.clear();

        const barX = this.x - this.loyaltyBarWidth / 2;
        const barY = this.y - 20;

        // Fond noir
        this.loyaltyBarBg.fillStyle(0x000000);
        this.loyaltyBarBg.fillRect(barX, barY, this.loyaltyBarWidth, this.loyaltyBarHeight);

        // Barre de loyauté (couleur selon allégeance)
        const loyaltyPercent = (this.loyalty + 100) / 200; // Normaliser de -100/100 à 0/1
        let color;
        if (this.isConverted) {
            color = 0xffd700; // Or pour les alliés
        } else if (this.loyalty > 0) {
            color = 0xff8800; // Orange pour en cours de conversion
        } else {
            color = 0x8800ff; // Violet sombre pour les ennemis
        }

        this.loyaltyBarFill.fillStyle(color);
        this.loyaltyBarFill.fillRect(barX + 1, barY + 1,
            (this.loyaltyBarWidth - 2) * loyaltyPercent, this.loyaltyBarHeight - 2);
    }

    /**
     * Augmenter la loyauté de la créature (invocation)
     */
    gainLoyalty(amount) {
        const oldLoyalty = this.loyalty;
        this.loyalty = Math.min(this.maxLoyalty, this.loyalty + amount);

        // Effet visuel
        this.showFloatingText(`+${amount} loyauté`, '#ffd700');

        // Vérifier la conversion
        if (!this.isConverted && this.loyalty >= this.conversionThreshold) {
            this.convert();
        }

        this.updateLoyaltyBar();
        return this.loyalty - oldLoyalty;
    }

    /**
     * Convertir la créature en allié
     */
    convert() {
        this.isConverted = true;
        this.aiState = 'follow';
        this.target = this.scene.player;

        // Effet visuel de conversion
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
            repeat: 2
        });

        // Particules dorées
        this.createConversionEffect();

        // Notifier le joueur
        this.showFloatingText('CONVERTI!', '#ffd700', 24);

        // Mettre à jour l'apparence
        this.updateAllegianceVisual();

        // Notifier la scène
        if (this.scene.onCreatureConverted) {
            this.scene.onCreatureConverted(this);
        }
    }

    createConversionEffect() {
        const particles = this.scene.add.particles(this.x, this.y, 'particle', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.8, end: 0 },
            tint: 0xffd700,
            lifespan: 600,
            quantity: 20,
            blendMode: 'ADD'
        });

        this.scene.time.delayedCall(600, () => {
            particles.destroy();
        });
    }

    updateAllegianceVisual() {
        if (this.isConverted) {
            // Teinte dorée pour les alliés
            this.setTint(0xffffaa);
        } else if (this.loyalty > 0) {
            // Teinte orange pour en cours de conversion
            this.setTint(0xffddaa);
        } else {
            // Pas de teinte pour les ennemis
            this.clearTint();
        }
    }

    takeDamage(amount, attacker) {
        this.hp = Math.max(0, this.hp - amount);
        this.updateHealthBar();

        // Effet visuel de dégâts
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        this.showFloatingText(`-${amount}`, '#ff0000');

        // Réduire la loyauté si attaqué
        if (attacker) {
            this.gainLoyalty(-10);
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.updateHealthBar();
        this.showFloatingText(`+${amount}`, '#00ff00');
    }

    die() {
        console.log(`${this.name} est mort!`);

        // Effet visuel de mort
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 300,
            onComplete: () => {
                this.destroy();
            }
        });
    }

    /**
     * Mise à jour de l'IA
     */
    updateAI(time, delta) {
        if (this.hp <= 0) return;

        // Mettre à jour les timers
        this.aiTimer += delta;
        this.attackCooldown -= delta;

        // Réévaluer l'état de l'IA périodiquement
        if (this.aiTimer >= this.aiInterval) {
            this.evaluateAI();
            this.aiTimer = 0;
        }

        // Exécuter le comportement selon l'état
        switch (this.aiState) {
            case 'idle':
                this.behaviorIdle();
                break;
            case 'wander':
                this.behaviorWander();
                break;
            case 'chase':
                this.behaviorChase();
                break;
            case 'flee':
                this.behaviorFlee();
                break;
            case 'follow':
                this.behaviorFollow();
                break;
        }
    }

    evaluateAI() {
        if (this.isConverted) {
            // Les alliés suivent le joueur
            this.aiState = 'follow';
            this.target = this.scene.player;
        } else {
            // Les ennemis attaquent le joueur s'il est proche
            const distanceToPlayer = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.scene.player.x, this.scene.player.y
            );

            if (distanceToPlayer < 150) {
                this.aiState = 'chase';
                this.target = this.scene.player;
            } else if (distanceToPlayer > 200) {
                // Retourner errer
                this.aiState = 'wander';
                this.target = null;
            }
        }
    }

    behaviorIdle() {
        this.setVelocity(0, 0);
    }

    behaviorWander() {
        // Se déplacer aléatoirement autour de la position d'origine
        if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
            const angle = Math.random() * Math.PI * 2;
            const vx = Math.cos(angle) * this.speed * 0.5;
            const vy = Math.sin(angle) * this.speed * 0.5;
            this.setVelocity(vx, vy);

            // Arrêter après un court instant
            this.scene.time.delayedCall(1000, () => {
                if (this.aiState === 'wander') {
                    this.setVelocity(0, 0);
                }
            });
        }
    }

    behaviorChase() {
        if (!this.target || !this.target.active) {
            this.aiState = 'wander';
            return;
        }

        // Poursuivre la cible
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        if (distance < 30) {
            // Attaquer si assez proche
            this.attemptAttack(this.target);
        } else {
            // Se déplacer vers la cible
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.setVelocity(
                Math.cos(angle) * this.speed,
                Math.sin(angle) * this.speed
            );
        }
    }

    behaviorFlee() {
        if (!this.target || !this.target.active) {
            this.aiState = 'wander';
            return;
        }

        // Fuir la cible
        const angle = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.x, this.y);
        this.setVelocity(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
        );
    }

    behaviorFollow() {
        if (!this.target || !this.target.active) {
            this.aiState = 'wander';
            return;
        }

        // Suivre la cible à distance
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        if (distance > 60) {
            // Se rapprocher
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.setVelocity(
                Math.cos(angle) * this.speed,
                Math.sin(angle) * this.speed
            );
        } else {
            // Assez proche, arrêter
            this.setVelocity(0, 0);
        }
    }

    attemptAttack(target) {
        if (this.attackCooldown <= 0) {
            this.attack(target);
            this.attackCooldown = this.attackInterval;
        }
    }

    attack(target) {
        console.log(`${this.name} attaque ${target.name || 'la cible'}!`);

        // Effet visuel d'attaque
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true
        });

        // Infliger des dégâts
        if (target.takeDamage) {
            target.takeDamage(this.damage, this);
        }
    }

    showFloatingText(text, color = '#ffffff', size = 14) {
        const floatingText = this.scene.add.text(this.x, this.y - 30, text, {
            fontSize: `${size}px`,
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: floatingText,
            y: floatingText.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }

    update(time, delta) {
        // Mettre à jour l'IA
        this.updateAI(time, delta);

        // Mettre à jour les barres
        this.updateHealthBar();
        this.updateLoyaltyBar();
    }

    destroy() {
        // Nettoyer les graphiques
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        if (this.loyaltyBarBg) this.loyaltyBarBg.destroy();
        if (this.loyaltyBarFill) this.loyaltyBarFill.destroy();

        super.destroy();
    }
}
