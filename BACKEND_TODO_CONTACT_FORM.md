# Backend Implementation Request - Contact Form Email Endpoint

## Context
Le site web Capra (https://capra.team) possède un formulaire de contact qui doit envoyer des emails. Le frontend vient d'être mis à jour pour utiliser une nouvelle route API dédiée.

## Task Required
Implémenter un endpoint API Node.js pour gérer l'envoi d'emails depuis le formulaire de contact.

## Technical Specifications

### Endpoint Details
- **URL**: `https://api.neutrum.be/send-contact-email`
- **Method**: POST
- **Content-Type**: application/json

### Request Body
```json
{
  "name": "string",
  "email": "string",
  "message": "string"
}
```

### Expected Behavior
1. Recevoir les 3 paramètres (name, email, message)
2. Valider les données (vérifier que tous les champs sont présents et non vides, valider le format de l'email)
3. Envoyer un email à `francois@capra.team` avec:
   - **Subject**: "📧 Nouveau message de contact Capra - [name]"
   - **Body**: Formaté proprement avec les informations:
     ```
     Nouveau message de contact reçu via capra.team

     Nom: [name]
     Email: [email]

     Message:
     [message]

     ---
     Envoyé le [date/heure]
     ```
4. Retourner une réponse appropriée:
   - **Success (200)**: `{"success": true, "message": "Email sent successfully"}`
   - **Error (400/500)**: `{"success": false, "error": "Error message"}`

### CORS Configuration
L'endpoint doit accepter les requêtes depuis `https://capra.team` (CORS headers nécessaires).

### Email Service
Utiliser le service d'envoi d'email déjà configuré dans votre API (probablement Nodemailer ou un service similaire).

### Error Handling
- Valider tous les champs requis
- Gérer les erreurs d'envoi d'email
- Logger les erreurs pour le debugging
- Retourner des messages d'erreur clairs

## Integration Notes
- Cette route fait partie de l'API Neutrum existante (api.neutrum.be)
- Le frontend est déjà configuré et attend cette route
- L'email de destination est: `francois@capra.team`

## Testing
Après implémentation, tester avec:
```bash
curl -X POST https://api.neutrum.be/send-contact-email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Test message"}'
```

## Priority
Cette fonctionnalité est nécessaire pour que le formulaire de contact du site fonctionne correctement.

Merci de bien vouloir implémenter cette route dans l'API Node.js !
