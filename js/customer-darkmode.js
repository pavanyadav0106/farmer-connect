// Unified Dark Mode Manager for Customer Pages
class CustomerDarkModeManager {
    constructor() {
        this.isDarkMode = localStorage.getItem('customerDarkMode') === 'true';
        this.toggleButton = null;
        this.init();
    }

    init() {

        
        // Apply theme immediately
        this.applyDarkMode(this.isDarkMode);
        
        // Find toggle button (works with existing darkModeToggle)
        this.findToggleButton();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Fix autofill styles
        this.fixAutoFillStyles();
        

    }

    findToggleButton() {
        // Look for existing toggle button in customer pages
        this.toggleButton = document.getElementById('darkModeToggle');
        
        if (!this.toggleButton) {

        }
    }

    setupEventListeners() {
        // Toggle button click
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }

        // System preference changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('customerDarkMode')) {
                    this.applyDarkMode(e.matches);
                }
            });
        }

        // Storage changes (sync across tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'customerDarkMode') {
                this.applyDarkMode(e.newValue === 'true');
            }
        });

        // Listen for custom events
        window.addEventListener('customerDarkModeToggle', () => {
            this.toggleDarkMode();
        });
    }

    applyDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('customer-dark-mode');
            document.body.classList.remove('customer-light-mode');
        } else {
            document.body.classList.add('customer-light-mode');
            document.body.classList.remove('customer-dark-mode');
        }
        
        this.updateToggleButton(isDark);
        this.updateMetaThemeColor(isDark);
        this.storePreference(isDark);
        this.isDarkMode = isDark;

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('customerDarkModeChanged', {
            detail: { isDarkMode: isDark }
        }));

        console.log(`🎨 Customer dark mode: ${isDark ? 'ON' : 'OFF'}`);
    }

    toggleDarkMode() {
        this.applyDarkMode(!this.isDarkMode);
    }

    updateToggleButton(isDark) {
        if (this.toggleButton) {
            const icon = this.toggleButton.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
            this.toggleButton.setAttribute('aria-label', 
                isDark ? 'Switch to light mode' : 'Switch to dark mode'
            );
            this.toggleButton.classList.toggle('active', isDark);
        }
    }

    updateMetaThemeColor(isDark) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = isDark ? '#121212' : '#4CAF50';
    }

    storePreference(isDark) {
        try {
            localStorage.setItem('customerDarkMode', isDark);
        } catch (e) {
            console.warn('Could not store dark mode preference:', e);
        }
    }

    fixAutoFillStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body.customer-dark-mode input:-webkit-autofill,
            body.customer-dark-mode input:-webkit-autofill:hover, 
            body.customer-dark-mode input:-webkit-autofill:focus,
            body.customer-dark-mode textarea:-webkit-autofill,
            body.customer-dark-mode textarea:-webkit-autofill:hover,
            body.customer-dark-mode textarea:-webkit-autofill:focus,
            body.customer-dark-mode select:-webkit-autofill,
            body.customer-dark-mode select:-webkit-autofill:hover,
            body.customer-dark-mode select:-webkit-autofill:focus {
                -webkit-text-fill-color: #f1f1f1 !important;
                -webkit-box-shadow: 0 0 0px 1000px #1f1f1f inset !important;
                border: 1px solid #444 !important;
                color: #f1f1f1 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Public API
    enable() {
        this.applyDarkMode(true);
    }

    disable() {
        this.applyDarkMode(false);
    }

    getCurrentMode() {
        return this.isDarkMode;
    }
}

// Initialize dark mode manager
let customerDarkModeManager;

document.addEventListener('DOMContentLoaded', () => {
    customerDarkModeManager = new CustomerDarkModeManager();
    window.customerDarkMode = customerDarkModeManager;
});

// Global functions for easy access
window.toggleCustomerDarkMode = function() {
    if (window.customerDarkMode) {
        window.customerDarkMode.toggleDarkMode();
    }
};

window.setCustomerDarkMode = function(enabled) {
    if (window.customerDarkMode) {
        window.customerDarkMode.applyDarkMode(enabled);
    }
};

window.getCustomerDarkMode = function() {
    return window.customerDarkMode ? window.customerDarkMode.getCurrentMode() : false;
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerDarkModeManager;
}