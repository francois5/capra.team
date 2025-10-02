# L'Aventure d'Elian - Générateur d'Aventures Interactives

Un système de jeu interactif "livre dont vous êtes le héros" en HTML/CSS/JS vanille, avec créateur d'aventures intégré.

## 🎮 Structure du Projet

```
aventure-d-elian/
├── index.html           # Page d'accueil
├── play.html            # Interface de jeu
├── creator.html         # Créateur d'aventures
├── preview.html         # Prévisualisation
├── game-engine.js       # Moteur de jeu
├── creator.js           # Logique du créateur
├── data.json            # Aventure complète d'Elian
├── exemple-simple.json  # Exemple d'aventure simple
└── README.md            # Documentation
```

## 🚀 Démarrage Rapide

1. Ouvrez `index.html` dans votre navigateur
2. Choisissez "Jouer une Aventure" ou "Créer une Aventure"

### Jouer
- Sélectionnez une aventure dans la liste
- Ou chargez votre propre fichier JSON
- Profitez de l'aventure !

### Créer
- Ajoutez des scènes avec l'éditeur visuel
- Configurez les choix, combats, énigmes
- Exportez en JSON
- Prévisualisez en temps réel

## 📋 Format JSON

### Structure de Base

```json
{
  "scene_id": {
    "text": "Description de la scène",
    "choices": [
      {
        "text": "Texte du bouton",
        "next": "scene_suivante"
      }
    ]
  }
}
```

### Types d'Actions

#### 1. Navigation Simple
```json
{
  "text": "Aller au nord",
  "next": "scene_nord"
}
```

#### 2. Test de Compétence
```json
{
  "text": "Déverrouiller la porte (Astuce)",
  "skill": "astuce",
  "difficulty": 10,
  "success": "porte_ouverte",
  "failure": "porte_fermee"
}
```

Compétences disponibles : `magie`, `astuce`, `combat`, `foi`

#### 3. Combat
```json
{
  "text": "Combattre le dragon",
  "combat": {
    "enemy": {
      "name": "Dragon Rouge",
      "hp": 15,
      "dice": 2
    },
    "success": "victoire",
    "failure": "defaite"
  }
}
```

#### 4. Énigme
```json
{
  "text": "Résoudre l'énigme",
  "enigma": {
    "question": "Je brûle sans flamme, que suis-je ?",
    "answer": "SOLEIL",
    "value": 74
  },
  "success": "enigme_reussie",
  "failure": "enigme_ratee"
}
```

**Note:** La valeur est calculée ainsi : A=1, B=2, C=3... Z=26 (somme des lettres)

#### 5. Jet Opposé
```json
{
  "text": "Duel de magie",
  "opposedRoll": {
    "skill": "magie",
    "enemyDice": 2,
    "success": "victoire_duel",
    "failure": "defaite_duel"
  }
}
```

## 🎲 Système de Jeu

### Personnage par Défaut
```json
{
  "nom": "Elian",
  "pv": 24,
  "pvMax": 24,
  "mana": 10,
  "manaMax": 10,
  "tresor": 10,
  "domaines": {
    "astuce": 1,
    "combat": 1,
    "foi": 1,
    "magie": 2
  },
  "talents": [],
  "inventaire": []
}
```

### Lancers de Dés
- Chaque test = 1 dé de base + dés de compétence
- Dé à 6 faces (d6)
- Exemple : Magie 2 = 3 dés au total

### Combat
- Tours alternés jusqu'à victoire/défaite
- Dégâts = différence entre les jets
- PV à 0 = défaite

## 🛠️ Fonctionnalités Avancées

### Conditions
```json
{
  "text": "Utiliser le sort (coûte 2 mana)",
  "conditions": [
    {
      "statMinimum": "mana",
      "valeur": 2
    }
  ],
  "next": "scene_sort"
}
```

### Notes et État
```json
{
  "actions": [
    {
      "AjouteNote": "cle_trouvee",
      "statut": "true"
    }
  ]
}
```

### Inventaire
```json
{
  "text": "Prendre l'épée",
  "gain": {
    "inventory": ["Épée magique"]
  },
  "next": "scene_suivante"
}
```

## 📦 Déploiement Statique

Le projet est 100% statique, sans dépendances backend.

### Hébergement Simple
1. Uploadez tous les fichiers sur votre hébergeur
2. Accédez à `index.html`

### GitHub Pages
```bash
git add .
git commit -m "Deploy adventure game"
git push origin main
```
Activez GitHub Pages dans les paramètres du repo.

### Autres Options
- Netlify (drag & drop le dossier)
- Vercel
- Firebase Hosting
- Any static host

## 🎨 Personnalisation

### Styles
Modifiez les classes Tailwind dans les fichiers HTML ou ajoutez du CSS personnalisé.

### Système de Jeu
Éditez `game-engine.js` pour modifier :
- Stats de départ
- Système de combat
- Calcul des jets
- Gestion de l'inventaire

## 📄 Licence

Ce projet est libre d'utilisation pour créer vos propres aventures !

## 🤝 Contribution

N'hésitez pas à modifier et améliorer le système selon vos besoins.

## 🐛 Support

Pour tout problème, vérifiez :
1. La console JavaScript (F12)
2. Le format de votre JSON
3. Les IDs de scènes correspondent bien

## 🎯 Exemples d'Utilisation

### Aventure Fantastique
Utilisez `magie` et `foi` comme compétences principales.

### Aventure Urbaine
Renommez les domaines : `technologie`, `charisme`, `force`, `intelligence`

### Aventure Sci-Fi
Adaptez le vocabulaire et les descriptions, le système reste identique.

---

**Amusez-vous à créer vos aventures ! 🎲✨**
