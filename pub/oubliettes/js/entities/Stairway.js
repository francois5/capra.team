/**
 * Stairway - Escalier de lumière gardé par des archers
 * Peut être "converti" pour devenir un point de spawn d'alliés
 */
class Stairway extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'stairway');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.name = 'Escalier de Lumière';
        this.body.setImmovable(true);
        this.body.setSize(48, 48);

        // État de l'escalier
        this.isConverted = false;
        this.maxLoyalty = 100;
        this.loyalty = -100; // Très hostile au début
        this.conversionThreshold = 80;

        // Archers gardiens
        this.guardians = [];
        this.maxGuardians = 2;

        // Spawner une fois converti
        this.canSpawnAllies = false;
        this.spawnCooldown = 0;
        this.spawnInterval = 15000; // 15 secondes

        // Barres
        this.createLoyaltyBar();

        // Effet de lumière
        this.createLightEffect();

        // Spawner les gardiens initiaux
        this.spawnGuardians();
    }

    createLoyaltyBar() {
        this.loyaltyBarBg = this.scene.add.graphics();
        this.loyaltyBarFill = this.scene.add.graphics();
        this.loyaltyBarWidth = 48;
        this.loyaltyBarHeight = 5;
    }

    updateLoyaltyBar() {
        this.loyaltyBarBg.clear();
        this.loyaltyBarFill.clear();

        const barX = this.x - this.loyaltyBarWidth / 2;
        const barY = this.y - 35;

        // Fond
        this.loyaltyBarBg.fillStyle(0x000000);
        this.loyaltyBarBg.fillRect(barX, barY, this.loyaltyBarWidth, this.loyaltyBarHeight);

        // Remplissage
        const loyaltyPercent = (this.loyalty + 100) / 200;
        let color = this.isConverted ? 0xffd700 : (this.loyalty > 0 ? 0xff8800 : 0x8800ff);

        this.loyaltyBarFill.fillStyle(color);
        this.loyaltyBarFill.fillRect(barX + 1, barY + 1,
            (this.loyaltyBarWidth - 2) * loyaltyPercent, this.loyaltyBarHeight - 2);
    }

    createLightEffect() {
        // Effet de lumière au-dessus de l'escalier
        const lightRadius = this.isConverted ? 80 : 40;
        const lightColor = this.isConverted ? 0xffd700 : 0x4488ff;

        this.lightEffect = this.scene.add.graphics();
        this.lightEffect.fillStyle(lightColor, 0.2);
        this.lightEffect.fillCircle(this.x, this.y, lightRadius);

        // Animation de pulsation
        this.scene.tweens.add({
            targets: this.lightEffect,
            alpha: 0.3,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }

    spawnGuardians() {
        // Créer 2 archers de chaque côté
        const positions = [
            { x: this.x - 50, y: this.y },
            { x: this.x + 50, y: this.y }
        ];

        positions.forEach(pos => {
            const archer = new Archer(this.scene, pos.x, pos.y);
            archer.homePosition = pos;
            archer.wanderRadius = 40; // Restent près de l'escalier
            this.guardians.push(archer);
            this.scene.enemiesGroup.add(archer);
        });
    }

    gainLoyalty(amount) {
        const oldLoyalty = this.loyalty;
        this.loyalty = Math.min(this.maxLoyalty, this.loyalty + amount);

        this.showFloatingText(`+${amount}`, '#ffd700');

        // Vérifier conversion
        if (!this.isConverted && this.loyalty >= this.conversionThreshold) {
            this.convert();
        }

        this.updateLoyaltyBar();
        return this.loyalty - oldLoyalty;
    }

    convert() {
        this.isConverted = true;
        this.canSpawnAllies = true;

        console.log("L'escalier de lumière brille d'un éclat doré!");

        // Effet visuel
        this.setTint(0xffd700);
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 300,
            yoyo: true,
            repeat: 3
        });

        // Particules
        const particles = this.scene.add.particles(this.x, this.y, 'particle', {
            speed: { min: 80, max: 150 },
            scale: { start: 1, end: 0 },
            tint: 0xffd700,
            lifespan: 1000,
            quantity: 50,
            blendMode: 'ADD'
        });

        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });

        // Mettre à jour l'effet de lumière
        if (this.lightEffect) {
            this.lightEffect.destroy();
        }
        this.createLightEffect();

        // Notifier
        this.showFloatingText('SANCTUAIRE LIBÉRÉ!', '#ffd700', 28);

        // Convertir les gardiens
        this.guardians.forEach(guardian => {
            if (guardian.active) {
                guardian.convert();
                // Déplacer vers les alliés
                this.scene.enemiesGroup.remove(guardian);
                this.scene.alliesGroup.add(guardian);
            }
        });

        // Notifier la scène
        if (this.scene.onStairwayConverted) {
            this.scene.onStairwayConverted(this);
        }
    }

    update(time, delta) {
        this.updateLoyaltyBar();

        // Spawner des alliés si converti
        if (this.isConverted && this.canSpawnAllies) {
            this.spawnCooldown -= delta;

            if (this.spawnCooldown <= 0) {
                // Vérifier s'il y a des ennemis proches
                const nearbyEnemies = this.scene.getEnemiesNearPoint(this.x, this.y, 300);

                if (nearbyEnemies.length > 0) {
                    this.spawnAlly();
                    this.spawnCooldown = this.spawnInterval;
                }
            }
        }
    }

    spawnAlly() {
        console.log("L'escalier invoque un défenseur!");

        // Spawner un rat ou un archer selon le niveau
        const allyType = Math.random() > 0.7 ? 'archer' : 'rat';
        let ally;

        if (allyType === 'archer') {
            ally = new Archer(this.scene, this.x + 40, this.y);
        } else {
            ally = new Rat(this.scene, this.x - 40, this.y);
        }

        // Déjà converti
        ally.isConverted = true;
        ally.loyalty = 100;
        ally.aiState = 'follow';
        ally.target = this.scene.player;
        ally.updateAllegianceVisual();

        this.scene.alliesGroup.add(ally);

        // Effet
        this.showFloatingText(`${allyType === 'archer' ? 'Archer' : 'Rat'} invoqué!`, '#88ff88', 18);
    }

    showFloatingText(text, color = '#ffffff', size = 16) {
        const floatingText = this.scene.add.text(this.x, this.y - 50, text, {
            fontSize: `${size}px`,
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: floatingText,
            y: floatingText.y - 40,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }

    destroy() {
        if (this.loyaltyBarBg) this.loyaltyBarBg.destroy();
        if (this.loyaltyBarFill) this.loyaltyBarFill.destroy();
        if (this.lightEffect) this.lightEffect.destroy();

        super.destroy();
    }
}
