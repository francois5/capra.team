/**
 * Utilitaires pour la projection isométrique
 * Ratio 2:1 classique (64x32 tiles)
 */
class IsoUtils {
    static TILE_WIDTH = 64;
    static TILE_HEIGHT = 32;

    /**
     * Convertir coordonnées cartésiennes (grille) → coordonnées isométriques (écran)
     * @param {number} cartX - Position X dans la grille (0, 1, 2, ...)
     * @param {number} cartY - Position Y dans la grille (0, 1, 2, ...)
     * @returns {{x: number, y: number}} - Position à l'écran en pixels
     */
    static cartToIso(cartX, cartY) {
        const isoX = (cartX - cartY) * (this.TILE_WIDTH / 2);
        const isoY = (cartX + cartY) * (this.TILE_HEIGHT / 2);
        return { x: isoX, y: isoY };
    }

    /**
     * Convertir coordonnées isométriques (écran) → coordonnées cartésiennes (grille)
     * @param {number} isoX - Position X à l'écran
     * @param {number} isoY - Position Y à l'écran
     * @returns {{x: number, y: number}} - Position dans la grille
     */
    static isoToCart(isoX, isoY) {
        const cartX = (isoX / (this.TILE_WIDTH / 2) + isoY / (this.TILE_HEIGHT / 2)) / 2;
        const cartY = (isoY / (this.TILE_HEIGHT / 2) - isoX / (this.TILE_WIDTH / 2)) / 2;
        return { x: cartX, y: cartY };
    }

    /**
     * Calculer la profondeur (depth) pour le z-ordering
     * Les objets plus "bas" et "à droite" doivent être rendus par-dessus
     * @param {number} cartX - Position X dans la grille
     * @param {number} cartY - Position Y dans la grille
     * @returns {number} - Valeur de depth (plus grand = rendu par-dessus)
     */
    static getDepth(cartX, cartY) {
        return cartX + cartY;
    }

    /**
     * Obtenir la tuile (grid position) à partir d'une position écran
     * @param {number} isoX - Position X à l'écran
     * @param {number} isoY - Position Y à l'écran
     * @returns {{x: number, y: number}} - Position de la tuile (arrondie)
     */
    static getTileAt(isoX, isoY) {
        const cart = this.isoToCart(isoX, isoY);
        return {
            x: Math.floor(cart.x),
            y: Math.floor(cart.y)
        };
    }

    /**
     * Centrer une position iso sur sa tuile
     * @param {number} cartX - Position X dans la grille
     * @param {number} cartY - Position Y dans la grille
     * @returns {{x: number, y: number}} - Position centrée à l'écran
     */
    static getCenterOfTile(cartX, cartY) {
        return this.cartToIso(cartX + 0.5, cartY + 0.5);
    }

    /**
     * Calculer l'offset pour centrer le monde à l'écran
     * @param {number} screenWidth - Largeur de l'écran
     * @param {number} screenHeight - Hauteur de l'écran
     * @returns {{x: number, y: number}} - Offset à appliquer
     */
    static getWorldOffset(screenWidth, screenHeight) {
        return {
            x: screenWidth / 2,
            y: screenHeight / 4
        };
    }

    /**
     * Vérifier si une position de grille est adjacente à une autre
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {boolean}
     */
    static isAdjacent(x1, y1, x2, y2) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return (dx <= 1 && dy <= 1) && (dx + dy > 0);
    }

    /**
     * Calculer la distance Manhattan entre deux tuiles
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number}
     */
    static manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
}
