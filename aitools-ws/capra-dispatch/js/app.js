// Variables globales
const TEST = false
let API_URL = 'https://api.neutrum.be'; // URL de base de l'API (vide = même serveur, ou mettre l'URL complète pour un autre serveur)
if(TEST)
	API_URL = 'http://localhost:3000';
let bulkSendStatus = {
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  inProgress: false
};
let token = localStorage.getItem('admin_token');
let currentConversation = null;
let globalStats = null;
let currentPage = 'conversations';

// Initialisation de l'application
function initApp() {
  setupEventListeners();
  checkAuth();
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Authentification
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', logout);
  
  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(e.target.dataset.page);
    });
  });
  
  // Sidebar mobile toggle
  document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-close').addEventListener('click', toggleSidebar);
  
  // Actions
  document.getElementById('refresh-btn').addEventListener('click', loadConversations);
  document.getElementById('send-twilio-btn').addEventListener('click', sendTwilioTemplate);
  document.getElementById('toggle-manual-mode').addEventListener('click', toggleManualMode);
  document.getElementById('manual-reply-form').addEventListener('submit', handleManualReply);
  document.getElementById('import-csv-btn').addEventListener('click', () => document.getElementById('csv-file-input').click());
  document.getElementById('csv-file-input').addEventListener('change', handleCSVImport);
  
  // Recherche
  document.getElementById('search-input').addEventListener('input', handleSearch);
}

// Vérifie si l'utilisateur est connecté
function checkAuth() {
  if (token) {
    // S'assurer que l'écran de login est complètement caché
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('dashboard').classList.remove('hidden');
    loadUserInfo();
    loadConversations();
    loadGlobalStats();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('dashboard').classList.add('hidden');
  }
}

// Gestion de la connexion
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginError = document.getElementById('login-error');
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    token = response.data.token;
    localStorage.setItem('admin_token', token);
    loginError.classList.add('hidden');
    checkAuth();
  } catch (error) {
    console.error('Login error:', error);
    loginError.textContent = 'Email ou mot de passe incorrect';
    loginError.classList.remove('hidden');
  }
}

// Déconnexion
function logout() {
  localStorage.removeItem('admin_token');
  token = null;
  checkAuth();
}

