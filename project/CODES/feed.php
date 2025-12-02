<?php
// START PHP SESSION AND DATABASE CONNECTION
session_start();
require_once 'config.php';

// Ensure user is logged in (modify if your flow differs)
if (!isset($_SESSION['email'])) {
    header('Location: log in.php');
    exit();
}

// Fetch user info
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

    // Handle image upload
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

// Fetch posts (latest first)
$posts = [];
$post_sql = "SELECT posts.*, echoes.name FROM posts JOIN echoes ON posts.user_id = echoes.id ORDER BY posts.created_at DESC";
$post_result = $conn->query($post_sql);
while ($row = $post_result->fetch_assoc()) {
    $posts[] = $row;
}
?>

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Students Echoes</title>
  <link rel="stylesheet" href="feed.css" />
  <!-- Pass PHP username/email into JS -->
  <script>
    window.loggedInUser = {
      name: <?php echo json_encode($username); ?>,
      email: <?php echo json_encode($email); ?>
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
        <!-- FORM POST: PHP handles this -->
        <form id="post-form" method="post" enctype="multipart/form-data" style="position:relative;">
          <div style="position:relative;">
            <button type="button" id="add-image-btn" class="add-img" aria-label="Add image" aria-controls="post-image" onclick="document.getElementById('post-image').click();">＋</button>
            <textarea id="post-text" name="content" placeholder="What's on your mind?" rows="3" aria-label="Post text"></textarea>
          </div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
          <input id="post-image" name="image" type="file" accept="image/*" style="display:none;" />
          </div>
          <img id="preview" class="preview" alt="preview" />
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
          <?php foreach ($posts as $post): ?>
            <div class="card post">
              <div class="post-header">
                <span class="post-user"><?= htmlspecialchars($post['name']) ?></span>
                <span class="post-date" style="float:right;font-size:smaller;">
                  <?= htmlspecialchars(date("M d, Y H:i", strtotime($post['created_at']))) ?>
                </span>
              </div>
              <div class="post-content"><?= nl2br(htmlspecialchars($post['content'])) ?></div>
              <?php if (!empty($post['image'])): ?>
                <div class="post-image"><img src="<?= htmlspecialchars($post['image']) ?>" style="max-width:100%;height:auto;" /></div>
              <?php endif; ?>
            </div>
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