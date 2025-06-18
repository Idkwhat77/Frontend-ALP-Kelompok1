class NotificationManager {
    constructor() {
        this.notifications = [];
        this.currentUser = null;
        this.websocketManager = null;
        this.storageKey = null; // Add this property
        this.init();
    }

    async init() {
        console.log('=== Initializing Notification Manager ===');
        await this.loadCurrentUser();
        this.setupWebSocket();
        this.loadExistingNotifications(); // Now called after user is loaded
        this.setupEventListeners();
        this.checkEmptyState();
    }

    async loadCurrentUser() {
        try {
            this.currentUser = window.apiClient?.getCurrentUser();
            if (this.currentUser) {
                console.log('Current user loaded for notifications:', this.currentUser);
                // Set user-specific storage key
                const userId = this.currentUser.id || this.currentUser.userId || this.currentUser.user_id;
                this.storageKey = `ruangkerja_notifications_${userId}`;
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    setupWebSocket() {
        if (window.webSocketManager) {
            this.websocketManager = window.webSocketManager;
            
            // Connect WebSocket if not already connected
            if (this.currentUser && !this.websocketManager.isConnected) {
                console.log('🔌 Connecting WebSocket for notifications...');
                this.websocketManager.connect(this.currentUser.id);
            }
            
            // Add this notification manager as a message handler
            this.websocketManager.addMessageHandler((message) => {
                console.log('🔔 Notification Manager received message:', message);
                this.handleIncomingMessage(message);
            });
            
            console.log('✅ Notification Manager connected to WebSocket');
        } else {
            console.warn('⚠️ WebSocket Manager not available');
            // Retry after a delay
            setTimeout(() => {
                this.setupWebSocket();
            }, 2000);
        }
    }

    handleIncomingMessage(message) {
        console.log('📨 Processing message for notification:', message);
        
        // Don't create notification for own messages
        if (message.senderId === this.currentUser?.id) {
            console.log('⏭️ Skipping notification for own message');
            return;
        }
        
        // Create notification object
        const notification = {
            id: `msg_${message.id}_${Date.now()}`,
            type: 'message',
            subType: 'direct_message',
            title: message.senderName || 'New Message',
            content: message.content,
            timestamp: message.createdAt || new Date().toISOString(),
            senderId: message.senderId,
            senderName: message.senderName,
            senderImage: message.senderProfileImageUrl || 'img/default-profile.png',
            isRead: false,
            isNew: true
        };

        // Add to notifications array
        this.notifications.unshift(notification);
        
        // Update UI if on notification page
        if (window.location.pathname.includes('notification.html')) {
            this.addNotificationToUI(notification);
            this.checkEmptyState();
        }
        
        // Update notification badge
        this.updateNotificationBadge();
        
        // Show browser notification if permission granted
        this.showBrowserNotification(notification);
        
        // Store in localStorage for persistence
        this.saveNotifications();
        
        console.log('✅ Notification created and processed');
    }

    addNotificationToUI(notification) {
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;

        // Hide empty state
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Check if "Today" section exists, if not create it
        let todaySection = document.querySelector('[data-section="today"]');
        if (!todaySection) {
            todaySection = document.createElement('div');
            todaySection.className = 'p-4 bg-gray-50 dark:bg-gray-700/30';
            todaySection.setAttribute('data-section', 'today');
            todaySection.innerHTML = '<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Today</h3>';
            
            // Insert at the beginning of notification list
            notificationList.insertBefore(todaySection, notificationList.firstChild);
        }

        // Create notification element
        const notificationElement = this.createNotificationElement(notification);
        
        // Insert after today section
        const nextSibling = todaySection.nextSibling;
        notificationList.insertBefore(notificationElement, nextSibling);

        // Animate in
        setTimeout(() => {
            notificationElement.classList.add('animate-fade-in');
        }, 100);
    }

    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `p-4 notification-unread hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer`;
        div.setAttribute('data-notification-id', notification.id);

        const timeAgo = this.formatTimeAgo(notification.timestamp);
        const imageUrl = notification.senderImage.startsWith('http') 
            ? notification.senderImage 
            : `http://localhost:8080${notification.senderImage}`;

        div.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <img class="h-10 w-10 rounded-full" 
                         src="${imageUrl}" 
                         alt="${notification.senderName}"
                         onerror="this.src='img/default-profile.png'">
                </div>
                <div class="ml-3 flex-1">
                    <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                            ${notification.senderName} <span class="notification-dot ml-1"></span>
                            <span class="notification-type type-message">Direct Message</span>
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${timeAgo}</p>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        ${this.escapeHtml(notification.content)}
                    </p>
                    <div class="mt-2 flex space-x-2">
                        <button class="text-xs px-3 py-1 bg-lilac-100 dark:bg-gray-700 text-lilac-700 dark:text-lilac-300 rounded-full" 
                                onclick="window.location.href='chat.html?user=${notification.senderId}'">
                            Reply
                        </button>
                        <button class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full" 
                                onclick="window.location.href='chat.html?user=${notification.senderId}'">
                            View Chat
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add click handler to mark as read
        div.addEventListener('click', () => {
            this.markAsRead(notification.id);
        });

        return div;
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }

    showBrowserNotification(notification) {
        if (Notification.permission === 'granted') {
            new Notification(`New message from ${notification.senderName}`, {
                body: notification.content,
                icon: notification.senderImage,
                tag: `message_${notification.senderId}` // Prevents duplicate notifications
            });
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            notification.isNew = false;
        }

        // Update UI
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
            element.classList.remove('notification-unread');
            const dot = element.querySelector('.notification-dot');
            if (dot) dot.remove();
        }

        this.updateNotificationBadge();
        this.saveNotifications();
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.isRead = true;
            notification.isNew = false;
        });

        // Update UI
        document.querySelectorAll('.notification-unread').forEach(el => {
            el.classList.remove('notification-unread');
            const dot = el.querySelector('.notification-dot');
            if (dot) dot.remove();
        });

        this.updateNotificationBadge();
        this.saveNotifications();
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.isRead).length;
        const badges = document.querySelectorAll('.notification-badge');
        
        badges.forEach(badge => {
            if (unreadCount > 0) {
                badge.style.display = 'flex';
                if (unreadCount > 9) {
                    badge.textContent = '9+';
                } else {
                    badge.textContent = unreadCount;
                }
            } else {
                badge.style.display = 'none';
            }
        });
    }

    loadExistingNotifications() {
        if (!this.storageKey) {
            console.warn('No storage key available - user not loaded yet');
            return;
        }
        
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.notifications = JSON.parse(stored);
                this.updateNotificationBadge();
                
                // Display notifications if on notification page
                if (window.location.pathname.includes('notification.html')) {
                    this.displayStoredNotifications();
                }
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    displayStoredNotifications() {
        if (this.notifications.length === 0) {
            this.checkEmptyState();
            return;
        }

        // Group notifications by date
        const groups = this.groupNotificationsByDate(this.notifications);
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;

        // Clear existing content except empty state
        const emptyState = document.getElementById('empty-state');
        notificationList.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Display grouped notifications
        Object.keys(groups).forEach(dateKey => {
            // Add date header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'p-4 bg-gray-50 dark:bg-gray-700/30';
            dateHeader.setAttribute('data-section', dateKey.toLowerCase());
            dateHeader.innerHTML = `<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">${dateKey}</h3>`;
            notificationList.appendChild(dateHeader);

            // Add notifications for this date
            groups[dateKey].forEach(notification => {
                const element = this.createNotificationElement(notification);
                notificationList.appendChild(element);
            });
        });
    }

    groupNotificationsByDate(notifications) {
        const groups = {};
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        notifications.forEach(notification => {
            const notificationDate = new Date(notification.timestamp);
            let dateKey;

            if (this.isSameDay(notificationDate, today)) {
                dateKey = 'Today';
            } else if (this.isSameDay(notificationDate, yesterday)) {
                dateKey = 'Yesterday';
            } else {
                dateKey = notificationDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                });
            }

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(notification);
        });

        return groups;
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    checkEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const notificationList = document.getElementById('notification-list');
        
        if (!emptyState || !notificationList) return;

        if (this.notifications.length === 0) {
            emptyState.style.display = 'block';
            // Hide any existing notifications
            const notifications = notificationList.querySelectorAll('[data-notification-id]');
            notifications.forEach(n => n.style.display = 'none');
        } else {
            emptyState.style.display = 'none';
        }
    }

    saveNotifications() {
        if (!this.storageKey) {
            console.warn('No storage key available - cannot save notifications');
            return;
        }
        
        try {
            // Keep only last 50 notifications
            const toSave = this.notifications.slice(0, 50);
            localStorage.setItem(this.storageKey, JSON.stringify(toSave));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }

    setupEventListeners() {
        // Mark all as read button
        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    filterNotifications(filter) {
        // Implementation for filtering notifications
        console.log('Filtering notifications by:', filter);
        // You can implement specific filtering logic here
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearUserNotifications() {
        if (this.storageKey) {
            localStorage.removeItem(this.storageKey);
        }
        this.notifications = [];
        this.updateNotificationBadge();
        this.checkEmptyState();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔔 Initializing Notification Manager...');
    window.notificationManager = new NotificationManager();
});