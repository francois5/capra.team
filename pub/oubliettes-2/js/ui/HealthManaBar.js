/**
 * Barre de vie et mana pour le héros
 */
class HealthManaBar {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        const barWidth = 200;
        const barHeight = 20;
        const padding = 10;
        const startY = padding;

        // Barre de vie (rouge)
        this.healthBarBg = scene.add.rectangle(padding, startY, barWidth, barHeight, 0x333333)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(10000);

        this.healthBar = scene.add.rectangle(padding + 2, startY + 2, barWidth - 4, barHeight - 4, 0xff0000)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(10001);

        this.healthText = scene.add.text(padding + barWidth / 2, startY + barHeight / 2, '100 / 100', {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(10002);

        // Barre de mana (bleu)
        this.manaBarBg = scene.add.rectangle(padding, startY + barHeight + 5, barWidth, barHeight, 0x333333)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(10000);

        this.manaBar = scene.add.rectangle(padding + 2, startY + barHeight + 5 + 2, barWidth - 4, barHeight - 4, 0x00aaff)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(10001);

        this.manaText = scene.add.text(padding + barWidth / 2, startY + barHeight + 5 + barHeight / 2, '50 / 50', {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(10002);

        this.maxBarWidth = barWidth - 4;

        // Affichage du nombre de fidèles avec fond
        const controlY = startY + (barHeight + 5) * 2 + 10;

        // DEBUG: Fond rouge vif pour voir si c'est rendu
        this.controlBg = scene.add.rectangle(padding, controlY, 100, 40, 0xff0000, 1.0)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(20000);

        this.controlText = scene.add.text(padding + 50, controlY + 20, 'TEST 0/1', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(20001);

        console.log(`🔍 controlBg created at (${padding}, ${controlY}) with size 100x40`);
        console.log(`🔍 controlText created at (${padding + 50}, ${controlY + 20})`);

        console.log('✅ Barres de vie/mana créées');
        console.log(`HP Bar position: (${padding}, ${startY})`);
        console.log(`Mana Bar position: (${padding}, ${startY + barHeight + 5})`);
    }

    update(hp, maxHp, mana, maxMana, controlledMonsters, maxControlledMonsters) {
        // Mettre à jour la barre de vie
        const healthPercent = hp / maxHp;
        this.healthBar.width = this.maxBarWidth * healthPercent;
        this.healthText.setText(`${Math.floor(hp)} / ${maxHp}`);

        // Mettre à jour la barre de mana
        const manaPercent = mana / maxMana;
        this.manaBar.width = this.maxBarWidth * manaPercent;
        this.manaText.setText(`${Math.floor(mana)} / ${maxMana}`);

        // Mettre à jour l'affichage des fidèles
        if (this.controlText) {
            const text = `${controlledMonsters}/${maxControlledMonsters}`;
            this.controlText.setText(text);
            // Debug pour vérifier
            if (!this.controlText._debugLogged) {
                console.log(`🔍 Monster counter text set to: "${text}"`);
                console.log(`🔍 controlText position: (${this.controlText.x}, ${this.controlText.y})`);
                console.log(`🔍 controlText visible: ${this.controlText.visible}, alpha: ${this.controlText.alpha}, depth: ${this.controlText.depth}`);
                this.controlText._debugLogged = true;
            }
        } else {
            console.warn('⚠️ controlText is null or undefined!');
        }
    }
}
