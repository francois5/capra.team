// Moteur de jeu pour L'Aventure d'Elian
let gameData = {};
let gameState = {
    currentScene: "start",
    character: {
        nom: "Elian",
        pv: 24,
        pvMax: 24,
        mana: 10,
        manaMax: 10,
        tresor: 10,
        domaines: {
            astuce: 1,
            combat: 1,
            foi: 1,
            magie: 2
        },
        talents: [],
        inventaire: []
    },
    notes: {}
};

let currentCombat = null;

// Éléments DOM
const storyTextElement = document.getElementById("story-text");
const choicesContainer = document.getElementById("choices-container");
const statsContainer = document.getElementById("character-stats");
const messageBox = document.getElementById("message-box");
const playerHPDisplay = document.getElementById("player-hp-display");
const playerHPBar = document.getElementById("player-hp-bar");
const playerHPText = document.getElementById("player-hp-text");
const combatSection = document.getElementById("combat-section");
const combatTitle = document.getElementById("combat-title");
const enemyName = document.getElementById("enemy-name");
const enemyHPBar = document.getElementById("enemy-hp-bar");
const enemyHPText = document.getElementById("enemy-hp-text");
const combatLog = document.getElementById("combat-log");
const combatActionBtn = document.getElementById("combat-action-btn");

// Initialiser le jeu avec des données d'aventure
function initGame(adventureData) {
    gameData = adventureData;

    // Réinitialiser l'état
    const savedState = loadGameState();
    if (savedState) {
        gameState = savedState;
    } else {
        resetGameState();
    }

    renderScene(gameState.currentScene);
}

// Réinitialiser l'état du jeu
function resetGameState() {
    gameState = {
        currentScene: "start",
        character: {
            nom: "Elian",
            pv: 24,
            pvMax: 24,
            mana: 10,
            manaMax: 10,
            tresor: 10,
            domaines: {
                astuce: 1,
                combat: 1,
                foi: 1,
                magie: 2
            },
            talents: [],
            inventaire: []
        },
        notes: {}
    };
    saveGameState();
}

// Sauvegarder l'état
function saveGameState() {
    try {
        localStorage.setItem('elianGameState', JSON.stringify(gameState));
    } catch (e) {
        console.error('Erreur de sauvegarde:', e);
    }
}

// Charger l'état
function loadGameState() {
    try {
        const saved = localStorage.getItem('elianGameState');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error('Erreur de chargement:', e);
        return null;
    }
}

// Réinitialiser le jeu
function resetGame() {
    resetGameState();
    renderScene(gameState.currentScene);
}

// Mettre à jour l'affichage des stats
function updateStatsDisplay() {
    const char = gameState.character;

    statsContainer.innerHTML = `
        <div class="p-2 bg-gray-700 rounded-lg">
            <p class="font-semibold text-green-400">Magie</p>
            <p>${char.domaines.magie} dés</p>
        </div>
        <div class="p-2 bg-gray-700 rounded-lg">
            <p class="font-semibold text-green-400">Astuce</p>
            <p>${char.domaines.astuce} dés</p>
        </div>
        <div class="p-2 bg-gray-700 rounded-lg">
            <p class="font-semibold text-green-400">Combat</p>
            <p>${char.domaines.combat} dés</p>
        </div>
        <div class="p-2 bg-gray-700 rounded-lg">
            <p class="font-semibold text-green-400">Foi</p>
            <p>${char.domaines.foi} dés</p>
        </div>
    `;

    if (char.inventaire.length > 0) {
        statsContainer.innerHTML += `
            <div class="col-span-2 sm:col-span-4 p-2 bg-gray-700 rounded-lg">
                <p class="font-semibold text-green-400">Inventaire</p>
                <p>${char.inventaire.map(i => i.nom || i).join(', ')}</p>
            </div>
        `;
    }

    statsContainer.classList.remove('hidden');
    playerHPDisplay.classList.remove('hidden');

    const hpPercent = (char.pv / char.pvMax) * 100;
    playerHPBar.style.width = `${hpPercent}%`;
    playerHPText.textContent = `${char.pv} / ${char.pvMax}`;
}

// Afficher un message
function showMessage(text, isSuccess = true) {
    messageBox.textContent = text;
    messageBox.className = `fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-xl transition-opacity duration-300 opacity-100 text-white ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`;

    setTimeout(() => {
        messageBox.classList.add('opacity-0');
        setTimeout(() => messageBox.classList.add('hidden'), 300);
    }, 3000);
}

// Lancer des dés
function rollDice(numDice) {
    let total = 0;
    let rolls = [];
    for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        rolls.push(roll);
        total += roll;
    }
    return { total, rolls };
}

