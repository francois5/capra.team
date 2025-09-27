// Fichier pour les fonctions CRM

// Charger les informations CRM d'une conversation
async function loadCRMInfo(conversationId) {
  try {
    const response = await axios.get(`${API_URL}/api/crm/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Mettre à jour l'interface avec les informations du client
    document.getElementById('customer-info-content').value = response.data.customerInfo || '';
    document.getElementById('quote-draft-content').value = response.data.quoteDraft || '';
    
    // Montrer le panneau CRM
    document.getElementById('crm-panel').classList.remove('hidden');
    
    return response.data;
  } catch (error) {
    console.error('Error loading CRM info:', error);
    return null;
  }
}

// Sauvegarder les informations de la fiche client
async function saveCustomerInfo(conversationId) {
  try {
    const content = document.getElementById('customer-info-content').value;
    const response = await axios.put(`${API_URL}/api/crm/${conversationId}/customer-info`, 
      { content }, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    showNotification('Fiche client mise à jour avec succès', 'success');
    return true;
  } catch (error) {
    console.error('Error saving customer info:', error);
    showNotification('Erreur lors de la mise à jour de la fiche client', 'error');
    return false;
  }
}

// Sauvegarder le brouillon de devis
async function saveQuoteDraft(conversationId) {
  try {
    const content = document.getElementById('quote-draft-content').value;
    const response = await axios.put(`${API_URL}/api/crm/${conversationId}/quote-draft`, 
      { content }, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    showNotification('Devis mis à jour avec succès', 'success');
    return true;
  } catch (error) {
    console.error('Error saving quote draft:', error);
    showNotification('Erreur lors de la mise à jour du devis', 'error');
    return false;
  }
}

// Demander une mise à jour par IA
async function requestAIUpdate(conversationId, target) {
  try {
    // Afficher un indicateur de chargement et désactiver les éléments appropriés
    let customerInfoEl = document.getElementById('customer-info-content');
    let quoteDraftEl = document.getElementById('quote-draft-content');
    
    if (target === 'customerInfo' || target === 'both') {
      if (customerInfoEl) {
        customerInfoEl.value = 'Mise à jour en cours...';
        customerInfoEl.disabled = true;
      }
    }
    
    if (target === 'quoteDraft' || target === 'both') {
      if (quoteDraftEl) {
        quoteDraftEl.value = 'Mise à jour en cours...';
        quoteDraftEl.disabled = true;
      }
    }
    
    // Obtenir le prompt de l'utilisateur
    let prompt = '';
    if (target === 'customerInfo') {
      prompt = 'Mettre à jour la fiche client avec toutes les informations du client disponibles dans la conversation. Noter le nom, prénom, email, téléphone, ainsi que les besoins exprimés et tout autre détail pertinent sur le client et son projet.';
    } else if (target === 'quoteDraft') {
      prompt = 'Créer ou mettre à jour le devis avec les services et prix mentionnés dans la conversation. Indiquer clairement les services demandés, les quantités/durées, les prix unitaires et le montant total.';
    } else {
      prompt = 'Mettre à jour à la fois la fiche client et le devis avec toutes les informations disponibles dans la conversation. Pour la fiche client, extraire les coordonnées, les besoins exprimés, le budget évoqué, et tout autre détail pertinent sur le client. Pour le devis, lister clairement les services demandés avec leurs prix.';
    }
    
    // Effectuer la requête
    const response = await axios.post(`${API_URL}/api/crm/${conversationId}/ai-update`, 
      { prompt, target }, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    // Mettre à jour l'interface avec les nouvelles données
    if (target === 'customerInfo' || target === 'both') {
      if (customerInfoEl) {
        customerInfoEl.value = response.data.customerInfo;
        customerInfoEl.disabled = false;
      }
    }
    
    if (target === 'quoteDraft' || target === 'both') {
      if (quoteDraftEl) {
        quoteDraftEl.value = response.data.quoteDraft;
        quoteDraftEl.disabled = false;
      }
    }
    
    showNotification('Mise à jour par IA réussie', 'success');
    return true;
  } catch (error) {
    console.error('Error requesting AI update:', error);
    
    // Réactiver les textarea en cas d'erreur
    if (target === 'customerInfo' || target === 'both') {
      const customerInfoEl = document.getElementById('customer-info-content');
      if (customerInfoEl) customerInfoEl.disabled = false;
    }
    
    if (target === 'quoteDraft' || target === 'both') {
      const quoteDraftEl = document.getElementById('quote-draft-content');
      if (quoteDraftEl) quoteDraftEl.disabled = false;
    }
    
    showNotification('Erreur lors de la mise à jour par IA', 'error');
    return false;
  }
}

// Afficher une notification temporaire
function showNotification(message, type = 'info') {
  const container = document.createElement('div');
  container.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
  container.textContent = message;
  
  document.body.appendChild(container);
  
  // Disparition après 3 secondes
  setTimeout(() => {
    container.classList.add('opacity-0', 'transition-opacity', 'duration-500');
    setTimeout(() => {
      document.body.removeChild(container);
    }, 500);
  }, 3000);
}

// Initialisation des écouteurs d'événements pour le CRM
function initCRM() {
  // Écouteurs pour les boutons de sauvegarde
  document.getElementById('save-customer-info').addEventListener('click', () => {
    if (currentConversation) {
      saveCustomerInfo(currentConversation._id);
    }
  });
  
  document.getElementById('save-quote-draft').addEventListener('click', () => {
    if (currentConversation) {
      saveQuoteDraft(currentConversation._id);
    }
  });
  
  // Écouteurs pour les boutons de mise à jour IA
  document.getElementById('ai-update-customer-info').addEventListener('click', () => {
    if (currentConversation) {
      requestAIUpdate(currentConversation._id, 'customerInfo');
    }
  });
  
  document.getElementById('ai-update-quote-draft').addEventListener('click', () => {
    if (currentConversation) {
      requestAIUpdate(currentConversation._id, 'quoteDraft');
    }
  });
  
  // Écouteur pour le bouton de mise à jour globale
  document.getElementById('ai-update-all').addEventListener('click', () => {
    if (currentConversation) {
      requestAIUpdate(currentConversation._id, 'both');
    }
  });
}

// Exporter les fonctions
window.CRM = {
  loadCRMInfo,
  saveCustomerInfo,
  saveQuoteDraft,
  requestAIUpdate,
  initCRM
};