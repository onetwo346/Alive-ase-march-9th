/**
 * Ase - Bab3yini: The Living Flame
 * Storage Management Module
 */

// Global storage namespace
window.AseStorage = {
  
  // Storage keys
  KEYS: {
    CONVERSATIONS: 'ase_conversations',
    SETTINGS: 'ase_settings',
    USER_IP: 'ase_user_ip',
    THEME: 'ase_theme',
    FONT_SIZE: 'ase_font_size',
    PERSONALITY: 'ase_personality',
    COSMIC_INSIGHTS: 'ase_cosmic_insights',
    MOOD_ANALYSIS: 'ase_mood_analysis',
    LAST_CHAT_ID: 'ase_last_chat_id',
    APP_VERSION: 'ase_app_version'
  },

  // Current app version for migration purposes
  APP_VERSION: '2.0.0',

  /**
   * Initialize storage and perform any necessary migrations
   */
  init() {
    try {
      this.performMigrations();
      this.cleanupOldData();
    } catch (error) {
      console.error('Storage initialization failed:', error);
    }
  },

  /**
   * Perform data migrations if needed
   */
  performMigrations() {
    const storedVersion = this.getItem(this.KEYS.APP_VERSION);
    
    if (!storedVersion || storedVersion !== this.APP_VERSION) {
      // Migrate from old version
      this.migrateFromOldVersion();
      this.setItem(this.KEYS.APP_VERSION, this.APP_VERSION);
    }
  },

  /**
   * Migrate data from old version
   */
  migrateFromOldVersion() {
    try {
      // Migrate old conversations format
      const oldConversations = this.getItem('aseConversations');
      if (oldConversations && !this.getItem(this.KEYS.CONVERSATIONS)) {
        const migratedConversations = oldConversations.map(conv => ({
          ...conv,
          id: conv.id || AseUtils.generateId(),
          createdAt: conv.timestamp || new Date().toISOString(),
          updatedAt: conv.timestamp || new Date().toISOString(),
          wordCount: conv.messages ? conv.messages.reduce((sum, msg) => sum + AseUtils.countWords(msg.content), 0) : 0
        }));
        
        this.setItem(this.KEYS.CONVERSATIONS, migratedConversations);
        this.removeItem('aseConversations');
      }

      // Migrate old settings
      const oldTheme = this.getItem('aseTheme');
      const oldFontSize = this.getItem('aseFontSize');
      const oldPersonality = this.getItem('asePersonality');
      
      if (oldTheme || oldFontSize || oldPersonality) {
        const settings = this.getSettings();
        if (oldTheme) settings.theme = oldTheme;
        if (oldFontSize) settings.fontSize = parseInt(oldFontSize);
        if (oldPersonality) settings.personality = oldPersonality;
        
        this.setSettings(settings);
        
        // Clean up old keys
        this.removeItem('aseTheme');
        this.removeItem('aseFontSize');
        this.removeItem('asePersonality');
      }

      // Migrate old user IP
      const oldUserIP = this.getItem('userIP');
      if (oldUserIP) {
        this.setItem(this.KEYS.USER_IP, oldUserIP);
        this.removeItem('userIP');
      }

    } catch (error) {
      console.error('Migration failed:', error);
    }
  },

  /**
   * Clean up old or corrupted data
   */
  cleanupOldData() {
    try {
      // Remove any keys that don't match our current schema
      const validKeys = Object.values(this.KEYS);
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (key.startsWith('ase_') && !validKeys.includes(key)) {
          this.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  },

  /**
   * Get item from storage with error handling
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Stored value or default
   */
  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * Set item in storage with error handling
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      this.handleStorageError(error);
      return false;
    }
  },

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all storage
   * @returns {boolean} Success status
   */
  clear() {
    try {
      // Only clear our app's keys
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  },

  /**
   * Handle storage errors (quota exceeded, etc.)
   * @param {Error} error - Storage error
   */
  handleStorageError(error) {
    if (error.name === 'QuotaExceededError') {
      // Try to free up space by removing old conversations
      this.cleanupOldConversations();
    }
  },

  /**
   * Clean up old conversations to free storage space
   */
  cleanupOldConversations() {
    try {
      const conversations = this.getConversations();
      
      if (conversations.length > 50) {
        // Keep only the 50 most recent conversations
        const sorted = conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const toKeep = sorted.slice(0, 50);
        this.setConversations(toKeep);
      }
    } catch (error) {
      console.error('Failed to cleanup conversations:', error);
    }
  },

  /**
   * Get all conversations
   * @returns {Array} Array of conversations
   */
  getConversations() {
    return this.getItem(this.KEYS.CONVERSATIONS, []);
  },

  /**
   * Set conversations
   * @param {Array} conversations - Array of conversations
   * @returns {boolean} Success status
   */
  setConversations(conversations) {
    return this.setItem(this.KEYS.CONVERSATIONS, conversations);
  },

  /**
   * Get conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Object|null} Conversation or null
   */
  getConversation(id) {
    const conversations = this.getConversations();
    return conversations.find(conv => conv.id === id) || null;
  },

  /**
   * Add or update conversation
   * @param {Object} conversation - Conversation object
   * @returns {boolean} Success status
   */
  saveConversation(conversation) {
    try {
      const conversations = this.getConversations();
      const existingIndex = conversations.findIndex(conv => conv.id === conversation.id);
      
      // Update timestamps
      conversation.updatedAt = new Date().toISOString();
      if (!conversation.createdAt) {
        conversation.createdAt = conversation.updatedAt;
      }
      
      // Update word count
      if (conversation.messages) {
        conversation.wordCount = conversation.messages.reduce((sum, msg) => sum + AseUtils.countWords(msg.content), 0);
      }
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.push(conversation);
      }
      
      return this.setConversations(conversations);
    } catch (error) {
      console.error('Failed to save conversation:', error);
      return false;
    }
  },

  /**
   * Delete conversation
   * @param {string} id - Conversation ID
   * @returns {boolean} Success status
   */
  deleteConversation(id) {
    try {
      const conversations = this.getConversations();
      const filtered = conversations.filter(conv => conv.id !== id);
      return this.setConversations(filtered);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  },

  /**
   * Get application settings
   * @returns {Object} Settings object
   */
  getSettings() {
    return this.getItem(this.KEYS.SETTINGS, {
      name: 'Ase (Bab3yini)',
      theme: 'dark',
      fontSize: 16,
      personality: 'default',
      cosmicInsights: true,
      moodAnalysis: false,
      autoSave: true,
      soundEnabled: true,
      notifications: true
    });
  },

  /**
   * Set application settings
   * @param {Object} settings - Settings object
   * @returns {boolean} Success status
   */
  setSettings(settings) {
    return this.setItem(this.KEYS.SETTINGS, settings);
  },

  /**
   * Update specific setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {boolean} Success status
   */
  updateSetting(key, value) {
    try {
      const settings = this.getSettings();
      settings[key] = value;
      return this.setSettings(settings);
    } catch (error) {
      console.error('Failed to update setting:', error);
      return false;
    }
  },

  /**
   * Get user IP
   * @returns {string|null} User IP or null
   */
  getUserIP() {
    return this.getItem(this.KEYS.USER_IP);
  },

  /**
   * Set user IP
   * @param {string} ip - User IP
   * @returns {boolean} Success status
   */
  setUserIP(ip) {
    return this.setItem(this.KEYS.USER_IP, ip);
  },

  /**
   * Get last active chat ID
   * @returns {string|null} Last chat ID or null
   */
  getLastChatId() {
    return this.getItem(this.KEYS.LAST_CHAT_ID);
  },

  /**
   * Set last active chat ID
   * @param {string} id - Chat ID
   * @returns {boolean} Success status
   */
  setLastChatId(id) {
    return this.setItem(this.KEYS.LAST_CHAT_ID, id);
  },

  /**
   * Export all data for backup
   * @returns {Object} Exported data
   */
  exportData() {
    try {
      const data = {
        version: this.APP_VERSION,
        exportedAt: new Date().toISOString(),
        conversations: this.getConversations(),
        settings: this.getSettings(),
        userIP: this.getUserIP(),
        lastChatId: this.getLastChatId()
      };
      
      return data;
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  },

  /**
   * Import data from backup
   * @param {Object} data - Data to import
   * @returns {boolean} Success status
   */
  importData(data) {
    try {
      if (!data || !data.version) {
        throw new Error('Invalid data format');
      }
      
      // Validate data structure
      if (data.conversations && Array.isArray(data.conversations)) {
        this.setConversations(data.conversations);
      }
      
      if (data.settings && typeof data.settings === 'object') {
        this.setSettings(data.settings);
      }
      
      if (data.userIP) {
        this.setUserIP(data.userIP);
      }
      
      if (data.lastChatId) {
        this.setLastChatId(data.lastChatId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  },

  /**
   * Get storage usage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    try {
      const stats = {
        totalSize: 0,
        conversationCount: 0,
        messageCount: 0,
        availableSpace: 0
      };
      
      // Calculate total size
      Object.values(this.KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          stats.totalSize += item.length;
        }
      });
      
      // Count conversations and messages
      const conversations = this.getConversations();
      stats.conversationCount = conversations.length;
      stats.messageCount = conversations.reduce((sum, conv) => sum + (conv.messages ? conv.messages.length : 0), 0);
      
      // Estimate available space (localStorage typically has 5-10MB limit)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      stats.availableSpace = Math.max(0, estimatedLimit - stats.totalSize);
      
      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  },

  /**
   * Check if storage is available
   * @returns {boolean} Storage availability
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get storage quota information
   * @returns {Promise<Object>} Quota information
   */
  async getQuotaInfo() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get quota info:', error);
      return null;
    }
  }
};

// Initialize storage when loaded
document.addEventListener('DOMContentLoaded', () => {
  AseStorage.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AseStorage;
}