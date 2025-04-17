/**
 * Authentication functionality
 */
class AuthService {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('token');
        this.isAuthenticated = !!this.token;
    }

    /**
     * Initialize authentication
     * @returns {Promise<boolean>} - Whether the user is authenticated
     */
    async init() {
        if (this.token) {
            try {
                const user = await authAPI.me();
                this.currentUser = user;
                return true;
            } catch (error) {
                console.error('Failed to get current user:', error);
                this.logout();
                return false;
            }
        }
        return false;
    }

    /**
     * Login a user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} - User data
     */
    async login(username, password) {
        try {
            console.log("Attempting login with:", { username });
            console.log("Login URL:", `${API_URL}/auth/login`);
            const data = await authAPI.login(username, password);
            console.log("Login successful, token received:", data);
            this.token = data.access_token;
            localStorage.setItem('token', this.token);
            this.isAuthenticated = true;
            
            // Set token for WebSocket service
            websocketService.setToken(this.token);
            
            // Get current user
            const user = await authAPI.me();
            this.currentUser = user;
            
            return user;
        } catch (error) {
            console.error('Login failed:', error);
            console.error('Error details:', error.response ? error.response.data : 'No response data');
            throw error;
        }
    }

    /**
     * Register a new user
     * @param {Object} userData - User data (username, email, password)
     * @returns {Promise<Object>} - User data
     */
    async register(userData) {
        try {
            const user = await authAPI.register(userData);
            // After registration, login the user
            return this.login(userData.username, userData.password);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    /**
     * Refresh token
     * @returns {Promise<boolean>} - Whether the token was refreshed successfully
     */
    async refreshToken() {
        try {
            const data = await authAPI.refresh();
            this.token = data.access_token;
            localStorage.setItem('token', this.token);
            
            // Update token for WebSocket service
            websocketService.setToken(this.token);
            
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Logout the current user
     */
    logout() {
        this.token = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('token');
        
        // Disconnect WebSocket connections
        websocketService.disconnect();
        
        // Redirect to login page
        window.location.href = '/';
    }

    /**
     * Get the current user
     * @returns {Object|null} - Current user data
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Check if the user is authenticated
     * @returns {boolean} - Whether the user is authenticated
     */
    isLoggedIn() {
        return this.isAuthenticated;
    }
}

// Create singleton instance
const authService = new AuthService();

// Handle authentication UI
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show the corresponding form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tabName}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });
    
    // Login form submission
    const loginForm = document.getElementById('login-form-element');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const errorElement = document.getElementById('login-error');
            
            try {
                errorElement.textContent = '';
                const user = await authService.login(username, password);
                window.location.reload(); // Reload the page to show the chat UI
            } catch (error) {
                errorElement.textContent = error.message || 'Login failed. Please check your credentials.';
            }
        });
    }
    
    // Registration form submission
    const registerForm = document.getElementById('register-form-element');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const errorElement = document.getElementById('register-error');
            
            try {
                errorElement.textContent = '';
                const user = await authService.register({ username, email, password });
                window.location.reload(); // Reload the page to show the chat UI
            } catch (error) {
                errorElement.textContent = error.message || 'Registration failed. Please try again.';
            }
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authService.logout();
        });
    }
}); 