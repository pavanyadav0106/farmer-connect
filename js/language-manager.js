/**
 * Language Manager for Farmer Connect
 * Handles multi-language support across the application
 */

class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'en';
        this.translations = {};
        this.isLoading = false;
        this.observers = [];
        this.rtlLanguages = ['ar', 'ur', 'fa']; // Add RTL languages if needed
    }

    /**
     * Load language file
     * @param {string} lang - Language code (en, te, etc.)
     */
    async loadLanguage(lang) {
        if (this.isLoading) return false;
        
        this.isLoading = true;
        
        try {
            const response = await fetch(`languages/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Language file not found: ${lang}`);
            }
            
            this.translations = await response.json();
            this.currentLang = lang;
            localStorage.setItem('language', lang);
            
            // Update HTML dir attribute for RTL languages
            if (this.rtlLanguages.includes(lang)) {
                document.documentElement.dir = 'rtl';
            } else {
                document.documentElement.dir = 'ltr';
            }
            
            // Update HTML lang attribute
            document.documentElement.lang = lang;
            
            // Notify all observers
            this.notifyObservers();
            
            return true;
        } catch (error) {
            console.error('Failed to load language:', error);
            
            // Fallback to English
            if (lang !== 'en') {
                console.log('Falling back to English...');
                return this.loadLanguage('en');
            }
            
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get translation for a key
     * @param {string} key - Translation key (e.g., "app.title")
     * @param {string} defaultValue - Fallback value
     * @returns {string} Translated text
     */
// In language-manager.js, update the t() method:
t(key, params = {}, defaultValue = '') {
  if (!key) return defaultValue;
  
  try {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }
    
    let result = value || defaultValue || key;
    
    // Replace placeholders
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(param => {
        result = result.replace(`{${param}}`, params[param]);
      });
    }
    
    return result;
  } catch (error) {
    console.error('Translation error for key:', key, error);
    return defaultValue || key;
  }
}

    /**
     * Subscribe to language changes
     * @param {Function} callback - Function to call when language changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.observers.push(callback);
        return () => {
            this.observers = this.observers.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all observers about language change
     */
    notifyObservers() {
        this.observers.forEach(callback => {
            try {
                callback(this.currentLang);
            } catch (error) {
                console.error('Error in language observer:', error);
            }
        });
    }

    /**
     * Get current language code
     * @returns {string} Current language
     */
    getCurrentLang() {
        return this.currentLang;
    }

    /**
     * Check if language is RTL
     * @param {string} lang - Language code
     * @returns {boolean} True if RTL
     */
    isRTL(lang = this.currentLang) {
        return this.rtlLanguages.includes(lang);
    }

    /**
     * Initialize language system
     */
    async initialize() {
        const savedLang = localStorage.getItem('language') || 'en';
        return this.loadLanguage(savedLang);
    }

    /**
     * Change language
     * @param {string} lang - New language code
     */
    async changeLanguage(lang) {
        return this.loadLanguage(lang);
    }
}

// Create singleton instance
const languageManager = new LanguageManager();

// Export for ES modules
export default languageManager;

// Also expose to window for legacy scripts
if (typeof window !== 'undefined') {
    window.languageManager = languageManager;
}