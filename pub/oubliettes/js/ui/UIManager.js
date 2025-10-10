class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogueBox = null;
        this.dialogueText = null;
        this.skillPanel = null;
        this.isDialogueVisible = false;
        this.isSkillPanelVisible = false;
    }

    updatePlayerStats(stats) {
        // Créer ou mettre à jour le panneau de stats
        let statsDiv = document.getElementById('playerStats');
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.id = 'playerStats';
            statsDiv.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.8);
                padding: 15px;
                border-radius: 8px;
                color: white;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                z-index: 100;
                min-width: 200px;
            `;
            document.getElementById('gameContainer').appendChild(statsDiv);
        }

        // Mettre à jour le contenu
        let statsHTML = '<h3 style="margin: 0 0 10px 0; color: #ffeb3b;">Oubliettes</h3>';
        statsHTML += `<p style="margin: 3px 0;">❤️ HP: <span style="color: #f44336;">${stats.hp}</span> / ${stats.maxHp}</p>`;
        statsHTML += `<p style="margin: 3px 0;">⭐ Niveau: ${stats.level}</p>`;
        statsHTML += `<p style="margin: 3px 0;">✨ XP: ${stats.xp} / ${stats.xpToNext}</p>`;

        // Ajouter les compétences
        if (stats.skills) {
            statsHTML += '<hr style="margin: 10px 0; border-color: #444;">';
            statsHTML += '<p style="margin: 5px 0; color: #ffeb3b;">Compétences:</p>';
            statsHTML += `<p style="margin: 3px 0;">🔮 Magie: ${stats.skills.magic}</p>`;
            statsHTML += `<p style="margin: 3px 0;">⚔️ Combat: ${stats.skills.combat}</p>`;
            statsHTML += `<p style="margin: 3px 0;">💬 Charisme: ${stats.skills.charisma}</p>`;
        }

        statsDiv.innerHTML = statsHTML;
    }

    updateSkillsDisplay(skills) {
        let skillsHTML = '<h3>Compétences</h3>';
        skillsHTML += `<p>Magie: ${skills.magic}</p>`;
        skillsHTML += `<p>Combat: ${skills.combat}</p>`;
        skillsHTML += `<p>Charisme: ${skills.charisma}</p>`;

        // Créer ou mettre à jour le panneau de compétences
        let skillsDiv = document.getElementById('skills');
        if (!skillsDiv) {
            skillsDiv = document.createElement('div');
            skillsDiv.id = 'skills';
            skillsDiv.style.cssText = `
                position: absolute;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(51, 51, 51, 0.9);
                padding: 10px;
                border-radius: 5px;
                width: 200px;
                color: white;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 100;
            `;
            document.getElementById('gameContainer').appendChild(skillsDiv);
        }
        skillsDiv.innerHTML = skillsHTML;
    }

    updateInventory(inventory) {
        // Créer ou mettre à jour le panneau d'inventaire
        let inventoryDiv = document.getElementById('inventoryPanel');
        if (!inventoryDiv) {
            inventoryDiv = document.createElement('div');
            inventoryDiv.id = 'inventoryPanel';
            inventoryDiv.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                padding: 15px;
                border-radius: 8px;
                color: white;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                z-index: 100;
                min-width: 180px;
            `;
            document.getElementById('gameContainer').appendChild(inventoryDiv);
        }

        let inventoryHTML = '<h3 style="margin: 0 0 10px 0; color: #ffeb3b;">Inventaire</h3>';

        if (inventory && inventory.length > 0) {
            inventory.forEach(item => {
                if (item.quantity && item.quantity > 1) {
                    inventoryHTML += `<p style="margin: 3px 0;">• ${item.name} x${item.quantity}</p>`;
                } else {
                    inventoryHTML += `<p style="margin: 3px 0;">• ${item.name}</p>`;
                }
            });
        } else {
            inventoryHTML += '<p style="margin: 3px 0; color: #888;">Vide</p>';
        }

        inventoryDiv.innerHTML = inventoryHTML;
    }

    showDialogue(npcName, text) {
        this.hideDialogue(); // Masquer le dialogue précédent

        // Créer la boîte de dialogue
        const dialogueWidth = 600;
        const dialogueHeight = 120;
        const x = this.scene.cameras.main.width / 2 - dialogueWidth / 2;
        const y = this.scene.cameras.main.height - dialogueHeight - 20;

        this.dialogueBox = this.scene.add.graphics();
        this.dialogueBox.setScrollFactor(0); // Fixer à la caméra

        // Fond de la boîte
        this.dialogueBox.fillStyle(0x000000, 0.8);
        this.dialogueBox.fillRoundedRect(x, y, dialogueWidth, dialogueHeight, 10);

        // Bordure
        this.dialogueBox.lineStyle(2, 0xffeb3b);
        this.dialogueBox.strokeRoundedRect(x, y, dialogueWidth, dialogueHeight, 10);

        // Nom du NPC
        this.nameText = this.scene.add.text(x + 15, y + 10, npcName, {
            fontSize: '16px',
            color: '#ffeb3b',
            fontFamily: 'Courier New'
        }).setScrollFactor(0);

        // Texte du dialogue
        this.dialogueText = this.scene.add.text(x + 15, y + 35, text, {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Courier New',
            wordWrap: { width: dialogueWidth - 30 }
        }).setScrollFactor(0);

        // Indicateur de continuation
        this.continueText = this.scene.add.text(x + dialogueWidth - 100, y + dialogueHeight - 25, 'Appuyez sur ESPACE', {
            fontSize: '12px',
            color: '#aaaaaa',
            fontFamily: 'Courier New'
        }).setScrollFactor(0);

        this.isDialogueVisible = true;

        // Auto-masquer après 5 secondes
        this.scene.time.delayedCall(5000, () => {
            this.hideDialogue();
        });
    }

    hideDialogue() {
        if (this.dialogueBox) {
            this.dialogueBox.destroy();
            this.dialogueBox = null;
        }
        if (this.dialogueText) {
            this.dialogueText.destroy();
            this.dialogueText = null;
        }
        if (this.nameText) {
            this.nameText.destroy();
            this.nameText = null;
        }
        if (this.continueText) {
            this.continueText.destroy();
            this.continueText = null;
        }
        this.isDialogueVisible = false;
    }

    showSkillUpNotification(skillName, newLevel) {
        const notification = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            100,
            `${skillName} augmenté ! Niveau ${newLevel}`,
            {
                fontSize: '18px',
                color: '#ffeb3b',
                fontFamily: 'Courier New',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setScrollFactor(0);

        // Animation de montée
        this.scene.tweens.add({
            targets: notification,
            y: 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                notification.destroy();
            }
        });
    }

    showFloatingText(x, y, text, color = '#ffffff') {
        // x et y sont déjà en coordonnées du monde, on les utilise directement
        const floatingText = this.scene.add.text(x, y, text, {
            fontSize: '14px',
            color: color,
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Animation de flottement
        this.scene.tweens.add({
            targets: floatingText,
            y: floatingText.y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }

    showMagicSpellLearned(spellName) {
        const spellNotification = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            `Nouveau sort appris !\n${spellName}`,
            {
                fontSize: '20px',
                color: '#9c27b0',
                fontFamily: 'Courier New',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setScrollFactor(0);

        // Effet de particules magiques
        this.createMagicParticles(this.scene.cameras.main.width / 2, this.scene.cameras.main.height / 2);

        // Faire disparaître après 3 secondes
        this.scene.time.delayedCall(3000, () => {
            spellNotification.destroy();
        });
    }

    createMagicParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            const particle = this.scene.add.graphics();
            particle.fillStyle(0x9c27b0);
            particle.fillCircle(0, 0, 3);
            particle.x = x;
            particle.y = y;
            particle.setScrollFactor(0);

            const angle = (i / 10) * Math.PI * 2;
            const targetX = x + Math.cos(angle) * 100;
            const targetY = y + Math.sin(angle) * 100;

            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    showStoryText(text, duration = 4000) {
        const storyText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            50,
            text,
            {
                fontSize: '16px',
                color: '#ffeb3b',
                fontFamily: 'Courier New',
                align: 'center',
                wordWrap: { width: 600 },
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setScrollFactor(0);

        this.scene.time.delayedCall(duration, () => {
            this.scene.tweens.add({
                targets: storyText,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    storyText.destroy();
                }
            });
        });
    }

    isDialogueOpen() {
        return this.isDialogueVisible;
    }

    handleInput(key) {
        if (key === 'SPACE' && this.isDialogueVisible) {
            this.hideDialogue();
            return true;
        }
        return false;
    }
}