// Calculer la valeur d'un mot (pour les énigmes)
function calculateWordValue(word) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let sum = 0;
    for (let char of word.toUpperCase()) {
        const index = letters.indexOf(char);
        if (index !== -1) sum += index + 1;
    }
    return sum;
}

// Gérer les actions d'un paragraphe
function executeActions(actions) {
    if (!actions) return;

    actions.forEach(action => {
        if (action.ajuste) {
            // Ajuster une statistique
            const stat = action.stat;
            const value = parseInt(action.valeur);
            if (stat === "pv") gameState.character.pv += value;
            else if (stat === "mana") gameState.character.mana += value;
            else if (stat === "tresor") gameState.character.tresor += value;
        } else if (action["note+"]) {
            // Créer ou modifier une note
            gameState.notes[action["note+"]] = { ...action };
        } else if (action.AjouteNote) {
            // Ajouter une note simple
            gameState.notes[action.AjouteNote] = { statut: action.statut };
        }
    });
}

// Vérifier les conditions
function checkConditions(conditions) {
    if (!conditions) return true;

    return conditions.every(cond => {
        if (cond.note) {
            const note = gameState.notes[cond.note];
            if (!note) return cond.statut === "false";
            return note.statut === cond.statut;
        }
        if (cond.statMinimum) {
            const stat = cond.statMinimum;
            const value = parseInt(cond.valeur);
            if (stat === "mana") return gameState.character.mana >= value;
            if (stat === "pv") return gameState.character.pv >= value;
        }
        return true;
    });
}

// Démarrer un combat
function startCombat(combatData) {
    const enemy = combatData.enemy;
    const playerBonusDice = combatData.playerBonusDice || 0;

    currentCombat = {
        enemy: {
            name: enemy.name,
            hp: enemy.hp,
            maxHP: enemy.hp,
            dice: enemy.dice || 1,
            skill: enemy.skill || "combat"
        },
        playerBonusDice,
        success: combatData.success,
        failure: combatData.failure
    };

    combatSection.classList.remove("hidden");
    storyTextElement.classList.add("hidden");
    choicesContainer.classList.add("hidden");

    combatTitle.textContent = `Combat contre ${enemy.name}`;
    enemyName.textContent = enemy.name;
    combatLog.innerHTML = '';

    updateCombatDisplay();
    addCombatLog(`Combat contre ${enemy.name} !`);

    combatActionBtn.onclick = runCombatRound;
}

// Mettre à jour l'affichage du combat
function updateCombatDisplay() {
    const char = gameState.character;
    const enemy = currentCombat.enemy;

    const playerPercent = (char.pv / char.pvMax) * 100;
    playerHPBar.style.width = `${playerPercent}%`;
    playerHPText.textContent = `${char.pv} / ${char.pvMax}`;

    const enemyPercent = (enemy.hp / enemy.maxHP) * 100;
    enemyHPBar.style.width = `${enemyPercent}%`;
    enemyHPText.textContent = `${enemy.hp} / ${enemy.maxHP}`;
}

// Ajouter un log de combat
function addCombatLog(message) {
    const p = document.createElement('p');
    p.textContent = message;
    p.className = 'mb-1';
    combatLog.prepend(p);
}

// Exécuter un round de combat
function runCombatRound() {
    combatActionBtn.disabled = true;

    const char = gameState.character;
    const enemy = currentCombat.enemy;

    const playerDice = char.domaines.combat + 1 + currentCombat.playerBonusDice;
    const enemyDice = enemy.dice + 1;

    const playerRoll = rollDice(playerDice);
    const enemyRoll = rollDice(enemyDice);

    addCombatLog(`Vous: ${playerRoll.rolls.join('+')} = ${playerRoll.total}`);
    addCombatLog(`${enemy.name}: ${enemyRoll.rolls.join('+')} = ${enemyRoll.total}`);

    if (playerRoll.total > enemyRoll.total) {
        const damage = playerRoll.total - enemyRoll.total;
        enemy.hp -= damage;
        addCombatLog(`→ Vous infligez ${damage} dégâts !`);
    } else if (enemyRoll.total > playerRoll.total) {
        const damage = enemyRoll.total - playerRoll.total;
        char.pv -= damage;
        addCombatLog(`→ Vous subissez ${damage} dégâts !`);
    } else {
        addCombatLog(`→ Égalité !`);
    }

    updateCombatDisplay();

    if (char.pv <= 0) {
        addCombatLog('Vous êtes vaincu...');
        setTimeout(() => {
            combatSection.classList.add('hidden');
            renderScene(currentCombat.failure);
        }, 2000);
    } else if (enemy.hp <= 0) {
        addCombatLog(`${enemy.name} est vaincu !`);
        setTimeout(() => {
            combatSection.classList.add('hidden');
            renderScene(currentCombat.success);
        }, 2000);
    } else {
        combatActionBtn.disabled = false;
    }
}

