class NPC extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, npcType) {
        const spriteKey = `npc-${npcType}`;
        super(scene, x, y, spriteKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.npcType = npcType;
        this.body.setSize(24, 24);
        this.body.setOffset(4, 4);
        this.body.setImmovable(true);

        // Propriétés du NPC
        this.name = this.getName(npcType);
        this.dialogues = this.getDialogues(npcType);
        this.currentDialogue = 0;
        this.interactionCooldown = false;

        // État du NPC
        this.isInteracting = false;
        this.mood = 'neutral'; // neutral, happy, angry, scared

        // Commerce (pour les marchands)
        this.shop = this.getShopInventory(npcType);

        // IA simple
        this.aiTimer = 0;
        this.aiInterval = 3000; // 3 secondes
        this.originalX = x;
        this.originalY = y;
        this.wanderRadius = 64;

        this.setupBehavior();
    }

    getName(type) {
        const names = {
            'guard': 'Garde Roland',
            'merchant': 'Marchand Aldric',
            'wizard': 'Mage Elara',
            'blacksmith': 'Forgeron Bram'
        };
        return names[type] || 'PNJ Inconnu';
    }

    getDialogues(type) {
        const dialogues = {
            'guard': [
                "Halt! Qui va là?",
                "Ces oubliettes sont dangereuses, soyez prudent.",
                "J'ai entendu des bruits étranges dans les profondeurs...",
                "Restez sur vos gardes, aventurier."
            ],
            'merchant': [
                "Bienvenue dans ma boutique!",
                "J'ai des objets rares à vous proposer.",
                "Mes prix sont honnêtes, je vous assure!",
                "Avez-vous trouvé des trésors intéressants?",
                "Revenez me voir quand vous voulez!"
            ],
            'wizard': [
                "Les énergies magiques sont perturbées ici...",
                "Je peux vous enseigner quelques sorts simples.",
                "Attention aux créatures magiques dans ces lieux!",
                "La magie ancienne imprègne ces murs..."
            ],
            'blacksmith': [
                "Besoin d'armes ou d'armures?",
                "Je peux améliorer votre équipement!",
                "Mon enclume chante jour et nuit.",
                "Apportez-moi des minerais et je vous forgerai merveilles!"
            ]
        };
        return dialogues[type] || ["Bonjour, aventurier."];
    }

    getShopInventory(type) {
        const shops = {
            'merchant': [
                { name: 'Potion de soin', price: 10, type: 'consumable', quantity: 5 },
                { name: 'Antidote', price: 15, type: 'consumable', quantity: 3 },
                { name: 'Corde', price: 5, type: 'tool', quantity: 1 }
            ],
            'blacksmith': [
                { name: 'Épée longue', price: 50, type: 'weapon', quantity: 1 },
                { name: 'Bouclier de fer', price: 35, type: 'armor', quantity: 1 },
                { name: 'Casque', price: 25, type: 'armor', quantity: 2 }
            ]
        };
        return shops[type] || [];
    }

    setupBehavior() {
        // Comportement spécifique selon le type
        switch (this.npcType) {
            case 'guard':
                this.setTint(0xffffff);
                break;
            case 'merchant':
                // Animation de marche sur place
                this.scene.time.addEvent({
                    delay: 2000,
                    callback: () => {
                        if (!this.isInteracting) {
                            this.setFlipX(!this.flipX);
                        }
                    },
                    loop: true
                });
                break;
        }
    }

    update(time, delta) {
        // IA simple - errance occasionnelle
        if (!this.isInteracting && this.npcType === 'merchant') {
            this.aiTimer += delta;
            if (this.aiTimer >= this.aiInterval) {
                this.wander();
                this.aiTimer = 0;
            }
        }
    }

