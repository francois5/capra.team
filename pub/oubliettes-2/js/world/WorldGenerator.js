/**
 * Générateur de monde souterrain isométrique
 * Oubliettes, catacombes et carrières
 */
class WorldGenerator {
    constructor(width = 20, height = 20) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.chambers = []; // Liste des chambres (régions)
    }

    /**
     * Générer le monde
     * @returns {Array} - Tableau 2D de tiles
     */
    generate() {
        this.initializeTiles();
        this.createChambers();
        this.addWalls();
        this.assignTerritories();
        return this.tiles;
    }

    /**
     * Initialiser toutes les tiles comme sol
     */
    initializeTiles() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = {
                    type: 'floor',
                    passable: true
                };
            }
        }
    }

    /**
     * Créer quelques chambres/salles
     */
    createChambers() {
        // Chambre centrale
        this.createChamber(8, 8, 5, 5);

        // Petites salles autour
        this.createChamber(2, 2, 3, 3);
        this.createChamber(15, 2, 4, 3);
        this.createChamber(2, 15, 3, 4);
        this.createChamber(14, 14, 5, 5);
    }

    /**
     * Créer une chambre
     * @param {number} startX
     * @param {number} startY
     * @param {number} width
     * @param {number} height
     */
    createChamber(startX, startY, width, height) {
        for (let y = startY; y < startY + height && y < this.height; y++) {
            for (let x = startX; x < startX + width && x < this.width; x++) {
                if (x >= 0 && y >= 0) {
                    this.tiles[y][x] = {
                        type: 'floor',
                        passable: true,
                        chamber: true
                    };
                }
            }
        }
    }

    /**
     * Ajouter des murs autour des zones vides
     */
    addWalls() {
        const newTiles = JSON.parse(JSON.stringify(this.tiles));

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Bords du monde = murs
                if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
                    newTiles[y][x] = {
                        type: 'wall',
                        passable: false
                    };
                }
                // Ajouter murs autour des chambres pour créer des couloirs
                else if (!this.tiles[y][x].chamber) {
                    // Si au moins un voisin est dans une chambre, c'est un couloir
                    const hasNeighborChamber = this.hasNeighborOfType(x, y, 'chamber');
                    if (!hasNeighborChamber) {
                        newTiles[y][x] = {
                            type: 'wall',
                            passable: false
                        };
                    }
                }
            }
        }

        this.tiles = newTiles;
    }

    /**
     * Vérifier si une tile a un voisin d'un type donné
     * @param {number} x
     * @param {number} y
     * @param {string} type
     * @returns {boolean}
     */
    hasNeighborOfType(x, y, type) {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < this.width && ny < this.height) {
                if (this.tiles[ny][nx][type]) {
                    return true;
                }
            }
        }
        return false;
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
}
