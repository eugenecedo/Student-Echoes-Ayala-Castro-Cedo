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

<script src="feed.js"></script>
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