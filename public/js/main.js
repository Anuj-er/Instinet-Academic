document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.io connection
    if (typeof io !== 'undefined') {
        const socket = io();

        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket server');
        });

        // Listen for new announcements
        socket.on('newAnnouncement', (announcement) => {
            console.log('🔔 New announcement received:', announcement);
            
            // Show browser notification (if permission granted)
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('📢 New Announcement', {
                    body: announcement.title,
                    icon: '/images/logo.png',
                    tag: 'announcement-' + announcement._id
                });
            }

            // Show in-page alert
            showAnnouncementAlert(announcement);

            // If on announcements page, prepend new announcement to list
            const announcementsContainer = document.querySelector('.announcements-container');
            if (announcementsContainer) {
                prependAnnouncementToList(announcement);
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from WebSocket server');
        });

        // Request notification permission on page load
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }

    // Toggle mobile menu
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('show');
        });
    }

    // Form validation
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!validateEmail(email)) {
                e.preventDefault();
                showError('Please enter a valid email address.');
            }
            
            if (password.length < 6) {
                e.preventDefault();
                showError('Password must be at least 6 characters long.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (firstName.trim() === '' || lastName.trim() === '') {
                e.preventDefault();
                showError('Please enter your first and last name.');
            }
            
            if (!validateEmail(email)) {
                e.preventDefault();
                showError('Please enter a valid email address.');
            }
            
            if (password.length < 6) {
                e.preventDefault();
                showError('Password must be at least 6 characters long.');
            }
        });
    }

    // Dashboard functionality
    initDashboardElements();

    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Helper functions
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function showError(message) {
    let errorDiv = document.querySelector('.error-message');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        
        const form = document.querySelector('form');
        const submitButton = form.querySelector('button[type="submit"]');
        form.insertBefore(errorDiv, submitButton);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function initDashboardElements() {
    // Load dashboard data if on dashboard pages
    if (window.location.pathname.includes('Dashboard')) {
        loadAnnouncementsData();
        
        // Initialize charts if specific dashboard sections exist
        if (document.getElementById('student-performance-chart')) {
            initStudentPerformanceChart();
        }
        
        if (document.getElementById('course-enrollment-chart')) {
            initCourseEnrollmentChart();
        }
        
        // Add event listeners for dashboard actions
        const actionButtons = document.querySelectorAll('.table-actions button');
        if (actionButtons.length > 0) {
            actionButtons.forEach(button => {
                button.addEventListener('click', handleTableAction);
            });
        }
    }
}

function loadAnnouncementsData() {
    const announcementsSection = document.getElementById('announcements-section');
    
    if (announcementsSection) {
        // Fetch announcements data from API
        fetch('/api/announcements')
            .then(response => response.json())
            .then(data => {
                const announcementsList = announcementsSection.querySelector('.announcements-list');
                if (announcementsList && data.announcements) {
                    displayAnnouncements(announcementsList, data.announcements);
                }
            })
            .catch(error => {
                console.error('Error loading announcements:', error);
            });
    }
}

function displayAnnouncements(container, announcements) {
    // Clear existing content
    container.innerHTML = '';
    
    if (announcements.length === 0) {
        container.innerHTML = '<p>No announcements at this time.</p>';
        return;
    }
    
    announcements.forEach(announcement => {
        const announcementItem = document.createElement('div');
        announcementItem.className = 'announcement-item';
        
        const formattedDate = new Date(announcement.createdAt || announcement.date).toLocaleDateString();
        const creatorName = announcement.createdBy 
            ? `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}` 
            : 'Staff';
        
        announcementItem.innerHTML = `
            <div class="announcement-header">
                <h3 class="announcement-title">${announcement.title}</h3>
                <div class="announcement-meta">
                    <span class="announcement-author">By ${creatorName}</span>
                    <span class="announcement-date">${formattedDate}</span>
                </div>
            </div>
            <div class="announcement-content">
                <p>${announcement.message || announcement.content}</p>
            </div>
        `;
        
        container.appendChild(announcementItem);
    });
}

function handleTableAction(e) {
    const action = e.currentTarget.dataset.action;
    const itemId = e.currentTarget.dataset.id;
    
    if (action === 'view') {
        // Handle view action
        console.log(`View item ${itemId}`);
        // Implement view functionality
    } else if (action === 'edit') {
        // Handle edit action
        console.log(`Edit item ${itemId}`);
        // Implement edit functionality
    } else if (action === 'delete') {
        // Handle delete action with confirmation
        if (confirm('Are you sure you want to delete this item?')) {
            console.log(`Delete item ${itemId}`);
            // Implement delete functionality
        }
    }
}

// WebSocket helper functions
function showAnnouncementAlert(announcement) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = 'announcement-alert';
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
    `;
    
    const creatorName = announcement.createdBy 
        ? `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}` 
        : 'Staff';
    
    alert.innerHTML = `
        <strong>📢 New Announcement</strong><br>
        <div style="margin-top: 8px;">
            <strong>${announcement.title}</strong><br>
            <small>Posted by ${creatorName}</small>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

function prependAnnouncementToList(announcement) {
    const announcementsList = document.querySelector('.announcements-list');
    if (!announcementsList) return;
    
    const announcementItem = document.createElement('div');
    announcementItem.className = 'announcement-item new-announcement';
    announcementItem.style.animation = 'fadeIn 0.5s ease-out';
    
    const createdDate = new Date(announcement.createdAt).toLocaleString();
    const creatorName = announcement.createdBy 
        ? `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}` 
        : 'Unknown';
    
    announcementItem.innerHTML = `
        <div class="announcement-header">
            <h3>${announcement.title}</h3>
            <span class="announcement-meta">
                <span class="author">By ${creatorName}</span> | 
                <span class="date">${createdDate}</span>
            </span>
        </div>
        <div class="announcement-body">
            <p>${announcement.message}</p>
        </div>
    `;
    
    // Prepend to list
    announcementsList.insertBefore(announcementItem, announcementsList.firstChild);
    
    // Remove 'new' highlight after 3 seconds
    setTimeout(() => {
        announcementItem.classList.remove('new-announcement');
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .new-announcement {
        background-color: #e8f5e9 !important;
        border-left: 4px solid #4CAF50 !important;
    }
`;
document.head.appendChild(style);