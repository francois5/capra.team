/**
 * Effet visuel d'éclair
 */
class LightningEffect {
    /**
     * Créer un éclair entre deux points
     * @param {Phaser.Scene} scene
     * @param {number} x1 - Position X de départ
     * @param {number} y1 - Position Y de départ
     * @param {number} x2 - Position X d'arrivée
     * @param {number} y2 - Position Y d'arrivée
     * @param {number} color - Couleur de l'éclair (hex)
     * @param {number} duration - Durée en ms (défaut: 300)
     */
    static create(scene, x1, y1, x2, y2, color = 0x00aaff, duration = 300) {
        const graphics = scene.add.graphics();
        graphics.setDepth(9999);

        // Générer les points de l'éclair avec effet zigzag
        const points = this.generateLightningPoints(x1, y1, x2, y2);

        // Dessiner l'éclair principal
        graphics.lineStyle(3, color, 1);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.strokePath();

        // Dessiner un halo plus large et transparent
        graphics.lineStyle(8, color, 0.3);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.strokePath();

        // Ajouter quelques éclairs secondaires
        for (let i = 0; i < 2; i++) {
            const branchIndex = Math.floor(Math.random() * (points.length - 2)) + 1;
            const branchPoint = points[branchIndex];
            const angle = Math.random() * Math.PI * 2;
            const length = 20 + Math.random() * 30;
            const endX = branchPoint.x + Math.cos(angle) * length;
            const endY = branchPoint.y + Math.sin(angle) * length;

            graphics.lineStyle(2, color, 0.8);
            graphics.beginPath();
            graphics.moveTo(branchPoint.x, branchPoint.y);
            graphics.lineTo(endX, endY);
            graphics.strokePath();
        }

        // Animation de disparition
        scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                graphics.destroy();
            }
        });

        // Créer un flash au point d'impact
        this.createImpactFlash(scene, x2, y2, color, duration);
    }

    /**
     * Générer les points d'un éclair avec effet zigzag
     */
    static generateLightningPoints(x1, y1, x2, y2) {
        const points = [];
        const segments = 8 + Math.floor(Math.random() * 4);

        points.push({ x: x1, y: y1 });

        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;

            // Ajouter une variation aléatoire perpendiculaire
            const dx = x2 - x1;
            const dy = y2 - y1;
            const perpX = -dy;
            const perpY = dx;
            const length = Math.sqrt(perpX * perpX + perpY * perpY);
            const offset = (Math.random() - 0.5) * 30;

            points.push({
                x: x + (perpX / length) * offset,
                y: y + (perpY / length) * offset
            });
        }

        points.push({ x: x2, y: y2 });

        return points;
    }

    /**
     * Créer un flash au point d'impact
     */
    static createImpactFlash(scene, x, y, color, duration) {
        const circle = scene.add.circle(x, y, 5, color, 1);
        circle.setDepth(10000);

        scene.tweens.add({
            targets: circle,
            radius: 30,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                circle.destroy();
            }
        });
    }
}
