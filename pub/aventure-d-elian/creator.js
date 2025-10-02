// Créateur d'aventure pour L'Aventure d'Elian
let adventure = {};
let currentSceneId = null;

// Éléments DOM
const scenesList = document.getElementById('scenes-list');
const addSceneBtn = document.getElementById('add-scene-btn');
const noSceneMessage = document.getElementById('no-scene-message');
const sceneEditor = document.getElementById('scene-editor');
const sceneIdInput = document.getElementById('scene-id');
const sceneTextInput = document.getElementById('scene-text');
const sceneImageInput = document.getElementById('scene-image');
const choicesEditor = document.getElementById('choices-editor');
const addChoiceBtn = document.getElementById('add-choice-btn');
const saveSceneBtn = document.getElementById('save-scene-btn');
const deleteSceneBtn = document.getElementById('delete-scene-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const importJsonBtn = document.getElementById('import-json-btn');
const importFile = document.getElementById('import-file');
const previewBtn = document.getElementById('preview-btn');
const choiceTemplate = document.getElementById('choice-template');

// Initialiser avec une scène par défaut
function init() {
    loadFromLocalStorage();
    if (Object.keys(adventure).length === 0) {
        adventure = {
            start: {
                text: "Bienvenue dans votre aventure ! Modifiez ce texte pour commencer.",
                choices: []
            }
        };
    }
    renderScenesList();
}

// Sauvegarder dans localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('adventureCreator', JSON.stringify(adventure));
    } catch (e) {
        console.error('Erreur de sauvegarde:', e);
    }
}

// Charger depuis localStorage
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('adventureCreator');
        if (saved) {
            adventure = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Erreur de chargement:', e);
    }
}

// Afficher la liste des scènes
function renderScenesList() {
    scenesList.innerHTML = '';
    Object.keys(adventure).forEach(sceneId => {
        const div = document.createElement('div');
        div.className = 'scene-card';
        if (sceneId === currentSceneId) {
            div.classList.add('active');
        }
        div.textContent = sceneId;
        div.onclick = () => selectScene(sceneId);
        scenesList.appendChild(div);
    });
}

// Sélectionner une scène
function selectScene(sceneId) {
    currentSceneId = sceneId;
    renderScenesList();
    loadSceneInEditor(sceneId);
}

// Charger une scène dans l'éditeur
function loadSceneInEditor(sceneId) {
    const scene = adventure[sceneId];
    if (!scene) return;

    noSceneMessage.classList.add('hidden');
    sceneEditor.classList.remove('hidden');

    sceneIdInput.value = sceneId;
    sceneTextInput.value = scene.text || scene.texte || '';
    sceneImageInput.value = scene.imgCouverture || scene.image || '';

    // Charger les choix
    choicesEditor.innerHTML = '';
    const choices = scene.choices || scene.boutons || [];
    choices.forEach(choice => {
        addChoiceToEditor(choice);
    });
}

// Ajouter un choix dans l'éditeur
function addChoiceToEditor(choiceData = null) {
    const clone = choiceTemplate.content.cloneNode(true);
    const choiceDiv = clone.querySelector('.choice-item');

    const textInput = clone.querySelector('.choice-text');
    const actionType = clone.querySelector('.choice-action-type');
    const destination = clone.querySelector('.choice-destination');
    const skillContainer = clone.querySelector('.choice-skill-container');
    const combatContainer = clone.querySelector('.choice-combat-container');
    const enigmaContainer = clone.querySelector('.choice-enigma-container');
    const destinationContainer = clone.querySelector('.choice-destination-container');

    // Remplir avec les données existantes
    if (choiceData) {
        textInput.value = choiceData.text || choiceData.label || '';

        if (choiceData.skill) {
            actionType.value = 'skill';
            skillContainer.classList.remove('hidden');
            destinationContainer.classList.add('hidden');
            clone.querySelector('.choice-skill').value = choiceData.skill;
            clone.querySelector('.choice-difficulty').value = choiceData.difficulty || 8;
            clone.querySelector('.choice-success').value = choiceData.success || '';
            clone.querySelector('.choice-failure').value = choiceData.failure || '';
        } else if (choiceData.combat) {
            actionType.value = 'combat';
            combatContainer.classList.remove('hidden');
            destinationContainer.classList.add('hidden');
            clone.querySelector('.enemy-name').value = choiceData.combat.enemy?.name || '';
            clone.querySelector('.enemy-hp').value = choiceData.combat.enemy?.hp || 6;
            clone.querySelector('.enemy-dice').value = choiceData.combat.enemy?.dice || 1;
            clone.querySelector('.combat-success').value = choiceData.combat.success || '';
            clone.querySelector('.combat-failure').value = choiceData.combat.failure || '';
        } else if (choiceData.enigma) {
            actionType.value = 'enigma';
            enigmaContainer.classList.remove('hidden');
            destinationContainer.classList.add('hidden');
            clone.querySelector('.enigma-question').value = choiceData.enigma.question || '';
            clone.querySelector('.enigma-answer').value = choiceData.enigma.answer || '';
            clone.querySelector('.enigma-value').value = choiceData.enigma.value || 0;
            clone.querySelector('.enigma-success').value = choiceData.success || '';
            clone.querySelector('.enigma-failure').value = choiceData.failure || '';
        } else {
            destination.value = choiceData.next || choiceData.destination || '';
        }
    }

    // Gérer le changement de type d'action
    actionType.addEventListener('change', (e) => {
        skillContainer.classList.add('hidden');
        combatContainer.classList.add('hidden');
        enigmaContainer.classList.add('hidden');
        destinationContainer.classList.remove('hidden');

        if (e.target.value === 'skill') {
            skillContainer.classList.remove('hidden');
            destinationContainer.classList.add('hidden');
        } else if (e.target.value === 'combat') {
            combatContainer.classList.remove('hidden');
            destinationContainer.classList.add('hidden');
        } else if (e.target.value === 'enigma') {
            enigmaContainer.classList.remove('hidden');
            destinationContainer.classList.add('hidden');
        }
    });

    // Bouton supprimer
    clone.querySelector('.remove-choice-btn').addEventListener('click', () => {
        choiceDiv.remove();
    });

    choicesEditor.appendChild(clone);
}