// Gérer un jet opposé
function handleOpposedRoll(rollData) {
    const char = gameState.character;
    const skill = rollData.skill;
    const playerDice = char.domaines[skill] + 1;
    const enemyDice = rollData.enemyDice + 1;

    const playerRoll = rollDice(playerDice);
    const enemyRoll = rollDice(enemyDice);

    const success = playerRoll.total > enemyRoll.total;
    const result = `Vous: ${playerRoll.rolls.join('+')} = ${playerRoll.total} | Adversaire: ${enemyRoll.rolls.join('+')} = ${enemyRoll.total}`;

    showMessage(success ? `Succès ! ${result}` : `Échec... ${result}`, success);

    setTimeout(() => {
        renderScene(success ? rollData.success : rollData.failure);
    }, 1500);
}

// Afficher une scène
function renderScene(sceneId) {
    const scene = gameData[sceneId];
    if (!scene) {
        console.error('Scène introuvable:', sceneId);
        return;
    }

    gameState.currentScene = sceneId;
    saveGameState();
    updateStatsDisplay();

    // Cacher le combat si visible
    combatSection.classList.add('hidden');
    storyTextElement.classList.remove('hidden');
    choicesContainer.classList.remove('hidden');

    // Exécuter les actions de la scène
    if (scene.actions) {
        executeActions(scene.actions);
    }

    // Afficher le texte
    let text = scene.text || scene.texte || '';
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    storyTextElement.innerHTML = text;

    // Afficher les choix
    choicesContainer.innerHTML = '';

    if (!scene.choices || !scene.boutons) {
        const choices = scene.choices || scene.boutons || [];

        choices.forEach(choice => {
            // Vérifier les conditions
            if (choice.conditions && !checkConditions(choice.conditions)) {
                return;
            }

            const button = document.createElement('button');
            button.className = 'btn';
            button.textContent = choice.text || choice.label;

            button.onclick = () => handleChoice(choice);
            choicesContainer.appendChild(button);
        });
    }

    // Gérer les énigmes
    if (scene.choices && scene.choices.some(c => c.enigma)) {
        const enigmaChoice = scene.choices.find(c => c.enigma);
        const enigma = enigmaChoice.enigma;

        choicesContainer.innerHTML = `
            <div class="p-4 bg-gray-800 rounded-xl">
                <p class="mb-4"><strong>Énigme:</strong> ${enigma.question}</p>
                <input type="text" id="enigma-input" placeholder="Votre réponse..."
                       class="w-full p-3 rounded-lg text-gray-900 bg-gray-100 border border-gray-300 mb-4">
                <button id="enigma-submit" class="btn w-full">Soumettre</button>
            </div>
        `;

        document.getElementById('enigma-submit').onclick = () => {
            const input = document.getElementById('enigma-input').value;
            const value = calculateWordValue(input);
            const correct = input.toUpperCase() === enigma.answer.toUpperCase() && value === enigma.value;

            showMessage(correct ? `Correct ! "${input}" = ${value}` : 'Incorrect...', correct);
            setTimeout(() => {
                renderScene(correct ? enigmaChoice.success : enigmaChoice.failure);
            }, 1500);
        };
    }
}

// Gérer un choix
function handleChoice(choice) {
    // Gérer les gains
    if (choice.gain) {
        if (choice.gain.inventory) {
            choice.gain.inventory.forEach(item => {
                gameState.character.inventaire.push({ nom: item });
            });
        }
    }

    // Gérer les tests de compétence
    if (choice.skill) {
        const skills = Array.isArray(choice.skill) ? choice.skill : [choice.skill];
        const difficulties = Array.isArray(choice.difficulty) ? choice.difficulty : [choice.difficulty];

        let success = false;
        let results = [];

        skills.forEach((skill, i) => {
            const dice = gameState.character.domaines[skill] + 1;
            const roll = rollDice(dice);
            const diff = difficulties[i];
            const passed = roll.total >= diff;

            results.push(`${skill}: ${roll.rolls.join('+')} = ${roll.total} (seuil: ${diff})`);
            if (passed) success = true;
        });

        showMessage((success ? 'Succès ! ' : 'Échec... ') + results.join(' | '), success);

        setTimeout(() => {
            renderScene(success ? choice.success : choice.failure);
        }, 1500);
        return;
    }

    // Gérer les combats
    if (choice.combat) {
        startCombat(choice.combat);
        return;
    }

    // Gérer les jets opposés
    if (choice.opposedRoll) {
        handleOpposedRoll(choice.opposedRoll);
        return;
    }

    // Navigation simple
    if (choice.next || choice.destination) {
        renderScene(choice.next || choice.destination);
    }
}
