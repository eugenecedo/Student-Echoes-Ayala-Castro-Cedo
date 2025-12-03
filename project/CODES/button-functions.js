// button-functions.js
// Add functionality to all buttons in feed.php

document.addEventListener('DOMContentLoaded', function() {
    // =================================================================
    // 1. POST ACTION BUTTONS (Like, Comment, Share, Menu)
    // =================================================================
    
    // Function to attach event handlers to posts
    function attachPostEventHandlers() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                if (postId) {
                    toggleLikePost(postId, this);
                }
            });
        });
        
        // Comment buttons
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                if (postId) {
                    openComments(postId);
                }
            });
        });
        
        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                if (postId) {
                    sharePost(postId);
                }
            });
        });
        
        // Menu buttons
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                if (postId) {
                    openPostMenu(this, postId);
                }
            });
        });
        
        // Post images for lightbox
        document.querySelectorAll('.post-body img').forEach(img => {
            img.addEventListener('click', function(e) {
                e.preventDefault();
                const src = this.getAttribute('src');
                const alt = this.getAttribute('alt') || '';
                openImageLightbox(src, alt);
            });
        });
    }
    
    // Initialize post handlers
    attachPostEventHandlers();
    
    // =================================================================
    // 2. CREATE POST FORM
    // =================================================================
    
    const postForm = document.querySelector('form[method="post"]');
    if (postForm) {
        const addImgBtn = postForm.querySelector('.add-img');
        const imageInput = postForm.querySelector('#image-input');
        const textarea = postForm.querySelector('textarea[name="content"]');
        
        // Image upload button
        if (addImgBtn && imageInput) {
            addImgBtn.addEventListener('click', function(e) {
                e.preventDefault();
                imageInput.click();
            });
        }
        
        // Image preview functionality
        if (imageInput) {
            imageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        // Create preview element if it doesn't exist
                        let preview = document.getElementById('image-preview');
                        if (!preview) {
                            preview = document.createElement('div');
                            preview.id = 'image-preview';
                            preview.style.marginTop = '10px';
                            preview.style.position = 'relative';
                            postForm.querySelector('.form-foot').before(preview);
                        }
                        
                        preview.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${event.target.result}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">
                                <button type="button" class="btn small remove-preview" style="background: rgba(255,75,75,0.1); color: #ff6b6b;">
                                    Remove
                                </button>
                            </div>
                        `;
                        
                        // Remove preview button
                        preview.querySelector('.remove-preview').addEventListener('click', function() {
                            imageInput.value = '';
                            preview.remove();
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Form validation
        postForm.addEventListener('submit', function(e) {
            if (textarea && textarea.value.trim() === '') {
                e.preventDefault();
                showToast('Please write something before posting');
                textarea.focus();
            }
        });
    }
    
    // =================================================================
    // 3. PROFILE BUTTONS
    // =================================================================
    
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openProfileEditModal();
        });
    }
    
    // Profile avatar click
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
        profileAvatar.addEventListener('click', function(e) {
            e.preventDefault();
            openProfileView({ name: this.nextElementSibling.textContent });
        });
    }
    
    // =================================================================
    // 4. NAVIGATION AND TAB BUTTONS
    // =================================================================
    
    const navItems = document.querySelectorAll('#nav-list li');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.getAttribute('data-tab');
            if (tab) {
                setActiveTab(tab);
            }
        });
    });
    
    // =================================================================
    // 5. TOP-NAV BUTTONS
    // =================================================================
    
    // Search functionality
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('input', debounce(function() {
            filterPostsBySearch(this.value);
        }, 300));
        
        // Search icon click focuses input
        const searchIcon = document.querySelector('.center-search .icon');
        if (searchIcon) {
            searchIcon.addEventListener('click', function() {
                globalSearch.focus();
            });
        }
    }
    
    // User profile icon in top right
    const userProfileDiv = document.querySelector('.user');
    if (userProfileDiv) {
        userProfileDiv.addEventListener('click', function(e) {
            e.preventDefault();
            openProfileView(null); // Open own profile
        });
    }
    
    // =================================================================
    // 6. SIDEBAR BUTTONS
    // =================================================================
    
    // Clear notifications
    const clearNotifsBtn = document.getElementById('clear-notifs');
    if (clearNotifsBtn) {
        clearNotifsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearAllNotifications();
        });
    }
    
    // Friends list items
    const friendsList = document.getElementById('friends-list');
    if (friendsList) {
        // Event delegation for friend items
        friendsList.addEventListener('click', function(e) {
            const friendItem = e.target.closest('.friend');
            if (friendItem) {
                e.preventDefault();
                const friendName = friendItem.querySelector('div[style*="font-weight"]').textContent;
                openFriendProfile(friendName);
            }
        });
    }
    
    // =================================================================
    // 7. SETTINGS MENU BUTTONS
    // =================================================================
    
    // Settings dropdown toggle
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    
    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = settingsMenu.style.display === 'block';
            settingsMenu.style.display = isOpen ? 'none' : 'block';
        });
        
        // Close settings when clicking outside
        document.addEventListener('click', function(e) {
            if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
                settingsMenu.style.display = 'none';
            }
        });
    }
    
    // Settings menu items
    const settingPrivBtn = document.getElementById('settingPriv');
    const helpBtn = document.getElementById('helpBtn');
    const modeBtn = document.getElementById('modeBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (settingPrivBtn) {
        settingPrivBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openSettingsModal();
            settingsMenu.style.display = 'none';
        });
    }
    
    if (helpBtn) {
        helpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openHelpModal();
            settingsMenu.style.display = 'none';
        });
    }
    
    if (modeBtn) {
        modeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTheme();
            settingsMenu.style.display = 'none';
        });
    }
    
    if (logoutBtn) {
        // Remove inline onclick and add event listener
        logoutBtn.removeAttribute('onclick');
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            performLogout();
        });
    }
    
    // =================================================================
    // 8. RIGHT SIDEBAR BUTTONS
    // =================================================================
    
    // More news button
    const moreNewsBtn = document.getElementById('more-news-btn');
    if (moreNewsBtn) {
        moreNewsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadMoreNews();
        });
    }
    
    // =================================================================
    // 9. MOBILE NAVIGATION
    // =================================================================
    
    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', function(e) {
            e.preventDefault();
            toggleMobileMenu();
        });
    }
    
    // =================================================================
    // CORE FUNCTIONS
    // =================================================================
    
    function toggleLikePost(postId, button) {
        // Toggle like state visually
        button.classList.toggle('liked');
        const isLiked = button.classList.contains('liked');
        button.setAttribute('aria-pressed', isLiked);
        
        // Update like count
        const countSpan = button.querySelector('.count');
        if (countSpan) {
            let currentCount = parseInt(countSpan.textContent) || 0;
            currentCount = isLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
            countSpan.textContent = currentCount;
        }
        
        // Send AJAX request to save like
        fetch('api/like_post.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `post_id=${postId}&action=${isLiked ? 'like' : 'unlike'}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast(isLiked ? 'Post liked!' : 'Post unliked');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Revert visual state on error
            button.classList.toggle('liked');
            button.setAttribute('aria-pressed', !isLiked);
            if (countSpan) {
                let currentCount = parseInt(countSpan.textContent) || 0;
                countSpan.textContent = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
            }
            showToast('Error updating like');
        });
    }
    
    function openComments(postId) {
        // Use existing feed.js function if available
        if (typeof window.feedApp !== 'undefined' && typeof window.feedApp.openComments === 'function') {
            window.feedApp.openComments(postId);
        } else {
            // Fallback simple comment modal
            const post = document.querySelector(`article[data-id="${postId}"]`);
            if (post) {
                const author = post.querySelector('.post-head div[style*="font-weight"]').textContent;
                const content = post.querySelector('.post-body > div').textContent;
                
                const modalHtml = `
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Comments</h3>
                            <button class="close-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="original-post">
                                <strong>${author}</strong>
                                <p>${content.substring(0, 100)}${content.length > 100 ? '...' : ''}</p>
                            </div>
                            <div class="comments-list">
                                <div class="comment">
                                    <img src="https://i.pravatar.cc/36?img=1" alt="Emily">
                                    <div>
                                        <strong>Emily</strong>
                                        <p>Great post!</p>
                                        <span class="comment-time">2h ago</span>
                                    </div>
                                </div>
                            </div>
                            <div class="add-comment">
                                <img src="https://i.pravatar.cc/36" alt="You">
                                <input type="text" placeholder="Add a comment...">
                                <button class="btn small">Post</button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-overlay"></div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                
                // Close modal handlers
                document.querySelector('.close-modal').addEventListener('click', closeModal);
                document.querySelector('.modal-overlay').addEventListener('click', closeModal);
                
                function closeModal() {
                    document.querySelector('.modal').remove();
                    document.querySelector('.modal-overlay').remove();
                }
            }
        }
    }
    
    function sharePost(postId) {
        const post = document.querySelector(`article[data-id="${postId}"]`);
        if (post) {
            const author = post.querySelector('.post-head div[style*="font-weight"]').textContent;
            const content = post.querySelector('.post-body > div').textContent;
            const shareText = `${author}: ${content.substring(0, 50)}...`;
            const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Check out this post',
                    text: shareText,
                    url: shareUrl,
                })
                .then(() => showToast('Shared successfully'))
                .catch(error => console.log('Sharing cancelled', error));
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrl)
                    .then(() => showToast('Link copied to clipboard'))
                    .catch(err => showToast('Failed to copy link'));
            } else {
                // Fallback: prompt
                prompt('Copy this link to share:', shareUrl);
            }
        }
    }
    
    function openPostMenu(button, postId) {
        const rect = button.getBoundingClientRect();
        
        const menuHtml = `
            <div class="post-menu" style="position:fixed;top:${rect.bottom + 5}px;left:${rect.left - 100}px;z-index:1000;">
                <div class="menu-list">
                    <button class="menu-item" data-action="save">Save post</button>
                    <button class="menu-item" data-action="copy">Copy link</button>
                    <button class="menu-item" data-action="report">Report</button>
                    <button class="menu-item" data-action="delete" style="color:#ff6b6b;">Delete</button>
                </div>
            </div>
            <div class="menu-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', menuHtml);
        
        // Handle menu item clicks
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const action = this.getAttribute('data-action');
                handlePostAction(action, postId);
                closePostMenu();
            });
        });
        
        // Close menu when clicking overlay
        document.querySelector('.menu-overlay').addEventListener('click', closePostMenu);
        
        function closePostMenu() {
            document.querySelector('.post-menu')?.remove();
            document.querySelector('.menu-overlay')?.remove();
        }
    }
    
    function handlePostAction(action, postId) {
        switch(action) {
            case 'save':
                showToast('Post saved');
                break;
            case 'copy':
                navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?post=${postId}`)
                    .then(() => showToast('Link copied'))
                    .catch(() => showToast('Failed to copy'));
                break;
            case 'report':
                showToast('Post reported');
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this post?')) {
                    deletePost(postId);
                }
                break;
        }
    }
    
    function deletePost(postId) {
        fetch('api/delete_post.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `post_id=${postId}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelector(`article[data-id="${postId}"]`)?.remove();
                showToast('Post deleted');
            } else {
                showToast('Failed to delete post');
            }
        });
    }
    
    function openImageLightbox(src, alt) {
        const lightboxHtml = `
            <div class="lightbox">
                <button class="close-lightbox">&times;</button>
                <img src="${src}" alt="${alt}">
            </div>
            <div class="lightbox-overlay"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', lightboxHtml);
        
        document.querySelector('.close-lightbox').addEventListener('click', closeLightbox);
        document.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);
        
        function closeLightbox() {
            document.querySelector('.lightbox')?.remove();
            document.querySelector('.lightbox-overlay')?.remove();
        }
    }
    
    function openProfileEditModal() {
        const modalHtml = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Edit Profile</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="profile-edit-form">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" value="${document.querySelector('.username').textContent}">
                        </div>
                        <div class="form-group">
                            <label>Bio</label>
                            <textarea name="bio" rows="3">${document.getElementById('profile-bio')?.textContent || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Profile Picture</label>
                            <input type="file" name="avatar" accept="image/*">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn primary">Save Changes</button>
                            <button type="button" class="btn cancel-edit">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-overlay"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const form = document.getElementById('profile-edit-form');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            saveProfileChanges(formData);
            closeModal();
        });
        
        document.querySelector('.close-modal').addEventListener('click', closeModal);
        document.querySelector('.modal-overlay').addEventListener('click', closeModal);
        document.querySelector('.cancel-edit').addEventListener('click', closeModal);
        
        function closeModal() {
            document.querySelector('.modal')?.remove();
            document.querySelector('.modal-overlay')?.remove();
        }
    }
    
    function saveProfileChanges(formData) {
        fetch('api/update_profile.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update UI
                document.querySelectorAll('.username').forEach(el => {
                    el.textContent = data.name || el.textContent;
                });
                if (data.avatar) {
                    document.querySelectorAll('.user img').forEach(img => {
                        img.src = data.avatar;
                    });
                }
                showToast('Profile updated');
            }
        });
    }
    
    function setActiveTab(tab) {
        // Update nav
        document.querySelectorAll('#nav-list li').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-tab') === tab);
        });
        
        // Show/hide panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('hidden', panel.id !== `tab-${tab}`);
        });
        
        // Special handling for feed
        const feedCard = document.getElementById('tab-feed');
        const feedList = document.getElementById('feed');
        
        if (tab === 'feed') {
            feedCard?.classList.remove('hidden');
            feedList?.classList.remove('hidden');
        } else {
            feedCard?.classList.add('hidden');
            feedList?.classList.add('hidden');
        }
        
        // Load tab content
        loadTabContent(tab);
    }
    
    function loadTabContent(tab) {
        switch(tab) {
            case 'news':
                fetchNews();
                break;
            case 'trending':
                loadTrending();
                break;
            case 'anonymous':
                loadAnonymousRoom();
                break;
        }
    }
    
    function filterPostsBySearch(query) {
        const posts = document.querySelectorAll('.post');
        posts.forEach(post => {
            const text = post.textContent.toLowerCase();
            post.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }
    
    function openSettingsModal() {
        showToast('Settings modal opened (demo)');
        // Implementation would show settings modal
    }
    
    function openHelpModal() {
        showToast('Help modal opened (demo)');
        // Implementation would show help modal
    }
    
    function toggleTheme() {
        document.body.classList.toggle('theme-light');
        const isLight = document.body.classList.contains('theme-light');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        showToast(isLight ? 'Light theme enabled' : 'Dark theme enabled');
    }
    
    function performLogout() {
        fetch('logout.php', { method: 'POST' })
            .then(() => {
                window.location.href = 'login.php';
            })
            .catch(() => {
                window.location.href = 'login.php';
            });
    }
    
    function clearAllNotifications() {
        const notifList = document.getElementById('notif-list');
        if (notifList) {
            notifList.innerHTML = '<div class="muted">No notifications</div>';
            showToast('Notifications cleared');
        }
    }
    
    function openFriendProfile(friendName) {
        showToast(`Opening ${friendName}'s profile`);
        // Implementation would show friend profile
    }
    
    function loadMoreNews() {
        showToast('Loading more news...');
        // Implementation would load more news
    }
    
    function toggleMobileMenu() {
        const sidebar = document.querySelector('.left.sidebar');
        const overlay = document.getElementById('overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
        }
    }
    
    function openProfileView(userData) {
        setActiveTab('profile');
        showToast('Profile opened');
    }
    
    function fetchNews() {
        const newsContent = document.getElementById('news-content');
        if (newsContent) {
            newsContent.innerHTML = `
                <div class="news-item">
                    <h4>Latest School Updates</h4>
                    <p>New semester starts next week. Don't forget to register for your classes!</p>
                    <span class="news-time">2 hours ago</span>
                </div>
                <div class="news-item">
                    <h4>Student Activities</h4>
                    <p>Join the coding club meeting this Friday at 4 PM in room 302.</p>
                    <span class="news-time">1 day ago</span>
                </div>
            `;
        }
    }
    
    function loadTrending() {
        const trendingContent = document.getElementById('trending-content');
        if (trendingContent) {
            trendingContent.innerHTML = `
                <div class="trending-item">
                    <strong>#ExamPrep</strong>
                    <span>245 posts</span>
                </div>
                <div class="trending-item">
                    <strong>#WeekendPlans</strong>
                    <span>189 posts</span>
                </div>
            `;
        }
    }
    
    function loadAnonymousRoom() {
        const anonymousContent = document.getElementById('anonymous-content');
        if (anonymousContent) {
            anonymousContent.innerHTML = `
                <div class="anonymous-posts">
                    <h4>Anonymous Room</h4>
                    <p>Post anonymously here. Your identity will be hidden.</p>
                    <button class="btn primary" id="add-anon-post">Add Anonymous Post</button>
                </div>
            `;
            
            document.getElementById('add-anon-post').addEventListener('click', function() {
                showToast('Anonymous post feature');
            });
        }
    }
    
    function showToast(message, duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after duration
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('theme-light');
    }
    
    // Add CSS for modals and toasts
    addStyles();
});

