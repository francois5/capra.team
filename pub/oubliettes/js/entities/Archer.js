/**
 * Archer - Gardien de l'escalier de lumière
 * Attaque à distance, difficile à convertir
 */
class Archer extends Creature {
    constructor(scene, x, y) {
        // PROTOTYPE: Utiliser temporairement le sprite de rat
        super(scene, x, y, 'rat', {
            name: 'Archer',
            type: 'archer',
            maxHp: 60,
            damage: 10,
            speed: 90,
            loyalty: -80, // Très hostile
            wanderRadius: 60
        });

        // Les archers sont de taille normale (avec sprite de rat temporaire)
        this.setScale(0.02);
        this.body.setSize(24, 24);
        this.body.setOffset(4, 4);

        // Teinte pour distinguer des vrais rats (rouge pour archer)
        this.setTint(0xff8888);

        // Description
        this.description = "Un archer gardant l'escalier. Ses flèches sont mortelles.";

        // Les archers attaquent à distance
        this.attackRange = 200;
        this.preferredDistance = 150;
    }

    /**
     * Les archers sont très difficiles à convertir
     */
    gainLoyalty(amount) {
        // Malus de 50% pour les archers
        return super.gainLoyalty(amount * 0.5);
    }

    /**
     * Comportement spécial: garder la distance
     */
    behaviorChase() {
        if (!this.target || !this.target.active) {
            this.aiState = 'wander';
            return;
        }

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        if (distance > this.attackRange) {
            // Trop loin, se rapprocher un peu
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.setVelocity(
                Math.cos(angle) * this.speed * 0.7,
                Math.sin(angle) * this.speed * 0.7
            );
        } else if (distance < this.preferredDistance) {
            // Trop proche, reculer
            const angle = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.x, this.y);
            this.setVelocity(
                Math.cos(angle) * this.speed,
                Math.sin(angle) * this.speed
            );
        } else {
            // Bonne distance, arrêter et tirer
            this.setVelocity(0, 0);
            this.attemptAttack(this.target);
        }
    }

    /**
     * Attaque à distance avec des flèches
     */
    attack(target) {
        console.log(`${this.name} tire une flèche!`);

        // Créer un projectile
        this.shootArrow(target);

        // Animation de tir
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 0.9,
            scaleY: this.scaleY * 1.1,
            duration: 100,
            yoyo: true
        });
    }

    shootArrow(target) {
        // Créer une flèche visuelle
        const arrow = this.scene.add.graphics();
        arrow.lineStyle(2, 0xffaa00);
        arrow.beginPath();
        arrow.moveTo(0, 0);
        arrow.lineTo(10, 0);
        arrow.strokePath();
        arrow.fillStyle(0xff8800);
        arrow.fillTriangle(10, 0, 14, -3, 14, 3);

        arrow.x = this.x;
        arrow.y = this.y;

        // Angle vers la cible
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        arrow.rotation = angle;

        // Animation de la flèche
        this.scene.tweens.add({
            targets: arrow,
            x: target.x,
            y: target.y,
            duration: 400,
            ease: 'Linear',
            onComplete: () => {
                // Vérifier si la flèche touche
                const distance = Phaser.Math.Distance.Between(
                    arrow.x, arrow.y,
                    target.x, target.y
                );

                if (distance < 30 && target.takeDamage) {
                    target.takeDamage(this.damage, this);
                    this.showFloatingText('Touché!', '#ff8800', 16);
                }

                arrow.destroy();
            }
        });
    }

    /**
     * Une fois converti, l'archer devient un défenseur redoutable
     */
    convert() {
        super.convert();
        console.log("L'archer abaisse son arc et vous salue.");
        this.showFloatingText('À votre service!', '#ffd700', 16);

        // Les archers convertis ont plus de dégâts
        this.damage = 12;
        this.attackInterval = 1500; // Tire plus vite
    }
}
