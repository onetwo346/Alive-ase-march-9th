/**
 * Ase - Bab3yini: The Living Flame
 * Utility Functions
 */

// Global utilities namespace
window.AseUtils = {
  
  /**
   * Debounce function to limit how often a function can be called
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @param {boolean} immediate - Whether to execute immediately
   * @returns {Function} Debounced function
   */
  debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  },

  /**
   * Throttle function to limit execution frequency
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Generate unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Less than 1 week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
    
    // Older than 1 week
    return d.toLocaleDateString();
  },

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} html - HTML string to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  /**
   * Parse and format text with basic markdown support
   * @param {string} text - Text to format
   * @returns {string} Formatted HTML
   */
  formatText(text) {
    // Escape HTML first
    let formatted = this.sanitizeHtml(text);
    
    // Convert URLs to links
    formatted = formatted.replace(
      /https?:\/\/[^\s]+/g,
      '<a href="$&" target="_blank" rel="noopener noreferrer">$&</a>'
    );
    
    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert `code` to <code>
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  },

  /**
   * Download text as file
   * @param {string} text - Text content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  downloadTextFile(text, filename, mimeType = 'text/plain') {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Get user's IP address
   * @returns {Promise<string>} IP address
   */
  async getUserIP() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP:', error);
      return null;
    }
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Count words in text
   * @param {string} text - Text to count
   * @returns {number} Word count
   */
  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  },

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add when truncated
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * Check if element is in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Is in viewport
   */
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Smooth scroll to element
   * @param {HTMLElement} element - Element to scroll to
   * @param {Object} options - Scroll options
   */
  scrollToElement(element, options = {}) {
    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
  },

  /**
   * Add event listener with automatic cleanup
   * @param {HTMLElement} element - Element to attach listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   * @returns {Function} Cleanup function
   */
  addEventListenerWithCleanup(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
  },

  /**
   * Create element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string|HTMLElement} content - Element content
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Set content
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      element.appendChild(content);
    }
    
    return element;
  },

  /**
   * Load image with promise
   * @param {string} src - Image source
   * @returns {Promise<HTMLImageElement>} Loaded image
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Generate random color
   * @returns {string} Random hex color
   */
  randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  },

  /**
   * Check if user prefers dark mode
   * @returns {boolean} Prefers dark mode
   */
  prefersDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  /**
   * Check if user prefers reduced motion
   * @returns {boolean} Prefers reduced motion
   */
  prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Get device type
   * @returns {string} Device type (mobile, tablet, desktop)
   */
  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  },

  /**
   * Check if device supports touch
   * @returns {boolean} Has touch support
   */
  hasTouchSupport() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Format number with thousands separator
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    return num.toLocaleString();
  },

  /**
   * Get contrast color for background
   * @param {string} bgColor - Background color (hex)
   * @returns {string} Contrast color (black or white)
   */
  getContrastColor(bgColor) {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AseUtils;
}