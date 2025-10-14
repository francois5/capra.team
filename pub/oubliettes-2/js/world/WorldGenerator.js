/**
 * Générateur de monde souterrain isométrique
 * Cavernes générées avec bruit de Perlin
 */
class WorldGenerator {
    constructor(width = 20, height = 20) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.chambers = []; // Liste des chambres (régions)
        this.seed = Math.random() * 1000;
    }

    /**
     * Générer le monde
     * @returns {Array} - Tableau 2D de tiles
     */
    generate() {
        this.initializeTiles();
        this.createCavesWithPerlin();
        this.smoothCaves();
        this.ensureSpawnArea();
        this.assignTerritories();
        return this.tiles;
    }

    /**
     * Initialiser toutes les tiles comme murs
     */
    initializeTiles() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = {
                    type: 'wall',
                    passable: false
                };
            }
        }
    }

    /**
     * Bruit de Perlin simplifié (2D)
     */
    perlin2D(x, y) {
        // Utiliser une fonction de bruit simple basée sur le sinus
        const scale = 0.1;
        const noise = Math.sin(x * scale + this.seed) * Math.cos(y * scale + this.seed);
        const noise2 = Math.sin((x + y) * scale * 0.5 + this.seed * 2) * 0.5;
        return (noise + noise2) / 1.5;
    }

    /**
     * Créer des cavernes avec bruit de Perlin
     */
    createCavesWithPerlin() {
        const threshold = 0.15; // Seuil pour décider si c'est sol ou mur

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Générer bruit de Perlin à plusieurs échelles (octaves)
                const noise1 = this.perlin2D(x * 1.0, y * 1.0);
                const noise2 = this.perlin2D(x * 0.5, y * 0.5) * 0.5;
                const noise3 = this.perlin2D(x * 0.25, y * 0.25) * 0.25;

                const combinedNoise = noise1 + noise2 + noise3;

                // Si le bruit est au-dessus du seuil, c'est du sol
                if (combinedNoise > threshold) {
                    this.tiles[y][x] = {
                        type: 'floor',
                        passable: true
                    };
                }
            }
        }

        // Forcer les bords à être des murs
        for (let x = 0; x < this.width; x++) {
            this.tiles[0][x] = { type: 'wall', passable: false };
            this.tiles[this.height - 1][x] = { type: 'wall', passable: false };
        }
        for (let y = 0; y < this.height; y++) {
            this.tiles[y][0] = { type: 'wall', passable: false };
            this.tiles[y][this.width - 1] = { type: 'wall', passable: false };
        }
    }

    /**
     * Lisser les cavernes avec automate cellulaire
     */
    smoothCaves() {
        const iterations = 2;

        for (let i = 0; i < iterations; i++) {
            const newTiles = JSON.parse(JSON.stringify(this.tiles));

            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    const wallCount = this.countNeighborWalls(x, y);

                    // Règle d'automate cellulaire
                    if (wallCount > 4) {
                        newTiles[y][x] = { type: 'wall', passable: false };
                    } else if (wallCount < 4) {
                        newTiles[y][x] = { type: 'floor', passable: true };
                    }
                }
            }

            this.tiles = newTiles;
        }
    }

    /**
     * Compter les murs voisins
     */
    countNeighborWalls(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this.tiles[ny][nx].type === 'wall') {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * S'assurer qu'il y a une zone dégagée au spawn
     */
    ensureSpawnArea() {
        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);
        const radius = 3;

        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
                    this.tiles[y][x] = {
                        type: 'floor',
                        passable: true
                    };
                }
            }
        }
    }

    /**
     * Obtenir le type de tile à une position
     * @param {number} x
     * @param {number} y
     * @returns {Object|null}
     */
    getTileAt(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return null;
        }
        return this.tiles[y][x];
    }

    /**
     * Vérifier si une tile est traversable
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isPassable(x, y) {
        const tile = this.getTileAt(x, y);
        return tile && tile.passable;
    }

    /**
     * Obtenir un point de spawn valide (au centre)
     * @returns {{x: number, y: number}}
     */
    getSpawnPoint() {
        return {
            x: Math.floor(this.width / 2),
            y: Math.floor(this.height / 2)
        };
    }

    /**
     * Assigner des territoires aux oubliettes
     * Chaque zone peut être : void (vide), black_goat (chèvre noire), light (lumière)
     */
    assignTerritories() {
        // Trouver toutes les chambres
        const visited = new Set();

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                if (tile.type === 'floor' && !visited.has(`${x},${y}`)) {
                    // Flood fill pour trouver toute la région connectée
                    const region = this.floodFillRegion(x, y, visited);
                    if (region.length > 3) { // Ignorer les toutes petites régions
                        this.chambers.push(region);
                    }
                }
            }
        }

        console.log(`🗺️ ${this.chambers.length} régions trouvées`);

        // Assigner des territoires aléatoirement aux chambres
        const territories = ['void', 'black_goat', 'light'];

        this.chambers.forEach((region, index) => {
            // Distribuer équitablement les territoires
            let territory;
            if (index === 0) {
                // La première chambre (centrale) est toujours vide (spawn du joueur)
                territory = 'void';
            } else {
                // Alterner entre chèvre noire et lumière pour les autres
                territory = (index % 2 === 0) ? 'black_goat' : 'light';
            }

            // Assigner le territoire à toutes les tiles de la région
            region.forEach(({x, y}) => {
                this.tiles[y][x].territory = territory;
            });

            console.log(`✅ Région ${index + 1}: ${territory} (${region.length} tiles)`);
        });
    }

    /**
     * Flood fill pour trouver une région connectée
     * @param {number} startX
     * @param {number} startY
     * @param {Set} visited
     * @returns {Array} Liste de {x, y}
     */
    floodFillRegion(startX, startY, visited) {
        const region = [];
        const queue = [{x: startX, y: startY}];
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const {x, y} = queue.shift();

            // Vérifier que c'est bien du sol
            if (this.tiles[y][x].type !== 'floor') continue;

            region.push({x, y});

            // Explorer les 4 voisins
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                const key = `${nx},${ny}`;

                if (nx >= 0 && ny >= 0 && nx < this.width && ny < this.height &&
                    !visited.has(key) && this.tiles[ny][nx].type === 'floor') {
                    visited.add(key);
                    queue.push({x: nx, y: ny});
                }
            }
        }

        return region;
    }

    /**
     * Vérifier si deux positions sont connectées (même salle/espace sans mur entre elles)
     * Utilise un flood fill limité pour vérifier la connexion
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {boolean}
     */
    areInSameChamber(x1, y1, x2, y2) {
        // Si une des positions n'est pas passable, pas connecté
        if (!this.isPassable(x1, y1) || !this.isPassable(x2, y2)) {
            return false;
        }

        // Si c'est la même position
        if (x1 === x2 && y1 === y2) {
            return true;
        }

        // Flood fill limité pour vérifier la connexion
        const visited = new Set();
        const queue = [{x: x1, y: y1}];
        visited.add(`${x1},${y1}`);
        const maxSteps = 100; // Limite pour éviter les boucles infinies
        let steps = 0;

        while (queue.length > 0 && steps < maxSteps) {
            const {x, y} = queue.shift();
            steps++;

            // Si on a trouvé la cible
            if (x === x2 && y === y2) {
                return true;
            }

            // Explorer les 4 voisins
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                const key = `${nx},${ny}`;

                if (!visited.has(key) && this.isPassable(nx, ny)) {
                    visited.add(key);
                    queue.push({x: nx, y: ny});
                }
            }
        }

        return false;
    }
}
