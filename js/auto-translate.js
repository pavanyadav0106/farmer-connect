/**
 * Auto Translate System
 * Automatically translates elements with data-i18n attributes
 */

import languageManager from './language-manager.js';

class AutoTranslate {
    constructor() {
        this.observer = null;
        this.initialized = false;
        this.translatedElements = new Set();
    }

    /**
     * Initialize the auto-translate system
     */
    async init() {
        if (this.initialized) return;
        
        // Initialize language system first
        await languageManager.initialize();
        
        // Setup MutationObserver to handle dynamically added content
        this.setupObserver();
        
        // Initial translation of existing elements
        this.translatePage();
        
        // Subscribe to language changes
        languageManager.subscribe(() => {
            this.translatePage();
        });
        
        this.initialized = true;
        
        console.log('AutoTranslate initialized');
    }

    /**
     * Translate entire page
     */
    translatePage() {
        // Clear previous translations
        this.translatedElements.clear();
        
        // Translate elements with data-i18n attribute
        this.translateAllElements();
        
        // Update language selector
        this.updateLanguageSelector();
        
        // Update page direction for RTL languages
        this.updatePageDirection();
    }

    /**
     * Translate all translatable elements
     */
    translateAllElements() {
        // Elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            this.translateElement(element);
        });

        // Elements with i18n-text class
        document.querySelectorAll('.i18n-text').forEach(element => {
            if (element.dataset.key) {
                element.textContent = languageManager.t(element.dataset.key);
                this.translatedElements.add(element);
            }
        });

        // Elements with i18n-placeholder class
        document.querySelectorAll('.i18n-placeholder').forEach(element => {
            if (element.dataset.key) {
                element.placeholder = languageManager.t(element.dataset.key);
                this.translatedElements.add(element);
            }
        });

        // Elements with i18n-title class
        document.querySelectorAll('.i18n-title').forEach(element => {
            if (element.dataset.key) {
                element.title = languageManager.t(element.dataset.key);
                this.translatedElements.add(element);
            }
        });
    }

    /**
     * Translate a single element
     * @param {HTMLElement} element - Element to translate
     */
    translateElement(element) {
        const key = element.getAttribute('data-i18n');
        if (!key) return;

        const translation = languageManager.t(key);
        
        // Determine how to apply the translation
        if (element.hasAttribute('data-i18n-html')) {
            element.innerHTML = translation;
        } else if (element.hasAttribute('data-i18n-placeholder')) {
            element.placeholder = translation;
        } else if (element.hasAttribute('data-i18n-value')) {
            element.value = translation;
        } else if (element.hasAttribute('data-i18n-title')) {
            element.title = translation;
        } else if (element.hasAttribute('data-i18n-alt')) {
            element.alt = translation;
        } else if (element.hasAttribute('data-i18n-aria-label')) {
            element.setAttribute('aria-label', translation);
        } else {
            element.textContent = translation;
        }
        
        this.translatedElements.add(element);
    }

    /**
     * Update language selector dropdown
     */
    updateLanguageSelector() {
        const selector = document.getElementById('languageSelect');
        if (selector) {
            selector.value = languageManager.getCurrentLang();
            
            // Translate option texts
            Array.from(selector.options).forEach(option => {
                const lang = option.value;
                const langNames = {
                    'en': 'English',
                    'te': 'తెలుగు',
                    'hi': 'हिन्दी',
                    'ta': 'தமிழ்'
                };
                
                if (langNames[lang]) {
                    option.textContent = langNames[lang];
                }
            });
        }
    }

    /**
     * Update page direction for RTL languages
     */
    updatePageDirection() {
        if (languageManager.isRTL()) {
            document.body.classList.add('rtl');
            document.body.classList.remove('ltr');
        } else {
            document.body.classList.add('ltr');
            document.body.classList.remove('rtl');
        }
    }

    /**
     * Setup MutationObserver for dynamic content
     */
    setupObserver() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.hasAttribute('data-i18n')) {
                            this.translateElement(node);
                        }
                        
                        // Check child elements
                        node.querySelectorAll('[data-i18n]').forEach(element => {
                            if (!this.translatedElements.has(element)) {
                                this.translateElement(element);
                            }
                        });
                    }
                });
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Manually register an element for translation
     * @param {HTMLElement} element - Element to register
     * @param {string} key - Translation key
     * @param {string} type - Type of translation (text, placeholder, etc.)
     */
    registerElement(element, key, type = 'text') {
        if (!element || !key) return;
        
        switch (type) {
            case 'placeholder':
                element.setAttribute('data-i18n-placeholder', key);
                break;
            case 'value':
                element.setAttribute('data-i18n-value', key);
                break;
            case 'title':
                element.setAttribute('data-i18n-title', key);
                break;
            case 'html':
                element.setAttribute('data-i18n-html', key);
                break;
            default:
                element.setAttribute('data-i18n', key);
        }
        
        this.translateElement(element);
    }

    /**
     * Update a specific element with new translation
     * @param {string} elementId - Element ID
     * @param {string} key - Translation key
     */
    updateElement(elementId, key) {
        const element = document.getElementById(elementId);
        if (element) {
            this.registerElement(element, key);
        }
    }
}

// Create singleton instance
const autoTranslate = new AutoTranslate();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        autoTranslate.init();
    });
} else {
    autoTranslate.init();
}

// Export for ES modules
export default autoTranslate;

// Also expose to window for legacy scripts
if (typeof window !== 'undefined') {
    window.autoTranslate = autoTranslate;
}