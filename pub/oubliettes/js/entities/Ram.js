/**
 * Ram (Bélier) - Gardien des cavernes
 * Plus puissant et difficile à convertir, mais très utile une fois allié
 */
class Ram extends Creature {
    constructor(scene, x, y) {
        super(scene, x, y, 'ram', {
            name: 'Bélier',
            type: 'ram',
            maxHp: 80,
            damage: 8,
            speed: 70,
            loyalty: -60, // Plutôt hostile
            wanderRadius: 120
        });

        // Les rams sont plus gros
        this.setScale(0.025);
        this.body.setSize(28, 28);
        this.body.setOffset(2, 2);

        // Description
        this.description = "Un bélier massif gardant la caverne. Ses cornes brillent d'une lueur étrange.";

        // Le ram fait des attaques de charge
        this.chargeReady = true;
    }

    /**
     * Les rams sont plus difficiles à convertir
     */
    gainLoyalty(amount) {
        // Malus de 30% pour les rams
        return super.gainLoyalty(amount * 0.7);
    }

    /**
     * Attaque spéciale: charge
     */
    attack(target) {
        if (this.chargeReady) {
            this.performCharge(target);
            this.chargeReady = false;

            // Recharge après 5 secondes
            this.scene.time.delayedCall(5000, () => {
                this.chargeReady = true;
            });
        } else {
            super.attack(target);
        }
    }

    performCharge(target) {
        console.log(`${this.name} charge!`);

        // Animation de charge
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);

        // Effet visuel
        this.setTint(0xff0000);
        this.scene.time.delayedCall(300, () => {
            this.updateAllegianceVisual();
        });

        // Se précipiter vers la cible
        this.scene.tweens.add({
            targets: this,
            x: target.x + Math.cos(angle) * 20,
            y: target.y + Math.sin(angle) * 20,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Infliger plus de dégâts avec la charge
                if (target.takeDamage) {
                    target.takeDamage(this.damage * 2, this);
                }
                this.showFloatingText('CHARGE!', '#ff4444', 18);
            }
        });
    }

    /**
     * Une fois converti, le ram peut invoquer des rats alliés
     */
    convert() {
        super.convert();
        console.log("Le bélier baisse la tête en signe de respect.");
        this.showFloatingText('Je vous suis!', '#ffd700', 16);

        // Capacité spéciale: peut invoquer des rats
        this.canSummonRats = true;
        this.summonCooldown = 0;
    }

    /**
     * Les rams convertis peuvent invoquer des rats pour aider
     */
    updateAI(time, delta) {
        super.updateAI(time, delta);

        // Si converti et en combat, invoquer des rats
        if (this.isConverted && this.canSummonRats) {
            this.summonCooldown -= delta;

            if (this.summonCooldown <= 0 && this.aiState === 'follow') {
                // Chercher des ennemis proches
                const nearbyEnemies = this.scene.getEnemiesNearPoint(this.x, this.y, 200);

                if (nearbyEnemies.length > 0) {
                    this.summonRat();
                    this.summonCooldown = 10000; // 10 secondes de cooldown
                }
            }
        }
    }

    summonRat() {
        console.log(`${this.name} invoque un rat allié!`);

        // Créer un rat déjà converti
        const rat = new Rat(this.scene, this.x + 30, this.y);
        rat.isConverted = true;
        rat.loyalty = 100;
        rat.aiState = 'follow';
        rat.target = this.scene.player;
        rat.updateAllegianceVisual();

        this.scene.alliesGroup.add(rat);

        // Effet visuel
        this.showFloatingText('Invocation!', '#8844ff', 16);
    }
}
