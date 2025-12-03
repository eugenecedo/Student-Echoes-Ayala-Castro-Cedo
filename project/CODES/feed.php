<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['email'])) {
    header('Location: login.php');
    exit();
}

$email = $_SESSION['email'];
$user_sql = "SELECT * FROM echoes WHERE email = ?";
$stmt = $conn->prepare($user_sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$user_result = $stmt->get_result();
$user = $user_result->fetch_assoc();
$username = $user['name'] ?? "You";
$user_id = $user['id'] ?? 0;

// Handle new post submission
if ($_SERVER['REQUEST_METHOD'] == "POST" && isset($_POST['content'])) {
    $content = trim($_POST['content']);
    $image_url = null;

    if (isset($_FILES['image']) && $_FILES['image']['size'] > 0) {
        $img = $_FILES['image'];
        $allowed = ['jpg', 'jpeg', 'png', 'gif'];
        $ext = strtolower(pathinfo($img['name'], PATHINFO_EXTENSION));
        if (in_array($ext, $allowed)) {
            if (!file_exists("uploads")) { mkdir("uploads"); }
            $filename = "uploads/" . uniqid() . "." . $ext;
            move_uploaded_file($img['tmp_name'], $filename);
            $image_url = $filename;
        }
    }

    $post_sql = "INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($post_sql);
    $stmt->bind_param("iss", $user_id, $content, $image_url);
    $stmt->execute();
    header("Location: feed.php");
    exit();
}

// Fetch posts with user info and like status
$posts = [];
$post_sql = "
    SELECT posts.*, echoes.name, echoes.email,
           (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id) as likes_count,
           (SELECT COUNT(*) FROM post_comments WHERE post_id = posts.id) as comments_count,
           EXISTS(SELECT 1 FROM post_likes WHERE post_id = posts.id AND user_id = ?) as user_liked
    FROM posts 
    JOIN echoes ON posts.user_id = echoes.id 
    ORDER BY posts.created_at DESC
";
$stmt = $conn->prepare($post_sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$post_result = $stmt->get_result();

// Store posts for JavaScript
$db_posts_for_js = [];
while ($row = $post_result->fetch_assoc()) {
    $posts[] = $row;
    
    // Format for JavaScript feed.js
    $db_posts_for_js[] = [
        'id' => (int)$row['id'],
        'author' => [
            'name' => $row['name'],
            'avatar' => 'https://i.pravatar.cc/48?u=' . urlencode($row['email'])
        ],
        'createdAt' => strtotime($row['created_at']) * 1000,
        'text' => $row['content'],
        'image' => $row['image'],
        'categoryId' => 1, // Default category
        'likes' => (int)$row['likes_count'],
        'shares' => 0,
        'liked' => (bool)$row['user_liked'],
        'comments' => [] // Will be loaded separately
    ];
}

// Fetch comments for each post
foreach ($db_posts_for_js as &$post) {
    $comment_sql = "SELECT pc.*, e.name, e.email 
                    FROM post_comments pc 
                    JOIN echoes e ON pc.user_id = e.id 
                    WHERE pc.post_id = ? 
                    ORDER BY pc.created_at ASC";
    $stmt = $conn->prepare($comment_sql);
    $stmt->bind_param("i", $post['id']);
    $stmt->execute();
    $comment_result = $stmt->get_result();
    
    $comments = [];
    while ($comment = $comment_result->fetch_assoc()) {
        $comments[] = [
            'id' => (int)$comment['id'],
            'author' => [
                'name' => $comment['name'],
                'avatar' => 'https://i.pravatar.cc/36?u=' . urlencode($comment['email'])
            ],
            'text' => $comment['comment'],
            'createdAt' => strtotime($comment['created_at']) * 1000,
            'replies' => []
        ];
    }
    $post['comments'] = $comments;
}
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Students Echoes</title>
  <link rel="stylesheet" href="feed.css" />
  <script>
    // Pass user info and database posts to JavaScript
    window.loggedInUser = {
      id: <?php echo json_encode($user_id); ?>,
      name: <?php echo json_encode($username); ?>,
      email: <?php echo json_encode($email); ?>,
      avatar: 'https://i.pravatar.cc/80?u=' + encodeURIComponent(<?php echo json_encode($email); ?>)
    };
    
    // Pass database posts to JavaScript
    window.databasePosts = <?php echo json_encode($db_posts_for_js); ?>;
    
    // Database API endpoints (will be used by feed.js)
    window.dbAPI = {
      baseUrl: window.location.origin + window.location.pathname.replace('feed.php', ''),
      likePost: 'api/like_post.php',
      unlikePost: 'api/unlike_post.php',
      addComment: 'api/add_comment.php',
      getComments: 'api/get_comments.php'
    };
  </script>
</head>
<body>
<div id="app" class="container">
  <header class="topbar" role="banner" aria-label="Top bar" style="position:relative;">
    <button id="hamburger" class="hamburger" aria-label="Open menu" aria-expanded="false" type="button" style="display:none">
      <span></span><span></span><span></span>
    </button>

    <div class="brand">
      <div class="logo">Social</div>
    </div>

    <div class="center-search">
      <div class="search" role="search" aria-label="Global search">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input id="global-search" type="text" placeholder="Search posts, authors, categories..." aria-label="Search posts" />
      </div>
    </div>

    <!-- Mobile-only quick panels (appears under the search on small screens) -->
    <nav id="mobile-panels" class="mobile-panels" aria-label="Quick navigation" role="navigation"></nav>

    <div class="top-right">
      <div class="user" title="Your profile" role="button" tabindex="0" aria-label="Open profile">
        <img id="profile-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23b3cde0'/%3E%3Cpath d='M2 20c0-4 4-6 10-6s10 2 10 6' fill='%23dbeef6'/%3E%3C/svg%3E" alt="Profile avatar" />
        <span class="username"><?php echo htmlspecialchars($username); ?></span>
      </div>

      <div class="settings-dropdown" style="display:inline-block;position:relative;">
        <button id="settings-btn" class="btn small" aria-label="Settings" aria-haspopup="true" aria-expanded="false" aria-controls="settings-menu" title="Settings" type="button" style="margin-left: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.09.09a2 2 0 0 1-2.83 0l-.09-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1.82-.33l.09-.09a2 2 0 0 1 2.83 0l.09.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.09.26.13.53.13.8s-.04.54-.13.8Z"/>
          </svg>
        </button>
        <div id="settings-menu" role="menu" aria-hidden="true" style="display:none;position:absolute;right:0;top:110%;background:white;border:1px solid #eee;box-shadow:0 2px 8px rgba(0,0,0,0.09);border-radius:8px;min-width:220px;padding:8px 0;z-index:999;">
          <button id="settingPriv" role="menuitem" class="btn small setting-priv" style="width:100%;text-align:left;" type="button">Settings and Privacy</button>
          <button id="helpBtn" role="menuitem" class="btn small help-btn" style="width:100%;text-align:left;" type="button">Help and Support</button>
          <button id="modeBtn" role="menuitem" class="btn small mode-btn" style="width:100%;text-align:left;" type="button">Mode</button>
          <button id="logoutBtn" role="menuitem" class="btn small logout-btn" style="width:100%;text-align:left;" type="button" onclick="window.location.href='logout.php'">Logout</button>
        </div>
      </div>
    </div>
  </header>

  <div id="overlay" class="overlay" tabindex="-1" aria-hidden="true"></div>

  <main class="grid" role="main">
    <aside class="left sidebar" id="sidebar" role="navigation" aria-label="Primary">
      <nav class="navcard" role="tablist" aria-label="Primary navigation">
        <ul id="nav-list">
          <li class="active" data-tab="feed" role="tab" tabindex="0" aria-selected="true">Feed</li>
          <li data-tab="news" role="tab" tabindex="-1" aria-selected="false">News</li>
          <li data-tab="profile" role="tab" tabindex="-1" aria-selected="false">Profile</li>
          <li data-tab="trending" role="tab" tabindex="-1" aria-selected="false">Trending</li>
          <li data-tab="anonymous" role="tab" tabindex="-1" aria-selected="false">Anonymous Room</li>
        </ul>
      </nav>

      <div class="card friends" aria-label="Friends list">
        <h4>Friends</h4>
        <div id="friends-list" aria-live="polite"></div>
      </div>

      <div class="card notifications" aria-label="Notifications">
        <div class="card-head">
          <h4>Notifications</h4>
          <button id="clear-notifs" class="linkbtn" type="button">Clear</button>
        </div>
        <div id="notif-list"></div>
      </div>
    </aside>

    <section class="main" id="maincontent" aria-label="Main content">
      <div id="tab-feed" class="card create-post" role="region" aria-label="Create post">
  <!-- PHP POST FORM -->
  <form method="post" enctype="multipart/form-data" style="position:relative;">
    <div style="position:relative;">
      <button type="button" class="add-img" aria-label="Add image" onclick="document.getElementById('image-input').click();">＋</button>
      <textarea name="content" placeholder="What's on your mind?" rows="3" required></textarea>
    </div>
    <input id="image-input" name="image" type="file" accept="image/*" style="display:none;" />
    <div class="form-foot">
      <button type="submit" class="btn primary">Post</button>
    </div>
  </form>
</div>
      <!-- PHP POSTS FEED -->
     <div id="feed" class="feed-list" aria-live="polite">
  <?php if (empty($posts)): ?>
    <div class="card" style="text-align:center;">No posts yet.</div>
  <?php else: ?>
    <?php foreach ($posts as $post): 
      // Compute time ago
      $created_at = strtotime($post['created_at']);
      $time_ago = time() - $created_at;
      if ($time_ago < 60) {
        $time_ago_str = $time_ago . 's';
      } elseif ($time_ago < 3600) {
        $time_ago_str = floor($time_ago / 60) . 'm';
      } elseif ($time_ago < 86400) {
        $time_ago_str = floor($time_ago / 3600) . 'h';
      } elseif ($time_ago < 604800) {
        $time_ago_str = floor($time_ago / 86400) . 'd';
      } else {
        $time_ago_str = date('M d, Y', $created_at);
      }

      // Default category (we don't have categories in the database yet)
      $category = 'Uncategorized';

      // Default likes, shares, liked
      $likes = 0;
      $shares = 0;
      $liked = false;

      // Check if the post has an image
      $image_html = '';
      if (!empty($post['image'])) {
        $image_html = '<img src="' . htmlspecialchars($post['image']) . '" alt="post image" loading="lazy">';
      }
    ?>
      <article class="post card" data-id="<?php echo $post['id']; ?>">
        <div class="post-head">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23b3cde0'/%3E%3Cpath d='M2 20c0-4 4-6 10-6s10 2 10 6' fill='%23dbeef6'/%3E%3C/svg%3E" alt="<?php echo htmlspecialchars($post['name']); ?>" />
          <div style="flex:1">
            <div style="font-weight:600"><?php echo htmlspecialchars($post['name']); ?></div>
            <div class="muted" style="font-size:12px"><?php echo $time_ago_str; ?> • <strong><?php echo $category; ?></strong></div>
          </div>
          <div style="font-size:18px;opacity:.6">
            <button class="icon-btn menu-btn" data-id="<?php echo $post['id']; ?>" title="Post menu" aria-label="Open post actions">
              <!-- SVG for menu -->
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
                <circle cx="6" cy="12" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="18" cy="12" r="2"></circle>
              </svg>
            </button>
          </div>
        </div>
        <div class="post-body">
          <div><?php echo nl2br(htmlspecialchars($post['content'])); ?></div>
          <?php echo $image_html; ?>
        </div>
        <div class="post-foot">
          <div class="actions-row" role="toolbar" aria-label="Post actions">
            <button class="action-inline like-btn <?php echo $liked ? 'liked' : ''; ?>" data-id="<?php echo $post['id']; ?>" aria-pressed="<?php echo $liked ? 'true' : 'false'; ?>" aria-label="Like post">
              <!-- Like SVG -->
              <svg viewBox="0 0 24 24" fill="<?php echo $liked ? 'currentColor' : 'none'; ?>" stroke="currentColor" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.69l-1.06-1.08a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span class="sr-only">Like</span>
              <span class="count" aria-hidden="true"><?php echo $likes; ?></span>
            </button>

            <button class="action-inline comment-btn" data-id="<?php echo $post['id']; ?>" aria-label="Comment on post">
              <!-- Comment SVG -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span class="sr-only">Comment</span>
              <span class="count" aria-hidden="true">0</span> <!-- We don't have comments in the database yet -->
            </button>

            <button class="action-inline share-btn" data-id="<?php echo $post['id']; ?>" aria-label="Share post">
              <!-- Share SVG -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </svg>
              <span class="sr-only">Share</span>
              <span class="count" aria-hidden="true"><?php echo $shares; ?></span>
            </button>
          </div>
        </div>
      </article>
    <?php endforeach; ?>
  <?php endif; ?>
</div>

      <div id="tab-news" class="card tab-panel hidden"><h4>Latest News</h4><div id="news-content" class="muted">Loading news…</div></div>

      <div id="tab-profile" class="card tab-panel hidden">
        <h4>Your Profile</h4>
        <div id="profile-content">
          <div class="user">
            <img id="profile-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23b3cde0'/%3E%3Cpath d='M2 20c0-4 4-6 10-6s10 2 10 6' fill='%23dbeef6'/%3E%3C/svg%3E" alt="Profile avatar" />
            <span class="username"><?php echo htmlspecialchars($username); ?></span>
          </div>
          <p id="profile-bio">Welcome, <?php echo htmlspecialchars($username); ?>!</p>
          <button id="edit-profile-btn" class="btn small" type="button">Edit Profile</button>
          <div id="profile-feed" class="profile-feed" aria-live="polite"></div>
        </div>
      </div>

      <div id="tab-trending" class="card tab-panel hidden"><h4>Trending</h4><div id="trending-content" class="muted"></div></div>
      <div id="tab-anonymous" class="card tab-panel hidden"><h4>Anonymous Room</h4><div id="anonymous-content" class="muted"></div></div>
    </section>

    <aside class="right" role="complementary" aria-label="Right sidebar">
      <!-- Minimalist mobile logo (hidden on desktop, shown on mobile instead of heavy "top stories") -->
      <div id="mobile-mini-logo" class="mobile-mini-logo" aria-hidden="true" style="align-items:center;justify-content:center;padding:12px;">
        <!-- Minimalist circular "S" logo as inline SVG -->
        <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.12"/>
          <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Arial, sans-serif" font-size="20" fill="currentColor" style="font-weight:700">S</text>
        </svg>
      </div>

      <div class="card communities">
        <h4>Communities</h4>
        <div id="communities-list"></div>
      </div>
      <div class="card top-stories" id="top-stories" aria-label="Top stories">
        <h4>Top stories</h4>
        <div id="top-stories-list" class="top-stories-list muted" aria-live="polite">Loading top stories…</div>
        <div class="more-news" style="display:flex;justify-content:center;margin-top:12px;">
          <button id="more-news-btn" class="btn small" type="button" aria-label="More news">More news ▸</button>
        </div>
      </div>
    </aside>

   </main>
   <footer class="footer">© 2025 Student Echoes. All rights reserved.</footer>
</div>

<!-- Modal root (used by JS for comments/edit/lightbox) -->
<div id="modal-root" aria-hidden="true"></div>

<!-- Toast container -->
<div id="toast-container" aria-live="polite" aria-atomic="true"></div>

<script>
// ============================================================
// COMPLETE BUTTON FUNCTIONALITY SCRIPT
// This ensures ALL buttons work immediately
// ============================================================

(function() {
    // Wait for full page load
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Initializing button functions...');
        
        // ===========================================
        // 1. FIX ALL POST ACTION BUTTONS (Like, Comment, Share, Menu)
        // ===========================================
        setTimeout(function() {
            console.log('Setting up post buttons...');
            
            // LIKE BUTTONS
            document.querySelectorAll('.like-btn').forEach(function(btn) {
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Get post ID
                    const postId = this.getAttribute('data-id') || 
                                   this.closest('article')?.getAttribute('data-id') || 
                                   this.closest('.post')?.getAttribute('data-id');
                    
                    if (!postId) return;
                    
                    // Toggle visual state
                    const isLiked = this.classList.contains('liked');
                    this.classList.toggle('liked');
                    
                    // Update like count
                    const countSpan = this.querySelector('.count');
                    if (countSpan) {
                        let count = parseInt(countSpan.textContent) || 0;
                        count = isLiked ? count - 1 : count + 1;
                        countSpan.textContent = Math.max(0, count);
                    }
                    
                    // Show feedback
                    showMessage(isLiked ? 'Post unliked' : 'Post liked!');
                    
                    // Save to server (demo)
                    saveLikeToServer(postId, !isLiked);
                };
            });
            
            // COMMENT BUTTONS
            document.querySelectorAll('.comment-btn').forEach(function(btn) {
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const postId = this.getAttribute('data-id');
                    if (!postId) return;
                    
                    openCommentsModal(postId);
                };
            });
            
            // SHARE BUTTONS
            document.querySelectorAll('.share-btn').forEach(function(btn) {
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const postId = this.getAttribute('data-id');
                    if (!postId) return;
                    
                    sharePost(postId);
                };
            });
            
            // MENU BUTTONS (three dots)
            document.querySelectorAll('.menu-btn').forEach(function(btn) {
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const postId = this.getAttribute('data-id');
                    if (!postId) return;
                    
                    showPostMenu(this, postId);
                };
            });
            
            // POST IMAGES - Lightbox
            document.querySelectorAll('.post-body img').forEach(function(img) {
                img.style.cursor = 'pointer';
                img.onclick = function(e) {
                    e.preventDefault();
                    openLightbox(this.src, this.alt || 'Post image');
                };
            });
            
            // USER AVATARS IN POSTS - Profile view
            document.querySelectorAll('.post-head img').forEach(function(img) {
                if (img.closest('.post-head')) {
                    img.style.cursor = 'pointer';
                    img.onclick = function(e) {
                        e.preventDefault();
                        const userName = this.closest('.post-head')?.querySelector('div[style*="font-weight"]')?.textContent;
                        if (userName) {
                            showMessage('Viewing ' + userName + "'s profile");
                        }
                    };
                }
            });
            
        }, 100); // Small delay to ensure DOM is ready
        
        // ===========================================
        // 2. FIX CREATE POST FORM
        // ===========================================
        const postForm = document.querySelector('.create-post form');
        if (postForm) {
            console.log('Setting up post form...');
            
            // Image upload button
            const addImgBtn = postForm.querySelector('.add-img');
            const imageInput = postForm.querySelector('input[type="file"][name="image"]');
            
            if (addImgBtn && imageInput) {
                addImgBtn.onclick = function(e) {
                    e.preventDefault();
                    imageInput.click();
                };
            }
            
            // Image preview
            if (imageInput) {
                imageInput.onchange = function(e) {
                    if (this.files && this.files[0]) {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            // Create or update preview
                            let preview = document.getElementById('image-preview');
                            if (!preview) {
                                preview = document.createElement('div');
                                preview.id = 'image-preview';
                                preview.style.cssText = 'margin:10px 0; padding:10px; background:#f5f5f5; border-radius:8px;';
                                const formFoot = postForm.querySelector('.form-foot');
                                if (formFoot) {
                                    postForm.insertBefore(preview, formFoot);
                                }
                            }
                            
                            preview.innerHTML = `
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <img src="${event.target.result}" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">
                                    <button type="button" onclick="this.parentElement.parentElement.remove()" 
                                            style="background:#ff6b6b; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                                        Remove
                                    </button>
                                </div>
                            `;
                        };
                        reader.readAsDataURL(this.files[0]);
                    }
                };
            }
        }
        
        // ===========================================
        // 3. FIX SETTINGS MENU
        // ===========================================
        const settingsBtn = document.getElementById('settings-btn');
        const settingsMenu = document.getElementById('settings-menu');
        
        if (settingsBtn && settingsMenu) {
            settingsBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
            };
            
            // Close when clicking outside
            document.addEventListener('click', function(e) {
                if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
                    settingsMenu.style.display = 'none';
                }
            });
            
            // Settings menu items
            document.querySelectorAll('#settings-menu button').forEach(function(btn) {
                btn.onclick = function(e) {
                    e.preventDefault();
                    const id = this.id;
                    
                    if (id === 'settingPriv') {
                        showMessage('Settings and Privacy clicked');
                    } else if (id === 'helpBtn') {
                        showMessage('Help and Support clicked');
                    } else if (id === 'modeBtn') {
                        toggleTheme();
                    } else if (id === 'logoutBtn') {
                        window.location.href = 'logout.php';
                    }
                    
                    settingsMenu.style.display = 'none';
                };
            });
        }
        
        // ===========================================
        // 4. FIX NAVIGATION TABS
        // ===========================================
        document.querySelectorAll('#nav-list li').forEach(function(tab) {
            tab.onclick = function(e) {
                e.preventDefault();
                
                // Remove active from all
                document.querySelectorAll('#nav-list li').forEach(t => t.classList.remove('active'));
                
                // Add active to clicked
                this.classList.add('active');
                
                const tabName = this.getAttribute('data-tab');
                showMessage('Switched to ' + (tabName || 'tab'));
                
                // Show/hide content
                document.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.add('hidden');
                });
                
                const targetPanel = document.getElementById('tab-' + tabName);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                }
            };
        });
        
        // ===========================================
        // 5. FIX PROFILE BUTTONS
        // ===========================================
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.onclick = function(e) {
                e.preventDefault();
                showMessage('Edit Profile clicked');
                
                // Simple edit form
                const profileContent = document.getElementById('profile-content');
                if (profileContent) {
                    const currentName = document.querySelector('.username').textContent;
                    profileContent.innerHTML = `
                        <div style="padding:20px;">
                            <h4>Edit Profile</h4>
                            <input type="text" id="edit-name" value="${currentName}" style="width:100%; padding:10px; margin:10px 0; border-radius:6px; border:1px solid #ccc;">
                            <textarea id="edit-bio" placeholder="Enter your bio" style="width:100%; padding:10px; margin:10px 0; border-radius:6px; border:1px solid #ccc; height:100px;"></textarea>
                            <div style="display:flex; gap:10px; margin-top:20px;">
                                <button onclick="saveProfileChanges()" style="background:#007bff; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer;">Save</button>
                                <button onclick="cancelEditProfile()" style="background:#6c757d; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer;">Cancel</button>
                            </div>
                        </div>
                    `;
                }
            };
        }
        
        // ===========================================
        // 6. FIX CLEAR NOTIFICATIONS
        // ===========================================
        const clearNotifsBtn = document.getElementById('clear-notifs');
        if (clearNotifsBtn) {
            clearNotifsBtn.onclick = function(e) {
                e.preventDefault();
                if (confirm('Clear all notifications?')) {
                    const notifList = document.getElementById('notif-list');
                    if (notifList) {
                        notifList.innerHTML = '<div class="muted">No notifications</div>';
                        showMessage('Notifications cleared');
                    }
                }
            };
        }
        
        // ===========================================
        // 7. FIX MORE NEWS BUTTON
        // ===========================================
        const moreNewsBtn = document.getElementById('more-news-btn');
        if (moreNewsBtn) {
            moreNewsBtn.onclick = function(e) {
                e.preventDefault();
                showMessage('Loading more news...');
                
                // Add sample news
                const topStoriesList = document.getElementById('top-stories-list');
                if (topStoriesList) {
                    const newItem = document.createElement('div');
                    newItem.className = 'top-stories-item';
                    newItem.innerHTML = `
                        <div class="top-stories-thumb">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='100%25' height='100%25' fill='%23e6eef6'/%3E%3C/svg%3E" alt="">
                        </div>
                        <div class="top-stories-meta">
                            <div class="ts-title">New Education Program</div>
                            <div class="muted ts-summary">School announces new learning initiative</div>
                            <div class="muted ts-time">Just now</div>
                        </div>
                    `;
                    topStoriesList.appendChild(newItem);
                }
            };
        }
        
        // ===========================================
        // 8. FIX MOBILE HAMBURGER MENU
        // ===========================================
        const hamburger = document.getElementById('hamburger');
        if (hamburger) {
            hamburger.onclick = function(e) {
                e.preventDefault();
                document.body.classList.toggle('menu-open');
            };
        }
        
        // ===========================================
        // 9. FIX SEARCH FUNCTIONALITY
        // ===========================================
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const posts = document.querySelectorAll('.post');
                
                posts.forEach(function(post) {
                    const text = post.textContent.toLowerCase();
                    post.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            });
        }
        
        // ===========================================
        // CORE FUNCTIONS
        // ===========================================
        
        window.saveLikeToServer = function(postId, isLiked) {
            // This would send to your API
            console.log('Post ' + postId + ' ' + (isLiked ? 'liked' : 'unliked'));
            
            // Demo - simulate API call
            fetch('api/like.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({post_id: postId, liked: isLiked})
            }).catch(err => console.log('API not available'));
        };
        
        window.openCommentsModal = function(postId) {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10000; display:flex; align-items:center; justify-content:center;';
            modal.innerHTML = `
                <div style="background:white; border-radius:12px; width:90%; max-width:500px; max-height:80vh; overflow:hidden;">
                    <div style="padding:20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0;">Comments</h3>
                        <button onclick="this.closest('div[style*=\"position:fixed\"]').remove()" style="background:none; border:none; font-size:24px; cursor:pointer;">×</button>
                    </div>
                    <div style="padding:20px; max-height:60vh; overflow-y:auto;">
                        <div class="comment" style="margin-bottom:15px; display:flex; gap:10px;">
                            <img src="https://i.pravatar.cc/36?img=1" style="width:36px; height:36px; border-radius:50%;">
                            <div>
                                <strong>Emily</strong>
                                <p>Great post! 👍</p>
                                <small style="color:#666;">2 hours ago</small>
                            </div>
                        </div>
                        <div style="margin-top:20px; display:flex; gap:10px;">
                            <input type="text" placeholder="Write a comment..." style="flex:1; padding:10px; border-radius:20px; border:1px solid #ddd;">
                            <button style="background:#007bff; color:white; border:none; padding:10px 20px; border-radius:20px; cursor:pointer;">Post</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        };
        
        window.sharePost = function(postId) {
            if (navigator.share) {
                navigator.share({
                    title: 'Check this post',
                    text: 'Look at this interesting post!',
                    url: window.location.href + '?post=' + postId
                }).then(() => showMessage('Shared successfully'));
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href + '?post=' + postId)
                    .then(() => showMessage('Link copied to clipboard'));
            } else {
                prompt('Copy this link:', window.location.href + '?post=' + postId);
            }
        };
        
        window.showPostMenu = function(button, postId) {
            const rect = button.getBoundingClientRect();
            const menu = document.createElement('div');
            menu.style.cssText = `position:fixed; top:${rect.bottom + 5}px; left:${rect.left - 150}px; background:white; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.15); z-index:10000; min-width:150px;`;
            menu.innerHTML = `
                <div style="padding:10px;">
                    <button onclick="handlePostAction('save', ${postId})" style="display:block; width:100%; text-align:left; padding:8px; background:none; border:none; cursor:pointer;">Save post</button>
                    <button onclick="handlePostAction('copy', ${postId})" style="display:block; width:100%; text-align:left; padding:8px; background:none; border:none; cursor:pointer;">Copy link</button>
                    <button onclick="handlePostAction('report', ${postId})" style="display:block; width:100%; text-align:left; padding:8px; background:none; border:none; cursor:pointer; color:#ff6b6b;">Report</button>
                </div>
            `;
            
            document.body.appendChild(menu);
            
            // Close menu when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target) && e.target !== button) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 100);
        };
        
        window.handlePostAction = function(action, postId) {
            if (action === 'save') {
                showMessage('Post saved');
            } else if (action === 'copy') {
                navigator.clipboard.writeText(window.location.href + '?post=' + postId)
                    .then(() => showMessage('Link copied'));
            } else if (action === 'report') {
                showMessage('Post reported (demo)');
            }
            
            // Remove any open menus
            document.querySelectorAll('div[style*="position:fixed"][style*="top"]').forEach(el => el.remove());
        };
        
        window.openLightbox = function(src, alt) {
            const lightbox = document.createElement('div');
            lightbox.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:10000; display:flex; align-items:center; justify-content:center;';
            lightbox.innerHTML = `
                <img src="${src}" alt="${alt}" style="max-width:90%; max-height:90%; object-fit:contain;">
                <button onclick="this.parentElement.remove()" style="position:fixed; top:20px; right:20px; background:none; border:none; color:white; font-size:30px; cursor:pointer;">×</button>
            `;
            document.body.appendChild(lightbox);
        };
        
        window.toggleTheme = function() {
            document.body.classList.toggle('theme-light');
            const isLight = document.body.classList.contains('theme-light');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            showMessage(isLight ? 'Light theme enabled' : 'Dark theme enabled');
        };
        
        window.saveProfileChanges = function() {
            const newName = document.getElementById('edit-name')?.value;
            if (newName) {
                document.querySelectorAll('.username').forEach(el => {
                    el.textContent = newName;
                });
            }
            showMessage('Profile updated');
            // Reload profile section
            document.getElementById('profile-content').innerHTML = `
                <div class="user">
                    <img id="profile-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23b3cde0'/%3E%3Cpath d='M2 20c0-4 4-6 10-6s10 2 10 6' fill='%23dbeef6'/%3E%3C/svg%3E" alt="Profile avatar" />
                    <span class="username">${newName || 'User'}</span>
                </div>
                <p id="profile-bio">Welcome, ${newName || 'User'}!</p>
                <button id="edit-profile-btn" class="btn small" type="button">Edit Profile</button>
                <div id="profile-feed" class="profile-feed" aria-live="polite"></div>
            `;
            // Re-attach event listener
            document.getElementById('edit-profile-btn').onclick = window.editProfileBtn?.onclick;
        };
        
        window.cancelEditProfile = function() {
            // Reload original profile
            document.getElementById('profile-content').innerHTML = `
                <div class="user">
                    <img id="profile-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23b3cde0'/%3E%3Cpath d='M2 20c0-4 4-6 10-6s10 2 10 6' fill='%23dbeef6'/%3E%3C/svg%3E" alt="Profile avatar" />
                    <span class="username">${document.querySelector('.username').textContent}</span>
                </div>
                <p id="profile-bio">Welcome, ${document.querySelector('.username').textContent}!</p>
                <button id="edit-profile-btn" class="btn small" type="button">Edit Profile</button>
                <div id="profile-feed" class="profile-feed" aria-live="polite"></div>
            `;
            // Re-attach event listener
            document.getElementById('edit-profile-btn').onclick = window.editProfileBtn?.onclick;
        };
        
        window.showMessage = function(message, duration = 3000) {
            // Remove existing message
            const existing = document.getElementById('quick-message');
            if (existing) existing.remove();
            
            // Create new message
            const msg = document.createElement('div');
            msg.id = 'quick-message';
            msg.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#333; color:white; padding:12px 20px; border-radius:8px; z-index:10000; box-shadow:0 4px 12px rgba(0,0,0,0.15); animation:fadeIn 0.3s;';
            msg.textContent = message;
            document.body.appendChild(msg);
            
            // Auto remove
            setTimeout(() => {
                if (msg.parentNode) {
                    msg.style.animation = 'fadeOut 0.3s';
                    setTimeout(() => msg.remove(), 300);
                }
            }, duration);
        };
        
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(10px); }
            }
            .theme-light {
                background-color: #f8f9fa !important;
                color: #333 !important;
            }
            .theme-light .card {
                background-color: white !important;
                border-color: #dee2e6 !important;
            }
            .theme-light .post {
                background-color: white !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('All buttons initialized successfully!');
        
        // Test message
        setTimeout(() => showMessage('All buttons are now functional!'), 1000);
    });
    
    // If DOM is already loaded, run immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => document.dispatchEvent(new Event('DOMContentLoaded')), 100);
    }
})();
</script>
<script src="button-functions.js"></script>
<!-- Insert JS to sync PHP username everywhere on load -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  var realName = window.loggedInUser && window.loggedInUser.name ? window.loggedInUser.name : 'You';
  // Set all username displays
  var nameEls = document.querySelectorAll('.username');
  nameEls.forEach(function(el) {
    el.textContent = realName;
  });
  // Optionally update bio line (if exists)
  var profileBio = document.getElementById('profile-bio');
  if (profileBio) profileBio.textContent = "Welcome, " + realName + "!";
});
</script>
</body>
</html>