// Charger les informations de l'utilisateur
async function loadUserInfo() {
  try {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    document.getElementById('user-email').textContent = response.data.email;
    
    // Charger les statistiques utilisateur
    const statsResponse = await axios.get(`${API_URL}/api/auth/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const userStats = statsResponse.data.stats;
    document.getElementById('user-conversation-count').textContent = userStats.conversationsViewed || 0;
    document.getElementById('user-message-count').textContent = userStats.messagesRead || 0;
    document.getElementById('user-replies-count').textContent = userStats.manualResponsesSent || 0;
  } catch (error) {
    console.error('Error loading user info:', error);
    if (error.response && error.response.status === 401) {
      logout();
    }
  }
}

// Charger les statistiques globales
async function loadGlobalStats() {
  try {
    const response = await axios.get(`${API_URL}/api/conversations/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Vérifier si nous avons des données
    if (!response.data) {
      console.error('Réponse de statistiques vide');
      return;
    }
    
    globalStats = response.data;
    
    // Mettre à jour les statistiques dans l'UI avec vérification des valeurs nulles ou undefined
    document.getElementById('total-conversations').textContent = globalStats.totalConversations || 0;
    document.getElementById('total-messages').textContent = globalStats.totalMessages || 0;
    document.getElementById('active-today').textContent = globalStats.activeToday || 0;
    
    const responseTime = globalStats.globalAverageResponseTime;
    let formattedTime = 'N/A';
    
    if (responseTime) {
      if (responseTime < 60000) {
        formattedTime = `${Math.round(responseTime / 1000)} secondes`;
      } else if (responseTime < 3600000) {
        formattedTime = `${Math.round(responseTime / 60000)} minutes`;
      } else {
        formattedTime = `${Math.round(responseTime / 3600000)} heures`;
      }
    }
    
    document.getElementById('avg-response-time').textContent = formattedTime;
    
    // Afficher le top 5 des conversations
    const topConversationsEl = document.getElementById('top-conversations');
    topConversationsEl.innerHTML = '';
    
    // Vérifier si topConversations existe et n'est pas vide
    if (globalStats.topConversations && Array.isArray(globalStats.topConversations) && 
        globalStats.topConversations.length > 0) {
      
      globalStats.topConversations.forEach(conv => {
        if (conv && conv.fname && conv.lname) {  // Vérifier que l'objet est valide
          const liEl = document.createElement('li');
          liEl.className = 'mb-2 flex justify-between items-center';
          
          // Accéder prudemment aux valeurs
          const totalMessages = conv.stats && conv.stats.totalMessages ? conv.stats.totalMessages : 0;
          
          liEl.innerHTML = `
            <span class="text-sm">${conv.fname} ${conv.lname}</span>
            <span class="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full">${totalMessages} messages</span>
          `;
          
          // Ajouter un événement click pour charger la conversation
          if (conv._id) {
            liEl.addEventListener('click', () => {
              loadConversationDetails(conv._id);
              navigateTo('conversations');
            });
          }
          
          topConversationsEl.appendChild(liEl);
        }
      });
    } else {
      topConversationsEl.innerHTML = '<li class="text-center text-gray-500">Aucune donnée disponible</li>';
    }
    
  } catch (error) {
    console.error('Error loading global stats:', error);
    
    // Afficher un message d'erreur dans l'UI
    const statsContainers = [
      'total-conversations', 'total-messages', 'active-today', 'avg-response-time'
    ];
    
    statsContainers.forEach(id => {
      document.getElementById(id).textContent = 'Erreur';
    });
    
    document.getElementById('top-conversations').innerHTML = 
      '<li class="text-center text-red-500">Erreur lors du chargement des statistiques</li>';
  }
}

// Charger toutes les conversations
async function loadConversations() {
  try {
    const conversationsContainer = document.getElementById('conversations-list');
    conversationsContainer.innerHTML = '<div class="loader"></div>';
    
    // Réinitialiser la position de défilement
    conversationsContainer.scrollTop = 0;
    
    const response = await axios.get(`${API_URL}/api/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    conversationsContainer.innerHTML = '';
    
    // Vérifier si la réponse est dans le nouveau format (avec pagination)
    const conversationsData = response.data.data || response.data;
    
    if (!Array.isArray(conversationsData) || conversationsData.length === 0) {
      conversationsContainer.innerHTML = '<div class="p-4 text-center text-gray-500">Aucune conversation trouvée</div>';
      return;
    }
    
    conversationsData.forEach(conversation => {
      const lastMessage = conversation.messages && conversation.messages.length > 0 
        ? conversation.messages[conversation.messages.length - 1].content 
        : 'Aucun message';
      
      const lastMessageTime = conversation.messages && conversation.messages.length > 0 
        ? new Date(conversation.messages[conversation.messages.length - 1].timestamp).toLocaleString() 
        : new Date(conversation.createdAt).toLocaleString();
      
      const hasUnread = conversation.messages && conversation.messages.some(message => !message.read && message.sender === 'contact');
      
      const conversationEl = document.createElement('div');
      conversationEl.className = `conversation p-3 border-b ${hasUnread ? 'font-bold' : ''}`;
      conversationEl.dataset.id = conversation._id;
      
      // Statistiques pour la conversation
      const stats = conversation.stats || {};
      const messagesCount = stats.totalMessages || (conversation.messages ? conversation.messages.length : 0) || 0;
      const lastActive = stats.lastActiveDate ? new Date(stats.lastActiveDate).toLocaleDateString() : 'Inconnu';
      
      // Calculer le temps de réponse moyen formaté
      let avgResponseTime = 'N/A';
      if (stats.averageResponseTime) {
        if (stats.averageResponseTime < 60000) {
          avgResponseTime = `${Math.round(stats.averageResponseTime / 1000)}s`;
        } else if (stats.averageResponseTime < 3600000) {
          avgResponseTime = `${Math.round(stats.averageResponseTime / 60000)}m`;
        } else {
          avgResponseTime = `${Math.round(stats.averageResponseTime / 3600000)}h`;
        }
      }
      
      conversationEl.innerHTML = `
        <div class="flex justify-between items-start">
          <div class="flex items-center">
            <span class="status-badge ${hasUnread ? 'status-unread' : conversation.manualMode ? 'status-manual' : 'status-online'}"></span>
            <h3 class="font-medium">${conversation.fname} ${conversation.lname}</h3>
          </div>
          <span class="text-xs text-gray-500">${lastMessageTime}</span>
        </div>
        <p class="text-sm text-gray-600 truncate">${lastMessage}</p>
        <div class="flex justify-between mt-1">
          <p class="text-xs text-gray-500">${conversation.tel}</p>
          <div class="flex space-x-2">
            <span class="conversation-tag bg-gray-100 text-gray-600">${messagesCount} msgs</span>
            <span class="conversation-tag bg-blue-100 text-blue-600">~${avgResponseTime}</span>
          </div>
        </div>
      `;
      
      conversationEl.addEventListener('click', () => loadConversationDetails(conversation._id));
      conversationsContainer.appendChild(conversationEl);
      
      // Rendre l'élément visible
      conversationsContainer.style.display = 'block';
    });
    
    // Afficher les informations de pagination si disponibles
    if (response.data.pagination) {
      const { total, page, pages } = response.data.pagination;
      if (pages > 1) {
        const paginationEl = document.createElement('div');
        paginationEl.className = 'pagination flex justify-center mt-4 p-2 sticky bottom-0 bg-white border-t';
        paginationEl.innerHTML = `
          <div class="text-sm text-gray-500">
            Page ${page} sur ${pages} (${total} conversations)
          </div>
        `;
        conversationsContainer.appendChild(paginationEl);
        
        // Assurer que le conteneur de conversations défile correctement
        setTimeout(() => {
          conversationsContainer.scrollTop = 0;
        }, 100);
      }
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
    const conversationsContainer = document.getElementById('conversations-list');
    conversationsContainer.innerHTML = '<div class="p-4 text-center text-red-500">Erreur lors du chargement des conversations</div>';
    
    if (error.response && error.response.status === 401) {
      logout();
    }
  }
}

// Charger les détails d'une conversation
async function loadConversationDetails(conversationId) {
  try {
    // Highlight selected conversation
    document.querySelectorAll('.conversation').forEach(el => {
      el.classList.remove('active');
      if (el.dataset.id === conversationId) {
        el.classList.add('active');
      }
    });
    
    // Sur mobile, fermer le sidebar
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    
    const response = await axios.get(`${API_URL}/api/conversations/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    currentConversation = response.data;
    
    // Show conversation details
    document.getElementById('conversation-details').classList.remove('hidden');
    document.getElementById('no-conversation-selected').classList.add('hidden');
    document.getElementById('messages-container').classList.remove('hidden');
    document.getElementById('manual-reply-container').classList.remove('hidden');
    
    // Cacher le panneau CRM
    document.getElementById('crm-panel').classList.add('hidden');
    
    // Afficher le nom du contact avec un bouton d'édition
    document.getElementById('conversation-name').innerHTML = `
      <span id="contact-name-display">${currentConversation.fname} ${currentConversation.lname}</span>
      <button id="edit-contact-name" class="ml-2 text-gray-500 hover:text-blue-500" title="Modifier le nom">
        <i class="fas fa-edit text-xs"></i>
      </button>
    `;
    
    // Ajouter un gestionnaire d'événement pour l'édition du nom
    document.getElementById('edit-contact-name').addEventListener('click', () => {
      editContactName(currentConversation);
    });
    
    document.getElementById('conversation-tel').textContent = currentConversation.tel;
    
    // Mettre à jour l'affichage du mode manuel
    updateManualModeDisplay(currentConversation.manualMode || false);
    
    // Afficher les statistiques de la conversation
    const stats = currentConversation.stats || {};
    
    // Formater le temps de réponse moyen
    let avgResponseTime = 'N/A';
    if (stats.averageResponseTime) {
      if (stats.averageResponseTime < 60000) {
        avgResponseTime = `${Math.round(stats.averageResponseTime / 1000)} secondes`;
      } else if (stats.averageResponseTime < 3600000) {
        avgResponseTime = `${Math.round(stats.averageResponseTime / 60000)} minutes`;
      } else {
        avgResponseTime = `${Math.round(stats.averageResponseTime / 3600000)} heures`;
      }
    }
    
    document.getElementById('conversation-stats').innerHTML = `
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="bg-gray-50 p-2 rounded">
          <span class="text-gray-500">Total messages:</span>
          <span class="font-medium">${stats.totalMessages || currentConversation.messages.length || 0}</span>
        </div>
        <div class="bg-gray-50 p-2 rounded">
          <span class="text-gray-500">Msgs/jour:</span>
          <span class="font-medium">${stats.messagesPerDay || 'N/A'}</span>
        </div>
        <div class="bg-gray-50 p-2 rounded">
          <span class="text-gray-500">Temps réponse:</span>
          <span class="font-medium">${avgResponseTime}</span>
        </div>
        <div class="bg-gray-50 p-2 rounded">
          <span class="text-gray-500">Dernier contact:</span>
          <span class="font-medium">${stats.lastContactMessage ? new Date(stats.lastContactMessage).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    `;
    
    // Mark messages as read
    markMessagesAsRead(conversationId);
    
    // Display messages
    displayMessages(currentConversation.messages);
  } catch (error) {
    console.error('Error loading conversation details:', error);
    
    if (error.response && error.response.status === 401) {
      logout();
    }
  }
}

// Mettre à jour l'affichage du mode manuel/auto
function updateManualModeDisplay(isManual) {
  const statusElement = document.getElementById('manual-mode-status');
  const indicatorElement = document.getElementById('manual-mode-indicator');
  
  if (isManual) {
    statusElement.textContent = 'Mode manuel';
    indicatorElement.classList.remove('bg-green-500');
    indicatorElement.classList.add('bg-red-500');
  } else {
    statusElement.textContent = 'Mode auto';
    indicatorElement.classList.remove('bg-red-500');
    indicatorElement.classList.add('bg-green-500');
  }
}

// Afficher les messages dans le conteneur
function displayMessages(messages) {
  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.innerHTML = '';
  
  if (messages.length === 0) {
    messagesContainer.innerHTML = '<div class="p-4 text-center text-gray-500">Aucun message dans cette conversation</div>';
    return;
  }
  
  // Grouper les messages par date
  let currentDate = null;
  
  messages.forEach(message => {
    const messageDate = new Date(message.timestamp);
    const formattedDate = messageDate.toLocaleDateString();
    
    // Ajouter un séparateur de date si nécessaire
    if (formattedDate !== currentDate) {
      currentDate = formattedDate;
      const dateEl = document.createElement('div');
      dateEl.className = 'text-center my-4';
      dateEl.innerHTML = `<span class="inline-block px-4 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">${formattedDate}</span>`;
      messagesContainer.appendChild(dateEl);
    }
    
    const isAssistant = message.sender === 'assistant' || message.sender === 'capra';
    const messageEl = document.createElement('div');
    messageEl.className = `mb-4 ${isAssistant ? 'text-right' : ''}`;
    
    const bubbleClass = isAssistant 
      ? 'bg-blue-500 text-white rounded-lg rounded-br-none' 
      : 'bg-gray-200 text-gray-800 rounded-lg rounded-bl-none';
    
    const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageEl.innerHTML = `
      <div class="inline-block max-w-xs md:max-w-md px-4 py-2 ${bubbleClass}">
        <p>${message.content}</p>
        <p class="text-xs mt-1 ${isAssistant ? 'text-blue-100' : 'text-gray-500'}">
          ${formattedTime}
        </p>
      </div>
    `;
    
    messagesContainer.appendChild(messageEl);
  });
  
  // Scroll to bottom of messages
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);
}

// Marquer les messages comme lus
async function markMessagesAsRead(conversationId) {
  try {
    const response = await axios.post(`${API_URL}/api/conversations/${conversationId}/mark-read`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Marked messages as read:', response.data);
    
    // Mettre à jour l'affichage visuel
    document.querySelector(`.conversation[data-id="${conversationId}"]`)?.classList.remove('font-bold');
    const indicator = document.querySelector(`.conversation[data-id="${conversationId}"] .status-badge`);
    if (indicator && indicator.classList.contains('status-unread')) {
      indicator.classList.remove('status-unread');
      indicator.classList.add(currentConversation.manualMode ? 'status-manual' : 'status-online');
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Envoyer un template Twilio
async function sendTwilioTemplate() {
  const phoneNumber = document.getElementById('twilio-phone').value.trim();
  const twilioMessage = document.getElementById('twilio-message');
  
  if (!phoneNumber) {
    twilioMessage.textContent = 'Veuillez entrer un numéro de téléphone';
    twilioMessage.classList.remove('hidden', 'text-green-500');
    twilioMessage.classList.add('text-red-500');
    return;
  }
  
  try {
    twilioMessage.textContent = 'Envoi en cours...';
    twilioMessage.classList.remove('hidden', 'text-red-500', 'text-green-500');
    twilioMessage.classList.add('text-blue-500');
    
    const response = await axios.get(`${API_URL}/api/conversations/send-template/${phoneNumber}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    twilioMessage.textContent = 'Template envoyé avec succès!';
    twilioMessage.classList.remove('hidden', 'text-red-500', 'text-blue-500');
    twilioMessage.classList.add('text-green-500');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      twilioMessage.classList.add('hidden');
    }, 3000);
    
    // Recharger les conversations après un délai pour voir la nouvelle
    setTimeout(() => {
      loadConversations();
    }, 1000);
  } catch (error) {
    console.error('Error sending Twilio template:', error);
    twilioMessage.textContent = 'Erreur lors de l\'envoi du template';
    twilioMessage.classList.remove('hidden', 'text-green-500', 'text-blue-500');
    twilioMessage.classList.add('text-red-500');
  }
}

// Toggle le mode manuel
async function toggleManualMode() {
  if (!currentConversation) return;
  
  try {
    const response = await axios.post(`${API_URL}/api/conversations/${currentConversation._id}/toggle-manual-mode`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const { manualMode } = response.data;
    updateManualModeDisplay(manualMode);
    currentConversation.manualMode = manualMode;
    
    // Mettre à jour le status badge dans la liste des conversations
    const indicator = document.querySelector(`.conversation[data-id="${currentConversation._id}"] .status-badge`);
    if (indicator) {
      indicator.classList.remove('status-online', 'status-manual');
      indicator.classList.add(manualMode ? 'status-manual' : 'status-online');
    }
    
    // Afficher un message de notification
    const messagesContainer = document.getElementById('messages-container');
    const notificationEl = document.createElement('div');
    notificationEl.className = 'mb-4 text-center';
    notificationEl.innerHTML = `
      <div class="inline-block max-w-md px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
        <p>${manualMode ? 'Mode manuel activé : L\'IA ne répondra plus automatiquement.' : 'Mode automatique activé : L\'IA répondra automatiquement.'}</p>
      </div>
    `;
    messagesContainer.appendChild(notificationEl);
    
    // Scroll to bottom with a slight delay
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  } catch (error) {
    console.error('Error toggling manual mode:', error);
  }
}

// Gère l'envoi d'une réponse manuelle
async function handleManualReply(e) {
  e.preventDefault();
  
  if (!currentConversation) return;
  
  const content = document.getElementById('manual-reply-content').value.trim();
  if (!content) return;
  
  try {
    const response = await axios.post(`${API_URL}/api/conversations/${currentConversation._id}/manual-reply`, 
      { content }, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    // Ajouter le message à l'affichage
    const { newMessage } = response.data;
    const messagesContainer = document.getElementById('messages-container');
    
    const messageEl = document.createElement('div');
    messageEl.className = 'mb-4 text-right';
    messageEl.innerHTML = `
      <div class="inline-block max-w-md px-4 py-2 bg-blue-500 text-white rounded-lg rounded-br-none">
        <p>${newMessage.content}</p>
        <p class="text-xs mt-1 text-blue-100">
          ${new Date(newMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <span class="ml-2 font-bold">[Manuel]</span>
        </p>
      </div>
    `;
    
    messagesContainer.appendChild(messageEl);
    
    // Scroll to bottom with a slight delay
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
    
    // Réinitialiser le formulaire
    document.getElementById('manual-reply-content').value = '';
    
    // Mettre à jour les statistiques locales
    if (response.data.stats) {
      currentConversation.stats = response.data.stats;
      
      // Mettre à jour l'affichage des statistiques
      const stats = currentConversation.stats;
      
      let avgResponseTime = 'N/A';
      if (stats.averageResponseTime) {
        if (stats.averageResponseTime < 60000) {
          avgResponseTime = `${Math.round(stats.averageResponseTime / 1000)} secondes`;
        } else if (stats.averageResponseTime < 3600000) {
          avgResponseTime = `${Math.round(stats.averageResponseTime / 60000)} minutes`;
        } else {
          avgResponseTime = `${Math.round(stats.averageResponseTime / 3600000)} heures`;
        }
      }
      
      document.getElementById('conversation-stats').innerHTML = `
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="bg-gray-50 p-2 rounded">
            <span class="text-gray-500">Total messages:</span>
            <span class="font-medium">${stats.totalMessages || 0}</span>
          </div>
          <div class="bg-gray-50 p-2 rounded">
            <span class="text-gray-500">Msgs/jour:</span>
            <span class="font-medium">${stats.messagesPerDay || 'N/A'}</span>
          </div>
          <div class="bg-gray-50 p-2 rounded">
            <span class="text-gray-500">Temps réponse:</span>
            <span class="font-medium">${avgResponseTime}</span>
          </div>
          <div class="bg-gray-50 p-2 rounded">
            <span class="text-gray-500">Dernier contact:</span>
            <span class="font-medium">${stats.lastContactMessage ? new Date(stats.lastContactMessage).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      `;
    }
    
    // Mettre à jour les statistiques de l'utilisateur
    loadUserInfo();
  } catch (error) {
    console.error('Error sending manual reply:', error);
  }
}

// Gère l'import de fichier CSV
async function handleCSVImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Vérifier que c'est bien un fichier CSV
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    alert('Veuillez sélectionner un fichier CSV valide.');
    e.target.value = '';
    return;
  }
  
  // Préparer l'affichage de la progression
  const bulkProgress = document.getElementById('bulk-progress');
  const bulkProgressBar = document.getElementById('bulk-progress-bar');
  const bulkProgressText = document.getElementById('bulk-progress-text');
  
  bulkSendStatus = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    inProgress: true
  };
  
  bulkProgress.classList.remove('hidden');
  
  try {
    const formData = new FormData();
    formData.append('csvFile', file);
    
    const response = await axios.post(`${API_URL}/api/conversations/bulk-send-template`, 
      formData, 
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          // Afficher la progression de l'upload
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          bulkProgressBar.style.width = `${percentCompleted}%`;
          bulkProgressText.textContent = 'Téléchargement en cours...';
        }
      }
    );
    
    // Traiter la réponse
    const result = response.data;
    
    bulkSendStatus = {
      total: result.total || 0,
      totalInFile: result.totalInFile || result.total || 0,
      processed: result.total || 0,
      successful: result.successful || 0,
      failed: result.failed || 0,
      limitApplied: result.limitApplied || false,
      processingTime: result.processingTime || '-',
      inProgress: false
    };
    
    // Mettre à jour l'interface
    bulkProgressBar.style.width = '100%';
    bulkProgressText.textContent = `${bulkSendStatus.successful}/${bulkSendStatus.total} envoyés`;
    
    // Afficher un résumé
    const twilioMessage = document.getElementById('twilio-message');
    let messageText = `Envoi terminé: ${bulkSendStatus.successful} réussis, ${bulkSendStatus.failed} échoués sur ${bulkSendStatus.total} traités`;
    
    // Si une limite a été appliquée, le mentionner
    if (bulkSendStatus.limitApplied && bulkSendStatus.totalInFile > bulkSendStatus.total) {
      messageText += ` (${bulkSendStatus.total}/${bulkSendStatus.totalInFile} du fichier)`;
    }
    
    // Ajouter le temps de traitement
    if (bulkSendStatus.processingTime) {
      messageText += ` - Temps: ${bulkSendStatus.processingTime}`;
    }
    
    twilioMessage.textContent = messageText;
    twilioMessage.classList.remove('hidden', 'text-blue-500');
    twilioMessage.classList.add(bulkSendStatus.failed > 0 ? 'text-red-500' : 'text-green-500');
    
    // Si des erreurs sont présentes dans la réponse, les afficher
    if (result.errors && result.errors.length > 0) {
      const errorDetails = result.errors.map(err => 
        `${err.entity} (${err.phoneNumber}): ${err.error}`
      ).join('\n');
      console.error('Erreurs d\'envoi:', errorDetails);
    }
    
    // Cacher la barre de progression après un délai
    setTimeout(() => {
      bulkProgress.classList.add('hidden');
    }, 3000);
    
    // Recharger les conversations après un délai
    setTimeout(() => {
      loadConversations();
    }, 2000);
    
  } catch (error) {
    console.error('Error importing CSV file:', error);
    
    // Mise à jour de l'interface en cas d'erreur
    bulkProgressBar.style.width = '0%';
    bulkSendStatus.inProgress = false;
    
    const twilioMessage = document.getElementById('twilio-message');
    twilioMessage.textContent = 'Erreur lors de l\'import du fichier CSV';
    twilioMessage.classList.remove('hidden', 'text-green-500', 'text-blue-500');
    twilioMessage.classList.add('text-red-500');
    
    // Cacher la barre de progression
    setTimeout(() => {
      bulkProgress.classList.add('hidden');
    }, 3000);
  }
  
  // Réinitialiser l'input file
  e.target.value = '';
}

// Gestion de la recherche
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  const conversationElements = document.querySelectorAll('.conversation');
  
  conversationElements.forEach(el => {
    const text = el.textContent.toLowerCase();
    if (searchTerm === '' || text.includes(searchTerm)) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

// Navigation entre les pages
function navigateTo(page) {
  const pages = document.querySelectorAll('.content-page');
  const navLinks = document.querySelectorAll('.nav-link');
  
  pages.forEach(p => {
    p.classList.add('hidden');
  });
  
  navLinks.forEach(link => {
    link.classList.remove('text-blue-500', 'font-medium');
    link.classList.add('text-gray-500');
  });
  
  document.getElementById(`${page}-page`).classList.remove('hidden');
  document.querySelector(`.nav-link[data-page="${page}"]`).classList.remove('text-gray-500');
  document.querySelector(`.nav-link[data-page="${page}"]`).classList.add('text-blue-500', 'font-medium');
  
  currentPage = page;
  
  // Si on navigue vers la page de statistiques, rafraîchir les stats
  if (page === 'stats') {
    loadGlobalStats();
  }
}

// Toggle le sidebar sur mobile
function toggleSidebar() {
  const sidebar = document.querySelector('.conversation-sidebar');
  sidebar.classList.toggle('open');
}

// Fonction pour éditer le nom et prénom du contact
function editContactName(conversation) {
  // Créer la boîte de dialogue modale
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
  modal.id = 'edit-name-modal';
  
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 w-96 mx-4">
      <h3 class="text-lg font-semibold mb-4">Modifier les informations de contact</h3>
      <form id="edit-contact-form">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="edit-fname">Prénom</label>
          <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            id="edit-fname" type="text" value="${conversation.fname || ''}">
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="edit-lname">Nom</label>
          <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            id="edit-lname" type="text" value="${conversation.lname || ''}">
        </div>
        <div class="flex justify-end space-x-3">
          <button type="button" id="cancel-edit-name" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
            Annuler
          </button>
          <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  `;
  
  // Ajouter la modale au document
  document.body.appendChild(modal);
  
  // Focus sur le premier champ
  document.getElementById('edit-fname').focus();
  
  // Gestionnaire d'événement pour fermer la modale
  document.getElementById('cancel-edit-name').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Gestionnaire d'événement pour le formulaire
  document.getElementById('edit-contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fname = document.getElementById('edit-fname').value.trim();
    const lname = document.getElementById('edit-lname').value.trim();
    
    if (!fname && !lname) {
      return; // Ne rien faire si les deux champs sont vides
    }
    
    try {
      const response = await axios.put(`${API_URL}/api/conversations/${conversation._id}/contact-info`, 
        { fname, lname }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Mettre à jour les informations localement
      currentConversation.fname = response.data.fname;
      currentConversation.lname = response.data.lname;
      
      // Mettre à jour l'affichage
      document.getElementById('contact-name-display').textContent = `${currentConversation.fname} ${currentConversation.lname}`;
      
      // Mettre à jour l'élément dans la liste des conversations
      const conversationEl = document.querySelector(`.conversation[data-id="${conversation._id}"]`);
      if (conversationEl) {
        const nameEl = conversationEl.querySelector('h3');
        if (nameEl) {
          nameEl.textContent = `${currentConversation.fname} ${currentConversation.lname}`;
        }
      }
      
      // Afficher une notification de succès
      showNotification('Informations de contact mises à jour', 'success');
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contact:', error);
      showNotification('Erreur lors de la mise à jour du contact', 'error');
    }
    
    // Fermer la modale
    document.body.removeChild(modal);
  });
}

// Initialiser les gestionnaires d'événements CRM
function setupCRMEventListeners() {
  // Bouton pour afficher le panneau CRM
  document.getElementById('show-crm-button').addEventListener('click', () => {
    if (currentConversation) {
      // Charger les données CRM
      CRM.loadCRMInfo(currentConversation._id);
    }
  });
  
  // Bouton pour fermer le panneau CRM
  document.getElementById('close-crm-button').addEventListener('click', () => {
    document.getElementById('crm-panel').classList.add('hidden');
  });
  
  // Initialiser les autres écouteurs d'événements du CRM
  CRM.initCRM();
}

// Initialiser l'application au chargement
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupCRMEventListeners();
});
