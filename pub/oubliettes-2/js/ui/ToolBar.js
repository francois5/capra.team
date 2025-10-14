/**
 * Barre d'outils en bas à gauche de l'écran
 */
class ToolBar {
    constructor(scene) {
        this.scene = scene;
        this.currentTool = 'pickaxe';
        this.buttons = [];

        this.create();
    }

    create() {
        const padding = 20;
        const buttonSize = 64;
        const buttonSpacing = 10;

        // Position en bas à gauche
        const startX = padding;
        const startY = this.scene.cameras.main.height - padding - buttonSize;

        console.log('DEBUG ToolBar: Camera height =', this.scene.cameras.main.height);
        console.log('DEBUG ToolBar: Canvas height =', this.scene.game.canvas.height);
        console.log('DEBUG ToolBar: startY =', startY);

        // Bouton Pioche
        this.createToolButton(startX, startY, 'pickaxe', 'Pioche', '⛏');

        // Bouton Sort de Conversion (éclair bleu)
        this.createToolButton(startX + (buttonSize + buttonSpacing), startY, 'conversion', 'Conversion', '⚡', 0x00aaff);

        // Bouton Sort de Guérison (éclair rouge)
        this.createToolButton(startX + 2 * (buttonSize + buttonSpacing), startY, 'heal', 'Guérison', '⚡', 0xff0000);

        console.log('✅ ToolBar créée');
    }

    createToolButton(x, y, toolName, label, iconText = '⛏', iconColor = 0xffffff) {
        const buttonSize = 64;

        // Créer le fond du bouton
        const bg = this.scene.add.rectangle(x, y, buttonSize, buttonSize, 0x444444)
            .setOrigin(0, 0)
            .setScrollFactor(0) // Fixed à l'écran, ne bouge pas avec la caméra
            .setInteractive()
            .setDepth(10000);

        // Bordure
        const border = this.scene.add.rectangle(x, y, buttonSize, buttonSize)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setStrokeStyle(3, 0xffffff)
            .setDepth(10001);

        // Convertir la couleur hex en string CSS
        const colorString = '#' + iconColor.toString(16).padStart(6, '0');

        // Icône
        const icon = this.scene.add.text(x + buttonSize / 2, y + buttonSize / 2, iconText, {
            fontSize: '32px',
            color: colorString
        })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(10002);

        // Interactions
        bg.on('pointerover', () => {
            bg.setFillStyle(0x666666);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x444444);
        });

        bg.on('pointerdown', () => {
            this.selectTool(toolName);
            console.log('Outil sélectionné:', toolName);
        });

        // Sauvegarder les références
        this.buttons.push({
            name: toolName,
            bg: bg,
            border: border,
            icon: icon,
            label: label
        });

        // Sélectionner par défaut
        if (toolName === this.currentTool) {
            border.setStrokeStyle(3, 0xffaa00);
        }
    }

    selectTool(toolName) {
        this.currentTool = toolName;

        // Mettre à jour les bordures
        this.buttons.forEach(button => {
            if (button.name === toolName) {
                button.border.setStrokeStyle(3, 0xffaa00); // Orange pour sélectionné
            } else {
                button.border.setStrokeStyle(3, 0xffffff); // Blanc pour non-sélectionné
            }
        });
    }

    getCurrentTool() {
        return this.currentTool;
    }
}