function addStyles() {
    const styles = `
        .toast-message {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            z-index: 1001;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .modal-header {
            padding: 16px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-overlay, .lightbox-overlay, .menu-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        }
        
        .lightbox {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1001;
            max-width: 90vw;
            max-height: 90vh;
        }
        
        .lightbox img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
        }
        
        .close-modal, .close-lightbox {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        
        .post-menu {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            min-width: 150px;
        }
        
        .menu-list {
            display: flex;
            flex-direction: column;
        }
        
        .menu-item {
            padding: 12px 16px;
            border: none;
            background: none;
            text-align: left;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        }
        
        .menu-item:hover {
            background: #f5f5f5;
        }
        
        .menu-item:last-child {
            border-bottom: none;
        }
        
        .hidden {
            display: none !important;
        }
        
        /* Mobile menu styles */
        @media (max-width: 768px) {
            .left.sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
                position: fixed;
                top: 0;
                left: 0;
                height: 100vh;
                z-index: 1000;
                width: 80%;
                max-width: 300px;
                overflow-y: auto;
            }
            
            .left.sidebar.mobile-open {
                transform: translateX(0);
            }
            
            .overlay.active {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999;
            }
        }
        
        /* Theme styles */
        .theme-light {
            background: #f8f9fa;
            color: #333;
        }
        
        .theme-light .card {
            background: white;
            border-color: #e0e0e0;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}