    wander() {
        // Mouvement aléatoire dans un rayon limité
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.wanderRadius;
        const targetX = this.originalX + Math.cos(angle) * distance;
        const targetY = this.originalY + Math.sin(angle) * distance;

        // Vérifier si la position est valide
        if (this.scene.dungeonGenerator && this.scene.dungeonGenerator.isWalkable(targetX, targetY)) {
            this.scene.tweens.add({
                targets: this,
                x: targetX,
                y: targetY,
                duration: 2000,
                ease: 'Power2'
            });
        }
    }

    interact(player) {
        if (this.interactionCooldown) return;

        this.isInteracting = true;
        this.interactionCooldown = true;

        // Regarder vers le joueur
        if (player.x < this.x) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }

        // Afficher le dialogue
        this.showDialogue();

        // Actions spécifiques selon le type
        switch (this.npcType) {
            case 'merchant':
                this.offerTrade(player);
                break;
            case 'wizard':
                this.offerMagic(player);
                break;
            case 'blacksmith':
                this.offerCrafting(player);
                break;
        }

        // Réinitialiser le cooldown
        this.scene.time.delayedCall(1000, () => {
            this.interactionCooldown = false;
            this.isInteracting = false;
        });
    }

    showDialogue() {
        const dialogue = this.dialogues[this.currentDialogue];
        console.log(`${this.name}: ${dialogue}`);

        // Faire défiler les dialogues
        this.currentDialogue = (this.currentDialogue + 1) % this.dialogues.length;

        // TODO: Afficher dans l'UI du jeu
        if (this.scene.ui) {
            this.scene.ui.showDialogue(this.name, dialogue);
        }

        // Effet visuel de dialogue
        this.showSpeechBubble(dialogue);
    }

    showSpeechBubble(text) {
        // Créer une bulle de dialogue temporaire
        const bubble = this.scene.add.graphics();
        const bubbleWidth = Math.min(200, text.length * 8 + 20);
        const bubbleHeight = 40;

        bubble.fillStyle(0x000000, 0.8);
        bubble.fillRoundedRect(this.x - bubbleWidth/2, this.y - 50, bubbleWidth, bubbleHeight, 5);

        bubble.lineStyle(2, 0xffffff);
        bubble.strokeRoundedRect(this.x - bubbleWidth/2, this.y - 50, bubbleWidth, bubbleHeight, 5);

        const bubbleText = this.scene.add.text(this.x, this.y - 30, text, {
            fontSize: '12px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: bubbleWidth - 10 }
        }).setOrigin(0.5);

        // Faire disparaître la bulle après 3 secondes
        this.scene.time.delayedCall(3000, () => {
            bubble.destroy();
            bubbleText.destroy();
        });
    }

    offerTrade(player) {
        if (this.shop.length === 0) return;

        console.log(`${this.name} vous propose:`);
        this.shop.forEach(item => {
            console.log(`- ${item.name}: ${item.price} or`);
        });

        // TODO: Ouvrir l'interface de commerce
    }

    offerMagic(player) {
        console.log(`${this.name} vous enseigne un sort de base!`);
        // TODO: Système de magie
    }

    offerCrafting(player) {
        console.log(`${this.name} peut améliorer votre équipement!`);
        // TODO: Système de craft
    }

    takeDamage(amount) {
        // Les NPCs peuvent être attaqués
        this.mood = 'scared';
        this.setTint(0xff0000);

        this.scene.time.delayedCall(200, () => {
            this.clearTint();
            this.mood = 'angry';
        });

        // Dialogue de peur/colère
        const angryDialogues = [
            "Arrêtez!",
            "Garde! À l'aide!",
            "Vous êtes fou!",
            "Je vais appeler les gardes!"
        ];

        const dialogue = angryDialogues[Math.floor(Math.random() * angryDialogues.length)];
        this.showSpeechBubble(dialogue);
    }

    getInteractionRange() {
        return 40; // Portée d'interaction
    }

    isInInteractionRange(player) {
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            player.x, player.y
        );
        return distance <= this.getInteractionRange();
    }

    destroy() {
        super.destroy();
    }
}