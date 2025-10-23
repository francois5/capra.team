/**
 * Rat - Premier allié potentiel du joueur
 * Un codétenu sous forme de rat, faible mais loyal une fois converti
 */
class Rat extends Creature {
    constructor(scene, x, y) {
        super(scene, x, y, 'rat', {
            name: 'Rat',
            type: 'rat',
            maxHp: 30,
            damage: 3,
            speed: 100,
            loyalty: -20, // Moins hostile que les autres
            wanderRadius: 80
        });

        // Les rats sont petits
        this.setScale(0.015);
        this.body.setSize(20, 20);
        this.body.setOffset(6, 6);

        // Description pour le joueur
        this.description = "Un codétenu transformé en rat. Il a l'air perdu...";
    }

    /**
     * Les rats sont plus faciles à convertir
     */
    gainLoyalty(amount) {
        // Bonus de 50% pour les rats
        return super.gainLoyalty(amount * 1.5);
    }

    /**
     * Comportement spécial: les rats fuient quand ils ont peu de HP
     */
    evaluateAI() {
        if (this.isConverted) {
            this.aiState = 'follow';
            this.target = this.scene.player;
        } else {
            // Fuir si HP bas
            if (this.hp < this.maxHp * 0.3) {
                this.aiState = 'flee';
                this.target = this.scene.player;
                return;
            }

            // Sinon comportement normal
            super.evaluateAI();
        }
    }

    /**
     * Effet sonore spécial quand le rat est converti
     */
    convert() {
        super.convert();
        console.log("Le rat vous regarde avec des yeux reconnaissants!");
        this.showFloatingText('Squeak!', '#ffd700', 16);
    }
}
