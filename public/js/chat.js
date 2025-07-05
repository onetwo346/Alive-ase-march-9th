/**
 * Ase - Bab3yini: The Living Flame
 * Chat Management Module
 */

// Global chat namespace
window.AseChat = {
  
  // Chat state
  state: {
    currentChatId: null,
    conversationHistory: [],
    conversations: [],
    isProcessing: false,
    lastMessageId: null,
    retryCount: 0,
    maxRetries: 3
  },

  // Configuration
  config: {
    maxContextLength: 20,
    maxMessageLength: 1000,
    typingDelay: 1000,
    retryDelay: 1000,
    apiEndpoint: '/api/chat',
    healthEndpoint: '/api/health'
  },

  /**
   * Initialize chat module
   */
  init() {
    try {
      this.loadConversations();
      this.setupPeriodicSave();
      this.checkServerHealth();
      this.detectUserIP();
      this.initializeFirstChat();
    } catch (error) {
      console.error('Chat initialization failed:', error);
    }
  },

  /**
   * Load conversations from storage
   */
  loadConversations() {
    this.state.conversations = AseStorage.getConversations();
    this.updateChatList();
    
    // Load last active chat
    const lastChatId = AseStorage.getLastChatId();
    if (lastChatId && this.state.conversations.find(c => c.id === lastChatId)) {
      this.loadChat(lastChatId);
    }
  },

  /**
   * Setup periodic auto-save
   */
  setupPeriodicSave() {
    setInterval(() => {
      if (this.state.currentChatId) {
        this.saveCurrentChat();
      }
    }, 30000); // Save every 30 seconds
  },

  /**
   * Check server health
   */
  async checkServerHealth() {
    try {
      const response = await fetch(this.config.healthEndpoint);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Server health check passed:', data.status);
      } else {
        throw new Error('Server health check failed');
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      AseUI.showToast('Server connection issue detected', 'warning');
    }
  },

  /**
   * Detect user IP for session tracking
   */
  async detectUserIP() {
    try {
      const currentIP = await AseUtils.getUserIP();
      const storedIP = AseStorage.getUserIP();
      
      if (currentIP && currentIP !== storedIP) {
        AseStorage.setUserIP(currentIP);
        // Optionally reset session on IP change
        // this.resetSession(true);
      }
    } catch (error) {
      console.error('IP detection failed:', error);
    }
  },

  /**
   * Initialize first chat if none exists
   */
  initializeFirstChat() {
    if (this.state.conversations.length === 0) {
      this.newChat();
    } else if (!this.state.currentChatId) {
      // Load most recent chat
      const mostRecent = this.state.conversations.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )[0];
      this.loadChat(mostRecent.id);
    }
  },

  /**
   * Create new chat
   */
  newChat() {
    const newChat = {
      id: AseUtils.generateId(),
      title: 'New Conversation',
      preview: 'A new flame ignites...',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      wordCount: 0,
      messageCount: 0
    };

    this.state.conversations.unshift(newChat);
    this.loadChat(newChat.id);
    
    // Welcome message
    const settings = AseStorage.getSettings();
    const welcomeMessage = `${settings.name} awakens anew—the flame dances with anticipation. What wisdom do you seek?`;
    this.addMessage('ase', welcomeMessage, false);
    
    this.updateChatList();
    AseUI.closeSidebar();
    AseUI.showToast('New conversation started', 'success');
  },

  /**
   * Load specific chat
   * @param {string} chatId - Chat ID to load
   */
  loadChat(chatId) {
    const chat = this.state.conversations.find(c => c.id === chatId);
    if (!chat) {
      AseUI.showToast('Chat not found', 'error');
      return;
    }

    this.state.currentChatId = chatId;
    this.state.conversationHistory = [...chat.messages];
    
    // Clear current messages and load chat messages
    AseUI.clearChatMessages();
    
    if (chat.messages.length > 0) {
      chat.messages.forEach(message => {
        this.addMessage(message.role, message.content, false);
      });
    }

    // Update UI
    this.updateChatList();
    AseStorage.setLastChatId(chatId);
    
    // Update title if available
    if (chat.title !== 'New Conversation') {
      document.title = `${chat.title} - Ase`;
    }
  },

  /**
   * Add message to chat
   * @param {string} sender - Message sender (user/ase)
   * @param {string} content - Message content
   * @param {boolean} save - Whether to save to storage
   */
  addMessage(sender, content, save = true) {
    const settings = AseStorage.getSettings();
    
    // Add to UI
    AseUI.addMessage(sender, content, {
      fontSize: settings.fontSize
    });

    // Add to conversation history
    const message = {
      role: sender,
      content: content,
      timestamp: new Date().toISOString(),
      id: AseUtils.generateId()
    };

    this.state.conversationHistory.push(message);
    this.state.lastMessageId = message.id;

    // Save to storage if requested
    if (save && this.state.currentChatId) {
      this.saveCurrentChat();
    }
  },

  /**
   * Send message to AI
   */
  async sendMessage() {
    const userInput = document.getElementById('userInput');
    if (!userInput || this.state.isProcessing) return;

    const message = userInput.value.trim();
    if (!message || !this.state.currentChatId) return;

    if (message.length > this.config.maxMessageLength) {
      AseUI.showToast(`Message too long. Maximum ${this.config.maxMessageLength} characters.`, 'error');
      return;
    }

    // Add user message
    this.addMessage('user', message);
    userInput.value = '';
    
    // Update UI state
    this.state.isProcessing = true;
    AseUI.showTypingIndicator();
    AseUI.elements.sendBtn.disabled = true;

    try {
      // Get AI response
      const response = await this.callAI(message);
      
      // Add AI response
      this.addMessage('ase', response);
      
      // Update chat preview
      this.updateChatPreview();
      
      // Reset retry count on success
      this.state.retryCount = 0;
      
    } catch (error) {
      console.error('Send message failed:', error);
      this.handleMessageError(error);
    } finally {
      // Reset UI state
      this.state.isProcessing = false;
      AseUI.hideTypingIndicator();
      AseUI.elements.sendBtn.disabled = false;
      AseUI.elements.userInput.focus();
    }
  },

  /**
   * Call AI API
   * @param {string} message - User message
   * @returns {Promise<string>} AI response
   */
  async callAI(message) {
    const settings = AseStorage.getSettings();
    
    // Prepare conversation context (limit to recent messages)
    const context = this.state.conversationHistory
      .slice(-this.config.maxContextLength)
      .map(msg => ({
        role: msg.role === 'ase' ? 'assistant' : msg.role,
        content: msg.content
      }));

    const requestBody = {
      message: message,
      conversationHistory: context,
      aseState: {
        name: settings.name,
        personality: settings.personality,
        cosmicInsights: settings.cosmicInsights,
        moodAnalysis: settings.moodAnalysis
      }
    };

    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data.response;
  },

  /**
   * Handle message sending errors
   * @param {Error} error - Error that occurred
   */
  handleMessageError(error) {
    let errorMessage = 'The flame flickers in cosmic turbulence. Please try again.';
    
    if (error.message.includes('rate_limit')) {
      errorMessage = 'The flame burns too bright—please wait a moment before trying again.';
    } else if (error.message.includes('insufficient_quota')) {
      errorMessage = 'The cosmic fuel runs low. Please try again later.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Connection to the cosmic realm interrupted. Check your internet connection.';
    }

    // Add error message to chat
    this.addMessage('ase', errorMessage);
    
    // Show toast notification
    AseUI.showToast(errorMessage, 'error');
    
    // Implement retry logic
    if (this.state.retryCount < this.config.maxRetries) {
      this.state.retryCount++;
      setTimeout(() => {
        // Retry functionality could be implemented here
      }, this.config.retryDelay * this.state.retryCount);
    }
  },

  /**
   * Save current chat to storage
   */
  saveCurrentChat() {
    if (!this.state.currentChatId) return;

    const chatIndex = this.state.conversations.findIndex(c => c.id === this.state.currentChatId);
    if (chatIndex === -1) return;

    const chat = this.state.conversations[chatIndex];
    
    // Update chat data
    chat.messages = [...this.state.conversationHistory];
    chat.updatedAt = new Date().toISOString();
    chat.messageCount = chat.messages.length;
    chat.wordCount = chat.messages.reduce((sum, msg) => sum + AseUtils.countWords(msg.content), 0);
    
    // Update preview with last message
    if (chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      chat.preview = AseUtils.truncateText(lastMessage.content, 50);
    }
    
    // Auto-generate title if still default
    if (chat.title === 'New Conversation' && chat.messages.length >= 2) {
      const firstUserMessage = chat.messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        chat.title = AseUtils.truncateText(firstUserMessage.content, 30);
      }
    }

    // Save to storage
    AseStorage.saveConversation(chat);
    
    // Update UI
    this.updateChatList();
  },

  /**
   * Update chat preview
   */
  updateChatPreview() {
    if (!this.state.currentChatId) return;

    const chat = this.state.conversations.find(c => c.id === this.state.currentChatId);
    if (!chat) return;

    const lastMessage = this.state.conversationHistory[this.state.conversationHistory.length - 1];
    if (lastMessage) {
      chat.preview = AseUtils.truncateText(lastMessage.content, 50);
    }
  },

  /**
   * Delete chat
   * @param {string} chatId - Chat ID to delete
   */
  deleteChat(chatId) {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    // Remove from conversations
    this.state.conversations = this.state.conversations.filter(c => c.id !== chatId);
    
    // Delete from storage
    AseStorage.deleteConversation(chatId);
    
    // Handle current chat deletion
    if (this.state.currentChatId === chatId) {
      if (this.state.conversations.length > 0) {
        // Load most recent chat
        const mostRecent = this.state.conversations.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        )[0];
        this.loadChat(mostRecent.id);
      } else {
        // Create new chat if none left
        this.newChat();
      }
    }
    
    this.updateChatList();
    AseUI.showToast('Conversation deleted', 'info');
  },

  /**
   * Pin/unpin chat
   * @param {string} chatId - Chat ID to pin/unpin
   */
  togglePinChat(chatId) {
    const chat = this.state.conversations.find(c => c.id === chatId);
    if (!chat) return;

    chat.pinned = !chat.pinned;
    AseStorage.saveConversation(chat);
    
    this.updateChatList();
    AseUI.showToast(`Conversation ${chat.pinned ? 'pinned' : 'unpinned'}`, 'info');
  },

  /**
   * Clear current chat
   */
  clearCurrentChat() {
    if (!this.state.currentChatId) return;
    
    if (!confirm('Are you sure you want to clear this conversation?')) return;

    // Clear conversation history
    this.state.conversationHistory = [];
    
    // Clear UI
    AseUI.clearChatMessages();
    
    // Add welcome message
    const settings = AseStorage.getSettings();
    const welcomeMessage = `${settings.name} stands ready—the slate is clean, the flame renewed. What shall we explore?`;
    this.addMessage('ase', welcomeMessage);
    
    AseUI.showToast('Conversation cleared', 'info');
  },

  /**
   * Clear all chats
   */
  clearAllChats() {
    if (!confirm('Are you sure you want to delete all conversations? This cannot be undone.')) return;

    // Clear all data
    this.state.conversations = [];
    this.state.currentChatId = null;
    this.state.conversationHistory = [];
    
    // Clear storage
    AseStorage.setConversations([]);
    AseStorage.setLastChatId(null);
    
    // Clear UI
    AseUI.clearChatMessages();
    
    // Create new chat
    this.newChat();
    
    AseUI.showToast('All conversations cleared', 'info');
  },

  /**
   * Export current chat
   */
  exportChat() {
    if (!this.state.currentChatId) {
      AseUI.showToast('No conversation to export', 'error');
      return;
    }

    const chat = this.state.conversations.find(c => c.id === this.state.currentChatId);
    if (!chat) return;

    const settings = AseStorage.getSettings();
    
    // Create export text
    const exportText = [
      `# ${chat.title}`,
      `Exported from ${settings.name} - The Living Flame`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Messages: ${chat.messageCount}`,
      `Words: ${chat.wordCount}`,
      '',
      '---',
      '',
      ...chat.messages.map(msg => {
        const sender = msg.role === 'user' ? 'You' : settings.name;
        const timestamp = new Date(msg.timestamp).toLocaleString();
        return `**${sender}** (${timestamp}):\n${msg.content}\n`;
      })
    ].join('\n');

    // Download file
    const filename = `${chat.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.md`;
    AseUtils.downloadTextFile(exportText, filename, 'text/markdown');
    
    AseUI.showToast('Conversation exported successfully', 'success');
  },

  /**
   * Reset entire session
   */
  resetSession(fromIPChange = false) {
    if (!fromIPChange && !confirm('Are you sure you want to reset your entire session? This will clear all conversations and settings.')) {
      return;
    }

    // Clear all data
    AseStorage.clear();
    
    // Reset state
    this.state.conversations = [];
    this.state.currentChatId = null;
    this.state.conversationHistory = [];
    this.state.isProcessing = false;
    this.state.retryCount = 0;
    
    // Reset UI
    AseUI.clearChatMessages();
    
    // Create new chat
    this.newChat();
    
    // Reload user preferences
    AseUI.loadUserPreferences();
    
    const message = fromIPChange ? 'Session reset due to location change' : 'Session reset successfully';
    AseUI.showToast(message, 'info');
  },

  /**
   * Rename Ase
   */
  renameAse() {
    const renameInput = document.getElementById('renameInput');
    if (!renameInput) return;

    const newName = renameInput.value.trim();
    if (!newName) {
      AseUI.showToast('Please enter a name', 'error');
      return;
    }

    if (newName.length > 50) {
      AseUI.showToast('Name too long (max 50 characters)', 'error');
      return;
    }

    // Update settings
    AseStorage.updateSetting('name', newName);
    
    // Update UI
    const aseTitle = document.getElementById('aseTitle');
    if (aseTitle) {
      aseTitle.textContent = `${newName} - The Living Flame`;
    }
    
    renameInput.value = '';
    renameInput.placeholder = newName;
    
    // Add message about rename
    this.addMessage('ase', `I am now ${newName}—the flame takes new form. How may I serve you?`);
    
    AseUI.closeSidebar();
    AseUI.showToast(`Renamed to ${newName}`, 'success');
  },

  /**
   * Search chats
   * @param {string} query - Search query
   */
  searchChats(query) {
    const filteredChats = this.state.conversations.filter(chat => 
      chat.title.toLowerCase().includes(query.toLowerCase()) ||
      chat.preview.toLowerCase().includes(query.toLowerCase()) ||
      chat.messages.some(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
    );
    
    this.updateChatList(filteredChats);
  },

  /**
   * Update chat list in UI
   * @param {Array} chats - Optional filtered chats array
   */
  updateChatList(chats = null) {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;

    const chatsToShow = chats || this.state.conversations;
    
    // Sort chats: pinned first, then by update time
    const sortedChats = [...chatsToShow].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    chatList.innerHTML = '';

    if (sortedChats.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      emptyDiv.innerHTML = '<p>No conversations found</p>';
      chatList.appendChild(emptyDiv);
      return;
    }

    sortedChats.forEach(chat => {
      const chatItem = document.createElement('div');
      chatItem.className = `chat-item ${chat.id === this.state.currentChatId ? 'active' : ''} ${chat.pinned ? 'pinned' : ''}`;
      
      chatItem.innerHTML = `
        <div class="chat-item-main" onclick="AseChat.loadChat('${chat.id}')">
          <div class="chat-item-title">${AseUtils.truncateText(chat.title, 25)}</div>
          <div class="chat-item-preview">${chat.preview}</div>
          <div class="chat-item-meta">
            <span class="chat-item-time">${AseUtils.formatDate(chat.updatedAt)}</span>
            <span class="chat-item-count">${chat.messageCount} msgs</span>
          </div>
        </div>
        <div class="chat-item-actions">
          <button class="chat-action-btn" onclick="AseChat.togglePinChat('${chat.id}')" title="${chat.pinned ? 'Unpin' : 'Pin'}">
            ${chat.pinned ? '📌' : '📌'}
          </button>
          <button class="chat-action-btn danger" onclick="AseChat.deleteChat('${chat.id}')" title="Delete">
            🗑️
          </button>
        </div>
      `;
      
      chatList.appendChild(chatItem);
    });
  }
};

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  AseChat.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AseChat;
}