/**
 * Ase - Bab3yini: The Living Flame
 * Main Application Module
 */

// Global application namespace
window.AseApp = {
  
  // Application state
  state: {
    initialized: false,
    version: '2.0.0',
    environment: 'production',
    features: {
      voiceInput: false,
      imageGeneration: false,
      fileUpload: false,
      collaboration: false
    }
  },

  // Configuration
  config: {
    appName: 'Ase - Bab3yini',
    tagline: 'The Living Flame',
    author: 'Nana Kofi Fosu',
    repository: 'https://github.com/nanakofifosu/ase-bab3yini',
    apiVersion: 'v1',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedLanguages: ['en'],
    updateCheckInterval: 24 * 60 * 60 * 1000 // 24 hours
  },

  // Performance monitoring
  performance: {
    startTime: Date.now(),
    loadTime: null,
    memoryUsage: null,
    errorCount: 0,
    apiCallCount: 0
  },

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log(`🔥 Initializing ${this.config.appName} v${this.state.version}`);
      
      // Check browser compatibility
      if (!this.checkBrowserCompatibility()) {
        this.showBrowserCompatibilityError();
        return;
      }

      // Setup error handling
      this.setupErrorHandling();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Check for updates
      this.checkForUpdates();
      
      // Initialize modules in order
      await this.initializeModules();
      
      // Setup app-level event listeners
      this.setupEventListeners();
      
      // Mark as initialized
      this.state.initialized = true;
      this.performance.loadTime = Date.now() - this.performance.startTime;
      
      console.log(`✨ ${this.config.appName} initialized in ${this.performance.loadTime}ms`);
      
      // Log welcome message
      this.logWelcomeMessage();
      
    } catch (error) {
      console.error('Application initialization failed:', error);
      this.handleInitializationError(error);
    }
  },

  /**
   * Check browser compatibility
   */
  checkBrowserCompatibility() {
    const requiredFeatures = [
      'localStorage',
      'fetch',
      'Promise',
      'addEventListener'
    ];

    return requiredFeatures.every(feature => {
      if (feature === 'localStorage') {
        return typeof Storage !== 'undefined';
      }
      return feature in window || feature in document;
    });
  },

  /**
   * Show browser compatibility error
   */
  showBrowserCompatibilityError() {
    const errorHtml = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a23 0%, #1a1a3d 100%);
        color: #e0e0ff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        z-index: 10000;
      ">
        <h1 style="color: #00ffff; margin-bottom: 20px;">⚠️ Browser Not Supported</h1>
        <p style="margin-bottom: 20px; max-width: 600px;">
          Your browser doesn't support all the features required to run ${this.config.appName}.
          Please update your browser or use a modern browser like Chrome, Firefox, Safari, or Edge.
        </p>
        <button onclick="location.reload()" style="
          padding: 12px 24px;
          background: #00ffff;
          color: #0a0a23;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
        ">
          Retry
        </button>
      </div>
    `;
    
    document.body.innerHTML = errorHtml;
  },

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'Uncaught Error');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled Promise Rejection');
    });

    // Setup console error tracking
    const originalError = console.error;
    console.error = (...args) => {
      this.performance.errorCount++;
      originalError.apply(console, args);
    };
  },

  /**
   * Handle application errors
   */
  handleError(error, context = 'Unknown') {
    this.performance.errorCount++;
    
    console.error(`[${context}]:`, error);
    
    // Log to analytics if available
    if (window.gtag) {
      gtag('event', 'exception', {
        description: error.message || error,
        fatal: false
      });
    }
    
    // Show user-friendly error message
    if (window.AseUI && AseUI.showToast) {
      AseUI.showToast('An unexpected error occurred. The flame flickers but endures.', 'error');
    }
  },

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    const fallbackHtml = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a23 0%, #1a1a3d 100%);
        color: #e0e0ff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        z-index: 10000;
      ">
        <h1 style="color: #ff4444; margin-bottom: 20px;">🔥 Initialization Failed</h1>
        <p style="margin-bottom: 20px; max-width: 600px;">
          ${this.config.appName} encountered an error during startup.
          Please refresh the page to try again.
        </p>
        <button onclick="location.reload()" style="
          padding: 12px 24px;
          background: #00ffff;
          color: #0a0a23;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
          margin-right: 10px;
        ">
          Refresh Page
        </button>
        <button onclick="localStorage.clear(); location.reload()" style="
          padding: 12px 24px;
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
        ">
          Clear Data & Refresh
        </button>
      </div>
    `;
    
    document.body.innerHTML = fallbackHtml;
  },

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor memory usage if available
    if ('memory' in performance) {
      this.performance.memoryUsage = performance.memory;
    }

    // Monitor API calls
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      this.performance.apiCallCount++;
      return originalFetch.apply(window, args);
    };

    // Log performance metrics periodically
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 60000); // Every minute
  },

  /**
   * Log performance metrics
   */
  logPerformanceMetrics() {
    const metrics = {
      uptime: Date.now() - this.performance.startTime,
      errorCount: this.performance.errorCount,
      apiCallCount: this.performance.apiCallCount,
      memoryUsage: 'memory' in performance ? performance.memory.usedJSHeapSize : null
    };

    console.log('Performance Metrics:', metrics);

    // Send to analytics if available
    if (window.gtag) {
      gtag('event', 'performance_check', {
        custom_map: {
          uptime: metrics.uptime,
          errors: metrics.errorCount,
          api_calls: metrics.apiCallCount
        }
      });
    }
  },

  /**
   * Check for application updates
   */
  async checkForUpdates() {
    try {
      // This would connect to your update service
      // For now, just check localStorage for last update check
      const lastCheck = localStorage.getItem('ase_last_update_check');
      const now = Date.now();
      
      if (!lastCheck || now - parseInt(lastCheck) > this.config.updateCheckInterval) {
        localStorage.setItem('ase_last_update_check', now.toString());
        
        // In a real app, you would check your server for updates
        console.log('Checking for updates...');
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  },

  /**
   * Initialize all modules in proper order
   */
  async initializeModules() {
    const modules = [
      // Storage must be initialized first
      { name: 'Storage', module: window.AseStorage, required: true },
      
      // Utils can be initialized anytime
      { name: 'Utils', module: window.AseUtils, required: true },
      
      // UI should be initialized before Chat
      { name: 'UI', module: window.AseUI, required: true },
      
      // Chat depends on UI and Storage
      { name: 'Chat', module: window.AseChat, required: true }
    ];

    for (const { name, module, required } of modules) {
      try {
        if (module && typeof module.init === 'function') {
          console.log(`Initializing ${name} module...`);
          await module.init();
          console.log(`✓ ${name} module initialized`);
        } else if (required) {
          throw new Error(`Required module ${name} not found or missing init method`);
        }
      } catch (error) {
        console.error(`Failed to initialize ${name} module:`, error);
        if (required) {
          throw error;
        }
      }
    }
  },

  /**
   * Setup application-level event listeners
   */
  setupEventListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHidden();
      } else {
        this.onPageVisible();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', (event) => {
      this.onPageUnload(event);
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      console.log('Connection restored');
      if (window.AseUI) {
        AseUI.showToast('Connection restored', 'success', 3000);
      }
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost');
      if (window.AseUI) {
        AseUI.showToast('Connection lost - working offline', 'warning', 5000);
      }
    });

    // Handle PWA install
    window.addEventListener('beforeinstallprompt', (event) => {
      this.handlePWAInstallPrompt(event);
    });
  },

  /**
   * Handle page hidden event
   */
  onPageHidden() {
    console.log('Page hidden - pausing non-essential activities');
    
    // Save current state
    if (window.AseChat && AseChat.saveCurrentChat) {
      AseChat.saveCurrentChat();
    }
  },

  /**
   * Handle page visible event
   */
  onPageVisible() {
    console.log('Page visible - resuming activities');
    
    // Check server health
    if (window.AseChat && AseChat.checkServerHealth) {
      AseChat.checkServerHealth();
    }
  },

  /**
   * Handle page unload event
   */
  onPageUnload(event) {
    // Save current state before leaving
    if (window.AseChat && AseChat.saveCurrentChat) {
      AseChat.saveCurrentChat();
    }
    
    // Don't show confirmation for now
    // event.preventDefault();
    // event.returnValue = '';
  },

  /**
   * Handle PWA install prompt
   */
  handlePWAInstallPrompt(event) {
    event.preventDefault();
    
    // Store the event for later use
    this.pwaInstallPrompt = event;
    
    // Show install button or notification
    if (window.AseUI) {
      AseUI.showToast('Add Ase to your home screen for a better experience!', 'info', 10000);
    }
  },

  /**
   * Install PWA
   */
  installPWA() {
    if (this.pwaInstallPrompt) {
      this.pwaInstallPrompt.prompt();
      
      this.pwaInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installation accepted');
        } else {
          console.log('PWA installation declined');
        }
        this.pwaInstallPrompt = null;
      });
    }
  },

  /**
   * Get application info
   */
  getInfo() {
    return {
      name: this.config.appName,
      version: this.state.version,
      author: this.config.author,
      initialized: this.state.initialized,
      uptime: Date.now() - this.performance.startTime,
      features: this.state.features,
      performance: this.performance
    };
  },

  /**
   * Log welcome message
   */
  logWelcomeMessage() {
    const styles = [
      'color: #00ffff',
      'font-size: 16px',
      'font-weight: bold',
      'text-shadow: 0 0 10px rgba(0, 255, 255, 0.5)'
    ].join(';');
    
    console.log(`%c🔥 Welcome to ${this.config.appName} v${this.state.version}`, styles);
    console.log(`Created by ${this.config.author}`);
    console.log(`The Living Flame burns bright in your browser`);
    console.log('---');
    console.log('Available commands:');
    console.log('• AseApp.getInfo() - Get application information');
    console.log('• AseStorage.getStorageStats() - Get storage statistics');
    console.log('• AseChat.exportChat() - Export current conversation');
    console.log('• AseUI.switchTheme("neon") - Switch to neon theme');
    console.log('---');
    
    // Log system info
    const systemInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    console.log('System Info:', systemInfo);
  },

  /**
   * Export application data
   */
  exportAppData() {
    const data = {
      appInfo: this.getInfo(),
      exportedAt: new Date().toISOString(),
      storage: window.AseStorage ? AseStorage.exportData() : null,
      systemInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    const filename = `ase_export_${new Date().toISOString().split('T')[0]}.json`;
    window.AseUtils?.downloadTextFile(JSON.stringify(data, null, 2), filename, 'application/json');
    
    return data;
  },

  /**
   * Import application data
   */
  async importAppData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (window.AseStorage && data.storage) {
        const success = AseStorage.importData(data.storage);
        if (success) {
          window.location.reload(); // Reload to apply imported data
        } else {
          throw new Error('Failed to import data');
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      if (window.AseUI) {
        AseUI.showToast('Import failed - invalid file format', 'error');
      }
    }
  }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AseApp.init();
});

// Make AseApp globally available for debugging
window.AseApp = AseApp;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AseApp;
}