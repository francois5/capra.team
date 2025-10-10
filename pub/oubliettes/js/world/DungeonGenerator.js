class DungeonGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = 32;
        this.tiles = [];
        this.rooms = [];
    }

    generate() {
        // Initialiser avec des murs
        this.initializeWalls();

        // Générer des salles
        this.generateRooms();

        // Connecter les salles avec des couloirs
        this.generateCorridors();

        // Ajouter des portes
        this.addDoors();

        return this.tiles;
    }

    initializeWalls() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = 'wall';
            }
        }
    }

    generateRooms() {
        this.rooms = [
            { x: 5, y: 5, width: 8, height: 6, type: 'entrance' },
            { x: 20, y: 8, width: 6, height: 8, type: 'treasure' },
            { x: 35, y: 5, width: 10, height: 7, type: 'boss' },
            { x: 15, y: 20, width: 12, height: 5, type: 'merchant' },
            { x: 30, y: 22, width: 8, height: 6, type: 'rest' }
        ];

        for (let room of this.rooms) {
            this.carveRoom(room);
        }
    }

    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                if (this.isValidCoordinate(x, y)) {
                    this.tiles[y][x] = 'floor';
                }
            }
        }
    }

    generateCorridors() {
        // Connecter les salles avec des couloirs simples
        this.connectRooms(this.rooms[0], this.rooms[1]); // entrance -> treasure
        this.connectRooms(this.rooms[1], this.rooms[2]); // treasure -> boss
        this.connectRooms(this.rooms[0], this.rooms[3]); // entrance -> merchant
        this.connectRooms(this.rooms[3], this.rooms[4]); // merchant -> rest
    }

    connectRooms(roomA, roomB) {
        const centerA = {
            x: roomA.x + Math.floor(roomA.width / 2),
            y: roomA.y + Math.floor(roomA.height / 2)
        };
        const centerB = {
            x: roomB.x + Math.floor(roomB.width / 2),
            y: roomB.y + Math.floor(roomB.height / 2)
        };

        // Couloir en L
        // Horizontal d'abord
        const startX = Math.min(centerA.x, centerB.x);
        const endX = Math.max(centerA.x, centerB.x);
        for (let x = startX; x <= endX; x++) {
            if (this.isValidCoordinate(x, centerA.y)) {
                this.tiles[centerA.y][x] = 'floor';
            }
        }

        // Puis vertical
        const startY = Math.min(centerA.y, centerB.y);
        const endY = Math.max(centerA.y, centerB.y);
        for (let y = startY; y <= endY; y++) {
            if (this.isValidCoordinate(centerB.x, y)) {
                this.tiles[y][centerB.x] = 'floor';
            }
        }
    }

    addDoors() {
        // Ajouter des portes aux entrées de certaines salles
        for (let room of this.rooms) {
            if (room.type === 'treasure' || room.type === 'boss') {
                // Trouver les entrées de la salle et y placer des portes
                this.addDoorToRoom(room);
            }
        }
    }

    addDoorToRoom(room) {
        // Vérifier les bords de la salle pour trouver des connexions
        const edges = [
            // Bord gauche
            { x: room.x - 1, y: room.y + Math.floor(room.height / 2) },
            // Bord droit
            { x: room.x + room.width, y: room.y + Math.floor(room.height / 2) },
            // Bord haut
            { x: room.x + Math.floor(room.width / 2), y: room.y - 1 },
            // Bord bas
            { x: room.x + Math.floor(room.width / 2), y: room.y + room.height }
        ];

        for (let edge of edges) {
            if (this.isValidCoordinate(edge.x, edge.y) && this.tiles[edge.y][edge.x] === 'floor') {
                // Il y a un couloir ici, placer une porte
                if (this.isValidCoordinate(edge.x, edge.y)) {
                    this.tiles[edge.y][edge.x] = 'door';
                }
                break; // Une seule porte par salle
            }
        }
    }

    isValidCoordinate(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getTileAt(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);

        if (!this.isValidCoordinate(tileX, tileY)) {
            return 'wall';
        }

        return this.tiles[tileY][tileX];
    }

    isWalkable(x, y) {
        const tile = this.getTileAt(x, y);
        return tile === 'floor' || tile === 'door';
    }

    getRoomAt(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);

        for (let room of this.rooms) {
            if (tileX >= room.x && tileX < room.x + room.width &&
                tileY >= room.y && tileY < room.y + room.height) {
                return room;
            }
        }
        return null;
    }

    getSpawnPoint() {
        // Point d'apparition dans la salle d'entrée
        const entranceRoom = this.rooms.find(room => room.type === 'entrance');
        return {
            x: (entranceRoom.x + Math.floor(entranceRoom.width / 2)) * this.tileSize,
            y: (entranceRoom.y + Math.floor(entranceRoom.height / 2)) * this.tileSize
        };
    }

    getNPCSpawnPoints() {
        const spawnPoints = [];

        for (let room of this.rooms) {
            if (room.type === 'merchant') {
                spawnPoints.push({
                    x: (room.x + Math.floor(room.width / 2)) * this.tileSize,
                    y: (room.y + Math.floor(room.height / 2)) * this.tileSize,
                    type: 'merchant'
                });
            } else if (room.type === 'entrance') {
                spawnPoints.push({
                    x: (room.x + 2) * this.tileSize,
                    y: (room.y + 2) * this.tileSize,
                    type: 'guard'
                });
            }
        }

        return spawnPoints;
    }
}