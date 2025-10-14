/**
 * Gestionnaire des tâches de construction/creusage
 */
class TaskManager {
    constructor(scene) {
        this.scene = scene;
        this.tasks = [];
        this.markedTiles = new Map(); // Map des tiles marquées avec leurs sprites de marquage
    }

    /**
     * Ajouter ou annuler une tâche de creusage
     * @param {number} x
     * @param {number} y
     */
    addDigTask(x, y) {
        // Vérifier si la tâche existe déjà
        const existingIndex = this.tasks.findIndex(t => t.x === x && t.y === y && t.type === 'dig');
        if (existingIndex !== -1) {
            // Tâche existe, l'annuler
            const task = this.tasks[existingIndex];

            // Si la tâche est assignée, la désassigner
            if (task.assigned && task.assignedWorker) {
                task.assignedWorker.currentTask = null;
                task.assignedWorker.state = 'idle';
            }

            // Retirer la tâche
            this.tasks.splice(existingIndex, 1);
            this.unmarkTile(x, y);

            console.log(`❌ Tâche de creusage annulée en (${x}, ${y})`);
            return;
        }

        // Vérifier que c'est bien un mur
        const tileData = this.scene.getTileSpriteAt(x, y);
        if (!tileData || tileData.tile.type !== 'wall') {
            return;
        }

        // Ajouter la tâche
        const task = {
            type: 'dig',
            x: x,
            y: y,
            assigned: false,
            assignedWorker: null
        };

        this.tasks.push(task);
        this.markTile(x, y);

        console.log(`✅ Tâche de creusage ajoutée en (${x}, ${y})`);
    }

    /**
     * Marquer visuellement une tile à creuser
     * @param {number} x
     * @param {number} y
     */
    markTile(x, y) {
        const key = `${x},${y}`;
        if (this.markedTiles.has(key)) {
            return; // Déjà marquée
        }

        const isoPos = IsoUtils.cartToIso(x, y);
        const screenX = isoPos.x + this.scene.worldOffset.x;
        const screenY = isoPos.y + this.scene.worldOffset.y;

        // Dimensions du cube
        const tileWidth = 64;
        const tileHeight = 32;
        const cubeHeight = 64;

        // Créer un graphics pour dessiner les pointillés
        const graphics = this.scene.add.graphics();
        graphics.setDepth(10000);

        // Fonction pour dessiner une ligne en pointillés
        const drawDashedLine = (x1, y1, x2, y2, dashLength = 4) => {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.floor(length / dashLength);

            for (let i = 0; i < steps; i++) {
                const t1 = i / steps;
                const t2 = (i + 0.5) / steps;

                const sx = x1 + dx * t1;
                const sy = y1 + dy * t1;
                const ex = x1 + dx * t2;
                const ey = y1 + dy * t2;

                // Alterner rouge et blanc
                graphics.lineStyle(2, i % 2 === 0 ? 0xff0000 : 0xffffff, 1);
                graphics.beginPath();
                graphics.moveTo(sx, sy);
                graphics.lineTo(ex, ey);
                graphics.strokePath();
            }
        };

        // Calculer les positions des coins du cube
        // L'origine du sprite wall est à (0.5, 0.833) = (32, 80) dans un canvas de 64x96
        // screenX, screenY correspond au pixel (32, 80) du canvas

        // Losange du HAUT (Y=0 à Y=32 dans le canvas)
        const topTop = { x: screenX, y: screenY - 80 };           // (32, 0)
        const topRight = { x: screenX + 32, y: screenY - 64 };    // (64, 16)
        const topBottom = { x: screenX, y: screenY - 48 };        // (32, 32)
        const topLeft = { x: screenX - 32, y: screenY - 64 };     // (0, 16)

        // Coins du BAS (base invisible, Y=64 à Y=96 dans le canvas)
        const bottomTop = { x: screenX, y: screenY - 16 };        // (32, 64)
        const bottomRight = { x: screenX + 32, y: screenY };      // (64, 80)
        const bottomBottom = { x: screenX, y: screenY + 16 };     // (32, 96)
        const bottomLeft = { x: screenX - 32, y: screenY };       // (0, 80)

        // Vérifier quels murs adjacents existent pour ne dessiner que les arêtes visibles
        const hasWallLeft = this.scene.worldData[y + 1]?.[x - 1]?.type === 'wall';     // Sud-Ouest
        const hasWallRight = this.scene.worldData[y - 1]?.[x + 1]?.type === 'wall';    // Nord-Est
        const hasWallBottom = this.scene.worldData[y + 1]?.[x + 1]?.type === 'wall';   // Sud-Est

        // Dessiner les 4 arêtes du losange du haut (toujours visibles)
        drawDashedLine(topTop.x, topTop.y, topRight.x, topRight.y);
        drawDashedLine(topRight.x, topRight.y, topBottom.x, topBottom.y);
        drawDashedLine(topBottom.x, topBottom.y, topLeft.x, topLeft.y);
        drawDashedLine(topLeft.x, topLeft.y, topTop.x, topTop.y);

        // Dessiner les arêtes verticales seulement si visibles (pas de mur devant)
        if (!hasWallLeft) {
            // Arête gauche visible
            drawDashedLine(topLeft.x, topLeft.y, bottomLeft.x, bottomLeft.y);
        }
        if (!hasWallBottom) {
            // Arête bas-centre visible
            drawDashedLine(topBottom.x, topBottom.y, bottomBottom.x, bottomBottom.y);
        }
        if (!hasWallRight) {
            // Arête droite visible
            drawDashedLine(topRight.x, topRight.y, bottomRight.x, bottomRight.y);
        }

        this.markedTiles.set(key, graphics);
    }

    /**
     * Retirer le marquage d'une tile
     * @param {number} x
     * @param {number} y
     */
    unmarkTile(x, y) {
        const key = `${x},${y}`;
        const marker = this.markedTiles.get(key);
        if (marker) {
            marker.destroy();
            this.markedTiles.delete(key);
        }
    }

    /**
     * Obtenir une tâche non assignée
     * @returns {Object|null}
     */
    getUnassignedTask() {
        return this.tasks.find(t => !t.assigned);
    }

    /**
     * Assigner une tâche à un worker
     * @param {Object} task
     * @param {Object} worker
     */
    assignTask(task, worker) {
        task.assigned = true;
        task.assignedWorker = worker;
    }

    /**
     * Compléter une tâche
     * @param {Object} task
     */
    completeTask(task) {
        const index = this.tasks.indexOf(task);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            this.unmarkTile(task.x, task.y);
            console.log(`✅ Tâche complétée en (${task.x}, ${task.y})`);
        }
    }

    /**
     * Annuler l'assignation d'une tâche (si le worker ne peut pas la faire)
     * @param {Object} task
     */
    unassignTask(task) {
        task.assigned = false;
        task.assignedWorker = null;
    }

    /**
     * Supprimer complètement une tâche (par exemple si elle est inaccessible)
     * @param {Object} task
     */
    removeTask(task) {
        const index = this.tasks.indexOf(task);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            this.unmarkTile(task.x, task.y);
            console.log(`🗑️ Tâche supprimée (inaccessible) en (${task.x}, ${task.y})`);
        }
    }
}