// Sauvegarder la scène actuelle
function saveCurrentScene() {
    const newId = sceneIdInput.value.trim();
    if (!newId) {
        alert('L\'ID de la scène est obligatoire !');
        return;
    }

    // Supprimer l'ancienne scène si l'ID a changé
    if (currentSceneId && currentSceneId !== newId) {
        delete adventure[currentSceneId];
    }

    // Collecter les choix
    const choices = [];
    document.querySelectorAll('.choice-item').forEach(choiceDiv => {
        const actionType = choiceDiv.querySelector('.choice-action-type').value;
        const text = choiceDiv.querySelector('.choice-text').value.trim();

        if (!text) return;

        const choice = { text };

        if (actionType === 'goto') {
            choice.next = choiceDiv.querySelector('.choice-destination').value.trim();
        } else if (actionType === 'skill') {
            choice.skill = choiceDiv.querySelector('.choice-skill').value;
            choice.difficulty = parseInt(choiceDiv.querySelector('.choice-difficulty').value);
            choice.success = choiceDiv.querySelector('.choice-success').value.trim();
            choice.failure = choiceDiv.querySelector('.choice-failure').value.trim();
        } else if (actionType === 'combat') {
            choice.combat = {
                enemy: {
                    name: choiceDiv.querySelector('.enemy-name').value.trim(),
                    hp: parseInt(choiceDiv.querySelector('.enemy-hp').value),
                    dice: parseInt(choiceDiv.querySelector('.enemy-dice').value)
                },
                success: choiceDiv.querySelector('.combat-success').value.trim(),
                failure: choiceDiv.querySelector('.combat-failure').value.trim()
            };
        } else if (actionType === 'enigma') {
            choice.enigma = {
                question: choiceDiv.querySelector('.enigma-question').value.trim(),
                answer: choiceDiv.querySelector('.enigma-answer').value.trim(),
                value: parseInt(choiceDiv.querySelector('.enigma-value').value)
            };
            choice.success = choiceDiv.querySelector('.enigma-success').value.trim();
            choice.failure = choiceDiv.querySelector('.enigma-failure').value.trim();
        }

        choices.push(choice);
    });

    // Créer la scène
    adventure[newId] = {
        text: sceneTextInput.value.trim(),
        choices
    };

    const imageUrl = sceneImageInput.value.trim();
    if (imageUrl) {
        adventure[newId].imgCouverture = imageUrl;
    }

    currentSceneId = newId;
    saveToLocalStorage();
    renderScenesList();
    alert('Scène sauvegardée !');
}

// Supprimer la scène actuelle
function deleteCurrentScene() {
    if (!currentSceneId) return;
    if (!confirm(`Supprimer la scène "${currentSceneId}" ?`)) return;

    delete adventure[currentSceneId];
    currentSceneId = null;
    saveToLocalStorage();
    renderScenesList();

    noSceneMessage.classList.remove('hidden');
    sceneEditor.classList.add('hidden');
}

// Exporter en JSON
function exportJSON() {
    const json = JSON.stringify(adventure, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aventure.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Importer depuis JSON
function importJSON() {
    importFile.click();
}

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            adventure = JSON.parse(e.target.result);
            currentSceneId = null;
            saveToLocalStorage();
            renderScenesList();
            noSceneMessage.classList.remove('hidden');
            sceneEditor.classList.add('hidden');
            alert('Aventure importée avec succès !');
        } catch (error) {
            alert('Erreur lors de l\'import: ' + error.message);
        }
    };
    reader.readAsText(file);
    importFile.value = '';
});

// Prévisualiser
function preview() {
    saveToLocalStorage();
    const json = JSON.stringify(adventure);
    localStorage.setItem('previewAdventure', json);
    window.open('preview.html', '_blank');
}

// Event listeners
addSceneBtn.addEventListener('click', () => {
    const id = prompt('ID de la nouvelle scène:');
    if (!id || !id.trim()) return;
    const sceneId = id.trim();
    if (adventure[sceneId]) {
        alert('Cette scène existe déjà !');
        return;
    }
    adventure[sceneId] = {
        text: '',
        choices: []
    };
    saveToLocalStorage();
    selectScene(sceneId);
});

addChoiceBtn.addEventListener('click', () => {
    addChoiceToEditor();
});

saveSceneBtn.addEventListener('click', saveCurrentScene);
deleteSceneBtn.addEventListener('click', deleteCurrentScene);
exportJsonBtn.addEventListener('click', exportJSON);
importJsonBtn.addEventListener('click', importJSON);
previewBtn.addEventListener('click', preview);

// Initialiser
init();
