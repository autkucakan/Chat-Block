/**
 * Main application entry point
 */
document.addEventListener('DOMContentLoaded', async () => {
    const appContainer = document.getElementById('app');
    
    // Create Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
    
    // Show loading indicator
    showLoading(appContainer);
    
    // Initialize auth service
    try {
        const isAuthenticated = await authService.init();
        
        if (isAuthenticated) {
            // User is authenticated, show chat UI
            await showChatUI(appContainer);
        } else {
            // User is not authenticated, show login/register UI
            showAuthUI(appContainer);
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showError(appContainer, 'Failed to initialize app. Please try again later.');
    }
});

/**
 * Show loading indicator
 * @param {HTMLElement} container - Container element
 */
function showLoading(container) {
    container.innerHTML = `
        <div class="loading-spinner" style="height: 100vh; display: flex; justify-content: center; align-items: center;">
            <div class="spinner"></div>
        </div>
    `;
}

/**
 * Show error message
 * @param {HTMLElement} container - Container element
 * @param {string} message - Error message
 */
function showError(container, message) {
    container.innerHTML = `
        <div style="height: 100vh; display: flex; justify-content: center; align-items: center;">
            <div class="error-message">
                ${message}
                <br><br>
                <button class="btn-primary" onclick="window.location.reload()">Reload Page</button>
            </div>
        </div>
    `;
}

/**
 * Show authentication UI
 * @param {HTMLElement} container - Container element
 */
function showAuthUI(container) {
    const loginTemplate = document.getElementById('login-template');
    const loginContent = loginTemplate.content.cloneNode(true);
    container.innerHTML = '';
    container.appendChild(loginContent);
}

/**
 * Show chat UI
 * @param {HTMLElement} container - Container element
 */
async function showChatUI(container) {
    // Show chat template
    const chatTemplate = document.getElementById('chat-template');
    const chatContent = chatTemplate.content.cloneNode(true);
    container.innerHTML = '';
    container.appendChild(chatContent);
    
    // Set user info
    const currentUser = authService.getUser();
    if (currentUser) {
        const userInfo = document.getElementById('user-info');
        userInfo.innerHTML = `
            <div class="user-avatar">${currentUser.username.charAt(0).toUpperCase()}</div>
            <div>
                <div class="user-name">${currentUser.username}</div>
                <div class="user-status status-${currentUser.status.toLowerCase()}">
                    <span class="status-indicator"></span>
                    ${currentUser.status.toLowerCase()}
                </div>
            </div>
        `;
    }
    
    // Initialize chat service
    await chatService.init();
    
    // Show toast notification
    showToast('Success', 'Connected to chat server.', 'success');
}

/**
 * Show toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error)
 */
function showToast(title, message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon} toast-icon"></i>
        <div class="toast-message">
            <strong>${title}</strong>
            <div>${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add close event
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
} 