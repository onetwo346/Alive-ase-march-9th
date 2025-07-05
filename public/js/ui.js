/**
 * Ase - Bab3yini: The Living Flame
 * UI Management Module
 */

// Global UI namespace
window.AseUI = {
  
  // DOM element references
  elements: {},
  
  // UI state
  state: {
    sidebarOpen: false,
    currentTheme: 'dark',
    isTyping: false,
    isLoading: false,
    isMobile: false
  },

  // Animation timers
  timers: {
    typingIndicator: null,
    toast: null,
    autoHide: null
  },

  /**
   * Initialize UI components
   */
  init() {
    try {
      this.cacheElements();
      this.setupEventListeners();
      this.setupResponsiveHandlers();
      this.loadUserPreferences();
      this.setupAnimations();
      this.setupAccessibility();
    } catch (error) {
      console.error('UI initialization failed:', error);
    }
  },

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    this.elements = {
      // Main containers
      loadingScreen: document.getElementById('loadingScreen'),
      introPage: document.getElementById('introPage'),
      beginButton: document.getElementById('beginButton'),
      mainContainer: document.getElementById('mainContainer'),
      
      // Sidebar
      sidebar: document.getElementById('sidebar'),
      sidebarClose: document.getElementById('sidebarClose'),
      menuToggle: document.getElementById('menuToggle'),
      
      // Chat area
      chatContainer: document.getElementById('chatContainer'),
      chatMessages: document.getElementById('chatMessages'),
      chatInput: document.getElementById('chatInput'),
      userInput: document.getElementById('userInput'),
      sendBtn: document.getElementById('sendBtn'),
      voiceBtn: document.getElementById('voiceBtn'),
      
      // Header
      aseTitle: document.getElementById('aseTitle'),
      clearChatBtn: document.getElementById('clearChatBtn'),
      
      // Sidebar controls
      newTabBtn: document.getElementById('newTabBtn'),
      clearAllBtn: document.getElementById('clearAllBtn'),
      exportBtn: document.getElementById('exportBtn'),
      resetBtn: document.getElementById('resetBtn'),
      renameInput: document.getElementById('renameInput'),
      renameBtn: document.getElementById('renameBtn'),
      
      // Settings
      themeSelect: document.getElementById('themeSelect'),
      fontSizeSelect: document.getElementById('fontSizeSelect'),
      personalitySelect: document.getElementById('personalitySelect'),
      cosmicToggle: document.getElementById('cosmicToggle'),
      moodToggle: document.getElementById('moodToggle'),
      
      // Chat management
      searchChats: document.getElementById('searchChats'),
      chatList: document.getElementById('chatList'),
      
      // UI feedback
      typingIndicator: document.getElementById('typingIndicator'),
      errorToast: document.getElementById('errorToast'),
      toastMessage: document.getElementById('toastMessage')
    };
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Intro page
    if (this.elements.beginButton) {
      this.elements.beginButton.addEventListener('click', (e) => this.startExperience(e));
      this.elements.beginButton.addEventListener('touchstart', (e) => this.startExperience(e), { passive: false });
    }

    // Sidebar toggle
    if (this.elements.menuToggle) {
      this.elements.menuToggle.addEventListener('click', () => this.toggleSidebar());
    }

    if (this.elements.sidebarClose) {
      this.elements.sidebarClose.addEventListener('click', () => this.closeSidebar());
    }

    // Chat input
    if (this.elements.userInput) {
      this.elements.userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      
      this.elements.userInput.addEventListener('input', 
        AseUtils.debounce(() => this.handleInputChange(), 300)
      );
    }

    if (this.elements.sendBtn) {
      this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
    }

    if (this.elements.voiceBtn) {
      this.elements.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
    }

    // Sidebar controls
    if (this.elements.newTabBtn) {
      this.elements.newTabBtn.addEventListener('click', () => this.newChat());
    }

    if (this.elements.clearAllBtn) {
      this.elements.clearAllBtn.addEventListener('click', () => this.clearAllChats());
    }

    if (this.elements.exportBtn) {
      this.elements.exportBtn.addEventListener('click', () => this.exportChat());
    }

    if (this.elements.resetBtn) {
      this.elements.resetBtn.addEventListener('click', () => this.resetSession());
    }

    if (this.elements.renameBtn) {
      this.elements.renameBtn.addEventListener('click', () => this.renameAse());
    }

    if (this.elements.clearChatBtn) {
      this.elements.clearChatBtn.addEventListener('click', () => this.clearCurrentChat());
    }

    // Settings
    if (this.elements.themeSelect) {
      this.elements.themeSelect.addEventListener('change', (e) => this.switchTheme(e.target.value));
    }

    if (this.elements.fontSizeSelect) {
      this.elements.fontSizeSelect.addEventListener('change', (e) => this.setFontSize(e.target.value));
    }

    if (this.elements.personalitySelect) {
      this.elements.personalitySelect.addEventListener('change', (e) => this.setPersonality(e.target.value));
    }

    if (this.elements.cosmicToggle) {
      this.elements.cosmicToggle.addEventListener('click', () => this.toggleCosmicInsights());
    }

    if (this.elements.moodToggle) {
      this.elements.moodToggle.addEventListener('click', () => this.toggleMoodAnalysis());
    }

    // Search
    if (this.elements.searchChats) {
      this.elements.searchChats.addEventListener('input', 
        AseUtils.debounce((e) => this.searchChats(e.target.value), 300)
      );
    }

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
  },

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
      
      // New chat with Ctrl/Cmd + N
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.newChat();
      }
      
      // Focus input with /
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement !== this.elements.userInput) {
        e.preventDefault();
        this.elements.userInput?.focus();
      }
      
      // Escape to close sidebar
      if (e.key === 'Escape') {
        if (this.state.sidebarOpen) {
          this.closeSidebar();
        }
      }
    });
  },

  /**
   * Setup responsive handlers
   */
  setupResponsiveHandlers() {
    // Detect mobile
    this.state.isMobile = window.innerWidth <= 768;
    
    // Handle resize
    window.addEventListener('resize', AseUtils.debounce(() => {
      const wasMobile = this.state.isMobile;
      this.state.isMobile = window.innerWidth <= 768;
      
      if (wasMobile !== this.state.isMobile) {
        this.handleResponsiveChange();
      }
    }, 250));

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleResponsiveChange();
      }, 100);
    });

    // Touch/swipe handlers for mobile
    if (AseUtils.hasTouchSupport()) {
      this.setupTouchHandlers();
    }
  },

  /**
   * Setup touch handlers for mobile
   */
  setupTouchHandlers() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Swipe detection
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && touchStartX < 50) {
          // Swipe right from left edge - open sidebar
          this.openSidebar();
        } else if (deltaX < 0 && this.state.sidebarOpen) {
          // Swipe left - close sidebar
          this.closeSidebar();
        }
      }
    }, { passive: true });
  },

  /**
   * Handle responsive changes
   */
  handleResponsiveChange() {
    if (this.state.isMobile) {
      this.elements.sidebar?.classList.remove('desktop-visible');
      this.elements.chatContainer?.classList.remove('desktop-sidebar-open');
    } else {
      if (this.state.sidebarOpen) {
        this.elements.sidebar?.classList.add('desktop-visible');
        this.elements.chatContainer?.classList.add('desktop-sidebar-open');
      }
    }
  },

  /**
   * Load user preferences
   */
  loadUserPreferences() {
    const settings = AseStorage.getSettings();
    
    // Apply theme
    this.switchTheme(settings.theme);
    
    // Apply font size
    this.setFontSize(settings.fontSize);
    
    // Apply personality
    this.setPersonality(settings.personality);
    
    // Apply feature toggles
    this.updateToggleState('cosmicToggle', settings.cosmicInsights);
    this.updateToggleState('moodToggle', settings.moodAnalysis);
    
    // Update UI controls
    if (this.elements.themeSelect) this.elements.themeSelect.value = settings.theme;
    if (this.elements.fontSizeSelect) this.elements.fontSizeSelect.value = settings.fontSize;
    if (this.elements.personalitySelect) this.elements.personalitySelect.value = settings.personality;
    if (this.elements.aseTitle) this.elements.aseTitle.textContent = `${settings.name} - The Living Flame`;
    if (this.elements.renameInput) this.elements.renameInput.placeholder = settings.name;
  },

  /**
   * Setup animations
   */
  setupAnimations() {
    // Intersection Observer for fade-in animations
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      });

      // Observe elements that should fade in
      document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
      });
    }
  },

  /**
   * Setup accessibility features
   */
  setupAccessibility() {
    // Announce important changes to screen readers
    this.createAriaLiveRegion();
    
    // Add focus management
    this.setupFocusManagement();
    
    // Add skip links
    this.addSkipLinks();
  },

  /**
   * Create ARIA live region for announcements
   */
  createAriaLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'announcements';
    document.body.appendChild(liveRegion);
  },

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  announce(message) {
    const liveRegion = document.getElementById('announcements');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  },

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Focus trap for sidebar on mobile
    if (this.state.isMobile) {
      this.elements.sidebar?.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && this.state.sidebarOpen) {
          this.trapFocus(e, this.elements.sidebar);
        }
      });
    }
  },

  /**
   * Trap focus within element
   * @param {Event} e - Keyboard event
   * @param {HTMLElement} element - Element to trap focus within
   */
  trapFocus(e, element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  },

  /**
   * Add skip links for accessibility
   */
  addSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = '#chatMessages';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--accent-color);
      color: var(--secondary-bg);
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  },

  /**
   * Start experience (transition from intro)
   */
  startExperience(event) {
    if (this.state.isLoading) return;
    
    event.preventDefault();
    this.state.isLoading = true;

    // Show loading screen
    this.elements.loadingScreen?.classList.remove('hidden');
    
    // Hide intro page
    this.elements.introPage?.classList.add('hidden');
    
    // After intro animation completes
    setTimeout(() => {
      this.elements.loadingScreen?.classList.add('hidden');
      this.elements.mainContainer?.classList.add('visible');
      
      // Show sidebar on desktop
      if (!this.state.isMobile) {
        this.openSidebar();
      }
      
      // Focus input
      this.elements.userInput?.focus();
      
      // Announce to screen readers
      this.announce('Welcome to Ase - The Living Flame. Chat interface is now ready.');
      
      this.state.isLoading = false;
    }, 800);
  },

  /**
   * Toggle sidebar
   */
  toggleSidebar() {
    if (this.state.sidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  },

  /**
   * Open sidebar
   */
  openSidebar() {
    this.state.sidebarOpen = true;
    this.elements.sidebar?.classList.add('visible');
    this.elements.menuToggle?.classList.add('active');
    
    if (!this.state.isMobile) {
      this.elements.sidebar?.classList.add('desktop-visible');
      this.elements.chatContainer?.classList.add('desktop-sidebar-open');
    }
    
    // Focus first interactive element in sidebar
    const firstButton = this.elements.sidebar?.querySelector('button, input, select');
    firstButton?.focus();
  },

  /**
   * Close sidebar
   */
  closeSidebar() {
    this.state.sidebarOpen = false;
    this.elements.sidebar?.classList.remove('visible', 'desktop-visible');
    this.elements.menuToggle?.classList.remove('active');
    this.elements.chatContainer?.classList.remove('desktop-sidebar-open');
    
    // Return focus to toggle button
    this.elements.menuToggle?.focus();
  },

  /**
   * Switch theme
   * @param {string} theme - Theme name
   */
  switchTheme(theme) {
    this.state.currentTheme = theme;
    
    // Remove existing theme classes
    document.body.classList.remove('light', 'neon');
    
    // Add new theme class
    if (theme !== 'dark') {
      document.body.classList.add(theme);
    }
    
    // Update storage
    AseStorage.updateSetting('theme', theme);
    
    // Announce change
    this.announce(`Theme switched to ${theme}`);
  },

  /**
   * Set font size
   * @param {number} size - Font size in pixels
   */
  setFontSize(size) {
    const fontSize = parseInt(size);
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
    
    // Update message font sizes
    this.elements.chatMessages?.querySelectorAll('.message').forEach(msg => {
      msg.style.fontSize = `${fontSize}px`;
    });
    
    // Update storage
    AseStorage.updateSetting('fontSize', fontSize);
    
    // Announce change
    this.announce(`Font size set to ${fontSize} pixels`);
  },

  /**
   * Set AI personality
   * @param {string} personality - Personality type
   */
  setPersonality(personality) {
    AseStorage.updateSetting('personality', personality);
    this.announce(`AI personality set to ${personality}`);
  },

  /**
   * Toggle cosmic insights
   */
  toggleCosmicInsights() {
    const settings = AseStorage.getSettings();
    const newValue = !settings.cosmicInsights;
    
    AseStorage.updateSetting('cosmicInsights', newValue);
    this.updateToggleState('cosmicToggle', newValue);
    
    this.announce(`Cosmic insights ${newValue ? 'enabled' : 'disabled'}`);
  },

  /**
   * Toggle mood analysis
   */
  toggleMoodAnalysis() {
    const settings = AseStorage.getSettings();
    const newValue = !settings.moodAnalysis;
    
    AseStorage.updateSetting('moodAnalysis', newValue);
    this.updateToggleState('moodToggle', newValue);
    
    this.announce(`Mood analysis ${newValue ? 'enabled' : 'disabled'}`);
  },

  /**
   * Update toggle button state
   * @param {string} toggleId - Toggle button ID
   * @param {boolean} active - Active state
   */
  updateToggleState(toggleId, active) {
    const toggle = this.elements[toggleId];
    if (toggle) {
      const indicator = toggle.querySelector('.toggle-indicator');
      if (indicator) {
        indicator.textContent = active ? 'ON' : 'OFF';
      }
      
      if (active) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    }
  },

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    if (this.elements.typingIndicator) {
      this.elements.typingIndicator.classList.add('visible');
      this.state.isTyping = true;
    }
  },

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    if (this.elements.typingIndicator) {
      this.elements.typingIndicator.classList.remove('visible');
      this.state.isTyping = false;
    }
  },

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (info, success, error, warning)
   * @param {number} duration - Auto-hide duration in ms
   */
  showToast(message, type = 'info', duration = 5000) {
    if (this.elements.errorToast && this.elements.toastMessage) {
      this.elements.toastMessage.textContent = message;
      this.elements.errorToast.className = `toast visible ${type}`;
      
      // Clear existing timer
      if (this.timers.toast) {
        clearTimeout(this.timers.toast);
      }
      
      // Auto-hide
      this.timers.toast = setTimeout(() => {
        this.hideToast();
      }, duration);
      
      // Announce to screen readers
      this.announce(message);
    }
  },

  /**
   * Hide toast notification
   */
  hideToast() {
    if (this.elements.errorToast) {
      this.elements.errorToast.classList.remove('visible');
    }
    
    if (this.timers.toast) {
      clearTimeout(this.timers.toast);
      this.timers.toast = null;
    }
  },

  /**
   * Handle input change
   */
  handleInputChange() {
    const input = this.elements.userInput;
    if (input) {
      const hasText = input.value.trim().length > 0;
      
      if (this.elements.sendBtn) {
        this.elements.sendBtn.disabled = !hasText;
      }
      
      // Auto-resize input if needed
      this.autoResizeInput(input);
    }
  },

  /**
   * Auto-resize input based on content
   * @param {HTMLElement} input - Input element
   */
  autoResizeInput(input) {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  },

  /**
   * Scroll to bottom of chat
   */
  scrollToBottom() {
    if (this.elements.chatMessages) {
      this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
  },

  /**
   * Add message to chat
   * @param {string} sender - Message sender (user/ase)
   * @param {string} content - Message content
   * @param {Object} options - Additional options
   */
  addMessage(sender, content, options = {}) {
    if (!this.elements.chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (options.fontSize) {
      messageDiv.style.fontSize = `${options.fontSize}px`;
    }
    
    // Format content with markdown support
    const formattedContent = AseUtils.formatText(content);
    messageDiv.innerHTML = formattedContent;
    
    // Add timestamp if requested
    if (options.showTimestamp) {
      const timestamp = document.createElement('span');
      timestamp.className = 'message-timestamp';
      timestamp.textContent = new Date().toLocaleTimeString();
      messageDiv.appendChild(timestamp);
    }
    
    this.elements.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
    
    // Announce new message to screen readers
    this.announce(`New message from ${sender}: ${content}`);
  },

  /**
   * Clear chat messages
   */
  clearChatMessages() {
    if (this.elements.chatMessages) {
      this.elements.chatMessages.innerHTML = '';
      this.addWelcomeMessage();
    }
  },

  /**
   * Add welcome message
   */
  addWelcomeMessage() {
    if (this.elements.chatMessages) {
      const welcomeDiv = document.createElement('div');
      welcomeDiv.className = 'welcome-message';
      welcomeDiv.innerHTML = `
        <div class="flame-icon">🔥</div>
        <p>The flame awaits your voice...</p>
      `;
      this.elements.chatMessages.appendChild(welcomeDiv);
    }
  },

  /**
   * Toggle voice input
   */
  toggleVoiceInput() {
    // Voice input implementation would go here
    // For now, show not implemented message
    this.showToast('Voice input feature coming soon!', 'info');
  },

  // Event handlers that delegate to main app
  sendMessage() {
    if (window.AseChat) {
      window.AseChat.sendMessage();
    }
  },

  newChat() {
    if (window.AseChat) {
      window.AseChat.newChat();
    }
  },

  clearAllChats() {
    if (window.AseChat) {
      window.AseChat.clearAllChats();
    }
  },

  clearCurrentChat() {
    if (window.AseChat) {
      window.AseChat.clearCurrentChat();
    }
  },

  exportChat() {
    if (window.AseChat) {
      window.AseChat.exportChat();
    }
  },

  resetSession() {
    if (window.AseChat) {
      window.AseChat.resetSession();
    }
  },

  renameAse() {
    if (window.AseChat) {
      window.AseChat.renameAse();
    }
  },

  searchChats(query) {
    if (window.AseChat) {
      window.AseChat.searchChats(query);
    }
  }
};

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  AseUI.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AseUI;
}