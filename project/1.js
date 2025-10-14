/* =========================
   Student Echoes - script.js
   Upgraded: Marketplace -> Offline News
   Keep original behavior for posts/profiles/etc.
   ========================= */

/* LocalStorage keys */
const LS_USERS = 'se_users';
const LS_POSTS = 'se_posts';
const LS_CURRENT = 'se_current';
const LS_DRAFT = 'se_draft';
const LS_SAVED_ITEMS = 'se_saved_items';
const LS_MESSAGES = 'se_messages';
const LS_NOTIFS = 'se_notifications';
const LS_STORIES = 'se_stories';
const LS_THEME = 'se_theme';
const LS_MARKET = 'se_market'; // reused for news items

/* App state */
let users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
let posts = JSON.parse(localStorage.getItem(LS_POSTS) || '[]');
let savedMarket = JSON.parse(localStorage.getItem(LS_SAVED_ITEMS) || '[]');
let currentUser = localStorage.getItem(LS_CURRENT) || null;
let messages = JSON.parse(localStorage.getItem(LS_MESSAGES) || '{}');
let notifications = JSON.parse(localStorage.getItem(LS_NOTIFS) || '{}');
let stories = JSON.parse(localStorage.getItem(LS_STORIES) || '[]');

/* Sample offline news (used if no saved in localStorage) */
let marketItems = JSON.parse(localStorage.getItem(LS_MARKET) || 'null') || [
  { id: 'news1', title: 'University to Open New Study Hall', desc: 'A new 24/7 study hall will open in Block C this semester.', price: 'Campus Bulletin', img: 'https://picsum.photos/seed/news1/400/300', seller: 'Campus Bulletin', url: '#' },
  { id: 'news2', title: 'Hackathon Winners Announced', desc: 'Team Orion wins the annual inter-college hackathon.', price: 'Campus News', img: 'https://picsum.photos/seed/news2/400/300', seller: 'Campus News', url: '#' },
  { id: 'news3', title: 'Library Hours Extended', desc: 'Library will be open till midnight during exam week.', price: 'Library', img: 'https://picsum.photos/seed/news3/400/300', seller: 'Library', url: '#' },
  { id: 'news4', title: 'Student Art Exhibit Next Friday', desc: 'Showcasing student works at the campus gallery.', price: 'Arts Dept', img: 'https://picsum.photos/seed/news4/400/300', seller: 'Arts Dept', url: '#' }
];

/* -----------------------
   Utilities (toast / save)
   ----------------------- */
function showToast(msg, timeout=2200){
  const t = document.getElementById('toast');
  if(!t) return alert(msg);
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), timeout);
}

function saveUsers(){ localStorage.setItem(LS_USERS, JSON.stringify(users)); }
function savePosts(){ localStorage.setItem(LS_POSTS, JSON.stringify(posts)); }
function saveMarketState(){ localStorage.setItem(LS_MARKET, JSON.stringify(marketItems)); }
function saveSavedItems(){ localStorage.setItem(LS_SAVED_ITEMS, JSON.stringify(savedMarket)); }
function saveMessages(){ localStorage.setItem(LS_MESSAGES, JSON.stringify(messages)); }
function saveNotifications(){ localStorage.setItem(LS_NOTIFS, JSON.stringify(notifications)); }
function saveStories(){ localStorage.setItem(LS_STORIES, JSON.stringify(stories)); }
function saveTheme(val){ localStorage.setItem(LS_THEME, val); }

/* -----------------------
   Keep current setter
   ----------------------- */
function setCurrent(user){
  currentUser = user;
  if(user) localStorage.setItem(LS_CURRENT, user);
  else localStorage.removeItem(LS_CURRENT);
}

/* -----------------------
   Auth: register/login (kept original behavior)
   ----------------------- */
function onRegister(){
  const u = document.getElementById('authUser').value.trim();
  const p = document.getElementById('authPass').value;
  if(!u || !p) return showToast('Please enter username & password');
  if(users[u]) return showToast('Username already taken');
  users[u] = { password: p, bio: '', pic:'', stats:{posts:0, likes:0, comments:0}, following: [], followers: [] };
  saveUsers();
  showToast('Registered 🎉 — please log in');
  document.getElementById('authUser').value = u;
}
function onLogin(){
  const u = document.getElementById('authUser').value.trim();
  const p = document.getElementById('authPass').value;
  if(!u || !p) return showToast('Enter username & password');
  if(!users[u] || users[u].password !== p) return showToast('Invalid credentials');
  setCurrent(u);
  openApp();
  showToast('Welcome back, ' + u + ' 👋');
}

/* -----------------------
   App open / UI wiring
   ----------------------- */
function openApp(){
  document.getElementById('authWrap').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  refreshProfileUI();
  renderPosts();
  loadDraft();
  updateCounts();
  showPage('feed', true);
  renderMarket();
  renderExplore();
  renderSavedItems();
  renderStories();
  renderTrending();
  renderNotificationsDot();
}

/* -----------------------
   Page switching
   ----------------------- */
function clearActiveNav(){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
}
function showPage(page, instant=false){
  const pages = ['feed','profile','explore','market','trending'];
  pages.forEach(p => {
    const el = document.getElementById(p + 'Page');
    if(el) el.classList.add('hidden');
  });

  clearActiveNav();
  if(page === 'profile'){
    document.getElementById('profilePage').classList.remove('hidden');
    document.getElementById('navProfile')?.classList.add('active');
    renderProfilePosts();
    refreshProfileUI();
  } else if(page === 'explore'){
    document.getElementById('explorePage').classList.remove('hidden');
    document.getElementById('navExplore')?.classList.add('active');
    renderExplore();
  } else if(page === 'market'){ // News page
    document.getElementById('marketPage').classList.remove('hidden');
    document.getElementById('navMarket')?.classList.add('active');
    renderMarket();
    renderSavedItems();
  } else if(page === 'trending'){
    document.getElementById('trendingPage').classList.remove('hidden');
    document.getElementById('navTrending')?.classList.add('active');
    renderTrending();
  } else {
    document.getElementById('feedPage').classList.remove('hidden');
    document.getElementById('navHome')?.classList.add('active');
    renderPosts();
  }

  window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
}

/* -----------------------
   Draft handling (kept)
   ----------------------- */
function saveDraft(){
  if(!currentUser) return;
  const text = document.getElementById('txtPost').value;
  localStorage.setItem(LS_DRAFT + '_' + currentUser, text);
  document.getElementById('draftNotice').textContent = text ? 'Draft saved' : '';
}
function loadDraft(){
  if(!currentUser) return;
  const val = localStorage.getItem(LS_DRAFT + '_' + currentUser) || '';
  document.getElementById('txtPost').value = val;
  document.getElementById('draftNotice').textContent = val ? 'Draft loaded' : '';
}
function clearDraft(){
  if(currentUser) localStorage.removeItem(LS_DRAFT + '_' + currentUser);
  document.getElementById('txtPost').value = '';
  const fp = document.getElementById('filePost'); if(fp) fp.value = '';
  document.getElementById('draftNotice').textContent = '';
}

/* -----------------------
   Create post (with image -> DataURL) + hashtag parsing
   ----------------------- */
function onCreatePost(){
  if(!currentUser) return showToast('Please login first');
  const text = document.getElementById('txtPost').value.trim();
  const file = document.getElementById('filePost').files[0];
  if(!text && !file) return showToast('Write something or attach an image');

  if(file){
    const reader = new FileReader();
    reader.onload = () => createPostObject(text, reader.result);
    reader.readAsDataURL(file);
  } else {
    createPostObject(text, null);
  }
}

function createPostObject(text, imageDataURL){
  const p = {
    id: Date.now(),
    user: currentUser,
    text: text,
    image: imageDataURL,
    likedBy: [],
    comments: [],
    createdAt: new Date().toISOString(),
    editedAt: null
  };
  posts.unshift(p);
  if(!users[currentUser].stats) users[currentUser].stats = {posts:0,likes:0,comments:0};
  users[currentUser].stats.posts++;
  saveUsers(); savePosts(); renderPosts(); clearDraft(); showToast('✅ Post shared successfully!'); updateCounts(); renderProfilePosts();
  notifyFollowersNewPost(currentUser, p);
}

/* notify followers */
function notifyFollowersNewPost(user, post){
  const u = users[user];
  if(!u || !u.following) return;
  Object.keys(users).forEach(username=>{
    const target = users[username];
    if(target && target.following && target.following.includes(user)){
      addNotification(username, 'followed_post', `${user} posted a new update`, {postId: post.id});
    }
  });
  saveNotifications();
}

/* -----------------------
   Render posts (with hashtag links)
   ----------------------- */
function renderPosts(filter=''){
  const container = document.getElementById('postsList');
  container.innerHTML = '';
  const filtered = posts.filter(post => {
    if(!filter) return true;
    const q = filter.toLowerCase();
    return post.user.toLowerCase().includes(q) || (post.text && post.text.toLowerCase().includes(q));
  });
  filtered.forEach(post => {
    const el = document.createElement('div');
    el.className = 'card post';
    const userObj = users[post.user] || {bio:'',pic:''};
    const avatar = userObj.pic || `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(post.user)}`;
    const liked = currentUser && post.likedBy.includes(currentUser);

    const commentsHtml = (post.comments || []).map(c => `<p><strong>@${escapeHtml(c.user)}</strong>: ${escapeHtml(c.text)}</p>`).join('');

    // convert hashtags to clickable links
    const textWithTags = (post.text || '').replace(/#([a-zA-Z0-9_]+)/g, (m, tag) => {
      return `<a href="javascript:void(0)" onclick="filterByTag('${encodeURIComponent('#'+tag)}')" class="tag">#${tag}</a>`;
    });

    el.innerHTML = `
      <div class="meta">
        <img class="user-avatar" src="${avatar}" alt="avatar">
        <div style="flex:1">
          <div style="display:flex;gap:8px;align-items:center">
            <div class="username" onclick="showProfile('${escapeHtml(post.user)}')">${escapeHtml(post.user)}</div>
            <div style="font-size:12px;color:var(--muted)">${new Date(post.createdAt).toLocaleString()} ${post.editedAt ? '(edited)' : ''}</div>
          </div>
          <div class="bio muted">${escapeHtml(userObj.bio || '')}</div>
        </div>
      </div>
      <div class="post-content"><div class="text">${textWithTags}</div>
        ${post.image ? `<img class="media" src="${post.image}" alt="post image">` : ''}
      </div>
      <div class="actions" style="display:flex;gap:12px;margin-top:10px">
        <button onclick="toggleLike(${post.id})">${liked ? '💔 Unlike' : '❤️ Like'} (${post.likedBy.length})</button>
        <button onclick="toggleCommentsArea(${post.id})">💬 Comment (${post.comments.length})</button>
        ${post.user === currentUser ? `<button onclick="openEditorModal(${post.id})">✏️ Edit</button> <button onclick="onDeletePost(${post.id})" class="danger">🗑 Delete</button>` : `<button onclick="showProfile('${escapeHtml(post.user)}')">View Profile</button>`}
        <button onclick="openPostModalById(${post.id})" class="small-btn">View</button>
      </div>
      <div id="comments-area-${post.id}" class="comments" style="display:none">
        ${commentsHtml}
        <div class="comment-input" style="display:flex;gap:8px;margin-top:8px">
          <input id="comment-input-${post.id}" placeholder="Write a comment..." onkeydown="if(event.key==='Enter') addComment(${post.id})" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:var(--white)">
          <button onclick="addComment(${post.id})" class="small-btn">Send</button>
        </div>
      </div>
    `;
    container.appendChild(el);
  });
  refreshProfileUI();
}

/* -----------------------
   Like / comment / edit / delete
   ----------------------- */
function toggleLike(postId){
  if(!currentUser) { showToast('Please login to like'); return; }
  const post = posts.find(p => p.id === postId);
  if(!post) return;
  const idx = post.likedBy.indexOf(currentUser);
  if(idx >= 0){
    post.likedBy.splice(idx,1);
    if(users[post.user] && users[post.user].stats) users[post.user].stats.likes = Math.max(0, users[post.user].stats.likes - 1);
  } else {
    post.likedBy.push(currentUser);
    if(users[post.user]){ if(!users[post.user].stats) users[post.user].stats = {posts:0,likes:0,comments:0}; users[post.user].stats.likes = (users[post.user].stats.likes || 0) + 1; }
    if(post.user !== currentUser) addNotification(post.user, 'like', `${currentUser} liked your post`, {postId});
  }
  savePosts(); saveUsers(); renderPosts(); renderProfilePosts(); updateCounts(); renderTrending(); renderNotificationsDot();
}
function toggleCommentsArea(postId){
  const el = document.getElementById('comments-area-' + postId);
  if(!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
function addComment(postId){
  if(!currentUser) { showToast('Please login to comment'); return; }
  const input = document.getElementById('comment-input-' + postId);
  if(!input) return;
  const text = input.value.trim();
  if(!text) return;
  const post = posts.find(p => p.id === postId);
  if(!post) return;
  post.comments.push({ user: currentUser, text, at: new Date().toISOString() });
  if(!users[currentUser].stats) users[currentUser].stats = {posts:0,likes:0,comments:0};
  users[currentUser].stats.comments = (users[currentUser].stats.comments || 0) + 1;
  savePosts(); saveUsers();
  input.value = '';
  renderPosts(); renderProfilePosts(); showToast('💬 Comment added');
  if(post.user !== currentUser) addNotification(post.user, 'comment', `${currentUser} commented on your post`, {postId});
  renderNotificationsDot();
}
function onEditPost(postId){
  const post = posts.find(p => p.id === postId);
  if(!post || post.user !== currentUser) return showToast('Cannot edit');
  openEditorModal(postId);
}
function onDeletePost(postId){
  const idx = posts.findIndex(p => p.id === postId);
  if(idx === -1) return;
  if(posts[idx].user !== currentUser) return showToast('Cannot delete');
  if(!confirm('Delete this post?')) return;
  posts.splice(idx,1);
  if(users[currentUser] && users[currentUser].stats) users[currentUser].stats.posts = Math.max(0, users[currentUser].stats.posts - 1);
  savePosts(); saveUsers(); renderPosts(); renderProfilePosts(); showToast('🗑 Post deleted'); updateCounts(); renderTrending();
}

/* -----------------------
   Profile functions (kept)
   ----------------------- */
function showProfile(username){
  if(!username) username = currentUser;
  if(!users[username]) return showToast('User not found');
  showPage('profile');
  refreshProfileUI(username);
  renderProfilePosts(username);
}
function refreshProfileUI(viewUser){
  const u = viewUser || currentUser;
  if(!u) return;
  const userObj = users[u] || {bio:'',pic:''};
  const pic = userObj.pic || `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(u)}`;
  document.getElementById('miniUser').textContent = u;
  document.getElementById('miniBio').textContent = userObj.bio || '';
  document.getElementById('composerAvatar').src = pic;
  document.getElementById('miniPic').src = pic;
  document.getElementById('miniPicRight') && (document.getElementById('miniPicRight').src = pic);
  document.getElementById('profilePicBig')?.src && (document.getElementById('profilePicBig').src = pic);
  document.getElementById('profileUser') && (document.getElementById('profileUser').textContent = u);
  document.getElementById('profileUserRight') && (document.getElementById('profileUserRight').textContent = u);
  document.getElementById('profileBioMini') && (document.getElementById('profileBioMini').textContent = userObj.bio || "No bio yet");
  document.getElementById('profileUsername') && (document.getElementById('profileUsername').value = u);
  document.getElementById('bio') && (document.getElementById('bio').value = userObj.bio || '');

  if(!users[u].stats) users[u].stats = {posts:0,likes:0,comments:0};
  const postsCount = users[u].stats.posts || 0;
  const likes = users[u].stats.likes || 0;
  const comments = users[u].stats.comments || 0;
  document.getElementById('statPosts') && (document.getElementById('statPosts').textContent = postsCount);
  document.getElementById('statLikes') && (document.getElementById('statLikes').textContent = likes);
  document.getElementById('statComments') && (document.getElementById('statComments').textContent = comments);
  document.getElementById('statPostsRight') && (document.getElementById('statPostsRight').textContent = postsCount);
  document.getElementById('statLikesRight') && (document.getElementById('statLikesRight').textContent = likes);
  document.getElementById('statCommentsRight') && (document.getElementById('statCommentsRight').textContent = comments);

  // build profile header with follow button when viewing another user
  const header = document.getElementById('profileHeader');
  if(header){
    header.innerHTML = '';
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.gap = '12px';
    left.style.alignItems = 'center';
    const img = document.createElement('img');
    img.id = 'profilePicBig';
    img.className = 'profile-pic';
    img.src = pic;
    img.alt = 'profile';
    img.style.width = '88px';
    img.style.height = '88px';
    img.style.borderRadius = '18px';
    left.appendChild(img);

    const rightDiv = document.createElement('div');
    rightDiv.style.flex = '1';
    rightDiv.innerHTML = `<h2 id="profileUser" style="margin:0;color:var(--white)">${escapeHtml(u)}</h2>
      <div id="profileBioMini" class="muted">${escapeHtml(userObj.bio || 'No bio yet')}</div>
      <div class="profile-stats" style="margin-top:8px">
        <div>Posts: <span id="statPosts">${postsCount}</span></div>
        <div>Likes: <span id="statLikes">${likes}</span></div>
        <div>Comments: <span id="statComments">${comments}</span></div>
      </div>`;
    left.appendChild(rightDiv);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.marginLeft = 'auto';

    if(u === currentUser){
      const changePhotoLabel = document.createElement('label');
      changePhotoLabel.style.cursor='pointer';
      changePhotoLabel.innerHTML = `<input id="profilePicInput" type="file" accept="image/*" style="display:none" /> <button class="small-btn">Change Photo</button>`;
      actions.appendChild(changePhotoLabel);
      const editBtn = document.createElement('button');
      editBtn.className = 'small-btn';
      editBtn.textContent = 'Edit Profile';
      editBtn.onclick = ()=>enterEditProfile();
      actions.appendChild(editBtn);
      const backBtn = document.createElement('button');
      backBtn.className = 'small-btn';
      backBtn.textContent = 'Back';
      backBtn.onclick = ()=> showPage('feed');
      actions.appendChild(backBtn);
    } else {
      const followBtn = document.createElement('button');
      followBtn.className = 'primary';
      followBtn.id = 'followBtn';
      const isFollowing = currentUser && users[currentUser] && users[currentUser].following && users[currentUser].following.includes(u);
      followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
      followBtn.onclick = ()=> toggleFollow(u);
      actions.appendChild(followBtn);
    }

    header.appendChild(left);
    header.appendChild(actions);
  }
}

/* profile bio/pic */
function updateBio(){
  const val = document.getElementById('bio').value.trim();
  if(!currentUser) return showToast('No current user');
  users[currentUser].bio = val;
  saveUsers(); renderPosts(); refreshProfileUI(); showToast('✏️ Bio updated!');
}
function updateProfilePic(e){
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    users[currentUser].pic = reader.result;
    saveUsers(); refreshProfileUI(); renderPosts(); showToast('🖼️ Profile picture updated'); renderProfilePosts();
  }
  reader.readAsDataURL(f);
}

/* follow/unfollow */
function toggleFollow(targetUser){
  if(!currentUser) return showToast('Please login to follow');
  if(currentUser === targetUser) return;
  users[currentUser].following = users[currentUser].following || [];
  users[targetUser].followers = users[targetUser].followers || [];
  const idx = users[currentUser].following.indexOf(targetUser);
  if(idx >= 0){
    users[currentUser].following.splice(idx,1);
    const fIdx = users[targetUser].followers.indexOf(currentUser);
    if(fIdx >= 0) users[targetUser].followers.splice(fIdx,1);
    addNotification(targetUser, 'unfollow', `${currentUser} unfollowed you`, {});
  } else {
    users[currentUser].following.unshift(targetUser);
    users[targetUser].followers = users[targetUser].followers || [];
    users[targetUser].followers.unshift(currentUser);
    addNotification(targetUser, 'follow', `${currentUser} started following you`, {});
  }
  saveUsers(); refreshProfileUI(targetUser); renderProfilePosts(targetUser); renderNotificationsDot(); showToast('Follow status updated');
}

/* -----------------------
   Profile grid rendering
   ----------------------- */
function renderProfilePosts(viewUser){
  const u = viewUser || currentUser;
  if(!u) return;
  const grid = document.getElementById('profileGrid');
  grid.innerHTML = '';
  const userPosts = posts.filter(p => p.user === u);
  document.getElementById('profilePostCount') && (document.getElementById('profilePostCount').textContent = userPosts.length);
  userPosts.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'grid-item';
    if(p.image){
      div.innerHTML = `<img src="${p.image}" alt="post">`;
    } else {
      div.innerHTML = `<div style="padding:12px"><div style="font-weight:700;color:var(--muted)">${escapeHtml((p.text||'').slice(0,120) || '(no image)')}</div></div>`;
    }
    div.onclick = ()=> openPostModal(p);
    grid.appendChild(div);
  });
}

/* modal for posts */
function openPostModal(post){
  const modalRoot = document.getElementById('viewModal');
  const likedText = post.likedBy.includes(currentUser) ? '💔 Unlike' : '❤️ Like';
  const avatar = (users[post.user] && users[post.user].pic) ? users[post.user].pic : `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(post.user)}`;

  modalRoot.innerHTML = `
    <div class="modal" id="modal-${post.id}">
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div>
            <div style="font-weight:700">${escapeHtml(post.user)}</div>
            <div style="font-size:12px;color:var(--muted)">${new Date(post.createdAt).toLocaleString()} ${post.editedAt ? '(edited)' : ''}</div>
          </div>
          <div><button class="small-btn" onclick="closePostModal(${post.id})">Close</button></div>
        </div>
        <div style="margin-bottom:8px;color:var(--white)">${escapeHtml(post.text)}</div>
        ${post.image ? `<img src="${post.image}" alt="post image" style="max-width:100%;border-radius:8px">` : ''}
        <div style="margin-top:10px;display:flex;gap:8px;align-items:center;">
          <button onclick="toggleLike(${post.id})">${likedText} (${post.likedBy.length})</button>
          <button onclick="toggleCommentsArea(${post.id})">💬 Comments (${post.comments.length})</button>
        </div>
        <div id="modal-comments-${post.id}" style="margin-top:8px">
          ${(post.comments || []).map(c=>`<div style="padding:6px 0"><strong>@${escapeHtml(c.user)}</strong>: ${escapeHtml(c.text)}</div>`).join('')}
        </div>
      </div>
    </div>
  `;
  modalRoot.style.display = 'block';
}
function closePostModal(id){
  const modalRoot = document.getElementById('viewModal');
  modalRoot.innerHTML = '';
  modalRoot.style.display = 'none';
}
function openPostModalById(id){
  const post = posts.find(p => p.id === id);
  if(post) openPostModal(post);
}

/* -----------------------
   Search / counts
   ----------------------- */
function onSearchChange(e){
  const val = e.target.value.trim();
  renderPosts(val);
}
function updateCounts(){
  if(!currentUser) return;
  const pCount = posts.filter(p=>p.user === currentUser).length;
  const likeCount = posts.filter(p => p.user === currentUser).reduce((s,p)=>s + p.likedBy.length,0);
  const commentCount = posts.reduce((s,p)=> s + p.comments.filter(c=>c.user === currentUser).length,0);
  if(!users[currentUser].stats) users[currentUser].stats = {posts:0,likes:0,comments:0};
  users[currentUser].stats.posts = pCount;
  users[currentUser].stats.likes = likeCount;
  users[currentUser].stats.comments = commentCount;
  saveUsers();
  refreshProfileUI();
}

/* -----------------------
   Logout / compose
   ----------------------- */
function logout(){
  if(!confirm('Are you sure you want to logout?')) return;
  setCurrent(null);
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('authWrap').style.display = 'flex';
  showToast('👋 Logged out successfully.');
}
function enterCompose(){
  showPage('feed');
  document.getElementById('txtPost').focus();
}

/* helpers */
function escapeHtml(str){
  if(!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

/* -----------------------
   Wire profile pic input
   ----------------------- */
document.addEventListener('change', (e)=>{
  if(e.target && e.target.id === 'profilePicInput') updateProfilePic(e);
});

/* ensure stats exist */
(function ensureUserStats(){ Object.keys(users).forEach(u=>{ if(!users[u].stats) users[u].stats = {posts:0,likes:0,comments:0}; if(!users[u].following) users[u].following = []; if(!users[u].followers) users[u].followers = []; }); saveUsers(); })();

/* auto login if current user in storage */
(function init(){
  const cur = localStorage.getItem(LS_CURRENT);
  if(cur && users[cur]){ setCurrent(cur); openApp(); }
  renderMarket(); // show news on load
})();

/* notify dot toggler (demo) */
function toggleNotifDot(btn){
  const d = document.getElementById('notifDot');
  if(d.style.display === 'none' || !d.style.display) { d.style.display='inline-block'; showToast('You have new notifications'); }
  else { d.style.display='none'; showToast('Notifications cleared'); }
}

/* Scroll hide/show nav logic (kept) */
(function navScrollHandler(){
  let lastY = window.scrollY;
  let ticking = false;
  const navTop = document.getElementById('navTop');
  const navBottom = document.getElementById('navBottom');
  function onScroll(){
    const y = window.scrollY;
    if(y > lastY + 8){ // scrolling down -> hide
      document.body.classList.remove('nav-visible-top'); document.body.classList.add('nav-hidden-top');
      navTop.classList.add('hidden');
      navBottom.classList.add('hidden');
    } else if(y < lastY - 8){ // scrolling up -> show
      document.body.classList.remove('nav-hidden-top'); document.body.classList.add('nav-visible-top');
      navTop.classList.remove('hidden');
      navBottom.classList.remove('hidden');
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', ()=>{ if(!ticking){ window.requestAnimationFrame(onScroll); ticking = true; } }, {passive:true});

  function adaptNav(){
    if(window.innerWidth <= 720){ navTop.style.display='none'; navBottom.style.display='block'; }
    else { navTop.style.display='block'; navBottom.style.display='none'; }
  }
  window.addEventListener('resize', adaptNav);
  adaptNav();
})();

/* storage sync */
window.addEventListener('storage', ()=> {
  users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  posts = JSON.parse(localStorage.getItem(LS_POSTS) || '[]');
  savedMarket = JSON.parse(localStorage.getItem(LS_SAVED_ITEMS) || '[]');
  messages = JSON.parse(localStorage.getItem(LS_MESSAGES) || '{}');
  notifications = JSON.parse(localStorage.getItem(LS_NOTIFS) || '{}');
  stories = JSON.parse(localStorage.getItem(LS_STORIES) || '[]');
  updateCounts();
});

/* =========================
   EXPLORE (kept)
   ========================= */
function renderExplore(){
  const q = document.getElementById('exploreSearch').value.trim().toLowerCase();
  const resultsRoot = document.getElementById('exploreResults');
  resultsRoot.innerHTML = '';
  const filtered = posts.filter(p => {
    if(!q) return true;
    return p.user.toLowerCase().includes(q) || (p.text && p.text.toLowerCase().includes(q));
  });
  document.getElementById('exploreCount').textContent = filtered.length + ' results';
  if(filtered.length === 0){
    resultsRoot.innerHTML = '<div class="panel muted">No results</div>';
    return;
  }
  filtered.forEach(p => {
    const div = document.createElement('div');
    div.className = 'card';
    const userObj = users[p.user] || {bio:'',pic:''};
    const pic = userObj.pic || `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(p.user)}`;
    div.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start">
        <img src="${pic}" style="width:48px;height:48px;border-radius:10px;object-fit:cover" />
        <div style="flex:1">
          <div style="display:flex;gap:8px;align-items:center">
            <div style="font-weight:700;cursor:pointer" onclick="showProfile('${escapeHtml(p.user)}')">${escapeHtml(p.user)}</div>
            <div style="font-size:12px;color:var(--muted)">${new Date(p.createdAt).toLocaleString()}</div>
          </div>
          <div style="margin-top:6px">${escapeHtml(p.text)}</div>
          ${p.image ? `<img src="${p.image}" style="margin-top:8px;border-radius:8px;max-width:100%;">` : ''}
          <div style="margin-top:8px;display:flex;gap:8px">
            <button class="small-btn" onclick="toggleLike(${p.id})">${p.likedBy.includes(currentUser) ? '💔' : '❤️'} ${p.likedBy.length}</button>
            <button class="small-btn" onclick="openPostModalById(${p.id})">View</button>
          </div>
        </div>
      </div>
    `;
    resultsRoot.appendChild(div);
  });
}

/* =========================
   NEWS (offline feed) - replaces Marketplace
   ========================= */

/* loadNewsFeed: for offline mode, reloads the sample news (or keeps saved) */
function loadNewsFeed(){
  showToast("Loading campus headlines...");
  // For offline mode we just restore the bundled sample headlines.
  // If you later want to add API fetching, modify this function.
  marketItems = [
    { id: 'news1', title: 'University to Open New Study Hall', desc: 'A new 24/7 study hall will open in Block C this semester.', price: 'Campus Bulletin', img: 'https://picsum.photos/seed/news1/400/300', seller: 'Campus Bulletin', url: '#' },
    { id: 'news2', title: 'Hackathon Winners Announced', desc: 'Team Orion wins the annual inter-college hackathon.', price: 'Campus News', img: 'https://picsum.photos/seed/news2/400/300', seller: 'Campus News', url: '#' },
    { id: 'news3', title: 'Library Hours Extended', desc: 'Library will be open till midnight during exam week.', price: 'Library', img: 'https://picsum.photos/seed/news3/400/300', seller: 'Library', url: '#' },
    { id: 'news4', title: 'Student Art Exhibit Next Friday', desc: 'Showcasing student works at the campus gallery.', price: 'Arts Dept', img: 'https://picsum.photos/seed/news4/400/300', seller: 'Arts Dept', url: '#' },
    { id: 'news5', title: 'New Cafeteria Menu Launched', desc: 'Healthy options now available in the cafeteria.', price: 'Campus Dining', img: 'https://picsum.photos/seed/news5/400/300', seller: 'Campus Dining', url: '#' }
  ];
  saveMarketState();
  renderMarket();
  showToast('📰 Campus headlines updated');
}

/* renderMarket: shows news articles */
function renderMarket(){
  const q = (document.getElementById('marketSearch')?.value || '').trim().toLowerCase();
  const root = document.getElementById('marketList');
  root.innerHTML = '';
  const filtered = marketItems.filter(it => {
    if(!q) return true;
    return it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q) || (it.seller && it.seller.toLowerCase().includes(q));
  });
  if(filtered.length === 0){
    root.innerHTML = '<div class="panel muted">No articles found</div>';
    return;
  }
  filtered.forEach(it => {
    const el = document.createElement('div');
    el.className = 'card market-card';
    const isSaved = savedMarket.includes(it.id);
    el.innerHTML = `
      <img src="${it.img}" alt="${escapeHtml(it.title)}" />
      <div style="flex:1">
        <div style="font-weight:700">${escapeHtml(it.title)} <span style="font-weight:600;color:var(--muted);font-size:13px">· ${escapeHtml(it.price)}</span></div>
        <div class="muted" style="margin-top:6px">${escapeHtml(it.desc)}</div>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
          <button class="small-btn" onclick="viewNewsItem('${it.id}')">View</button>
          <button class="fav" onclick="toggleSaveItem('${it.id}')">${isSaved ? 'Saved ✓' : 'Save'}</button>
          <div style="margin-left:auto;font-size:12px;color:var(--muted)">Source: ${escapeHtml(it.seller || 'News')}</div>
        </div>
      </div>
    `;
    root.appendChild(el);
  });

  renderSavedItems();
}

/* viewNewsItem: open article modal and allow opening url (if present) */
function viewNewsItem(id){
  const it = marketItems.find(m=>m.id===id);
  if(!it) return;
  const modalRoot = document.getElementById('viewModal');
  modalRoot.innerHTML = `
    <div class="modal">
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700">${escapeHtml(it.title)}</div>
          <div><button class="small-btn" onclick="closeMarketModal()">Close</button></div>
        </div>
        <img src="${it.img}" style="width:100%;max-height:320px;object-fit:cover;border-radius:8px;margin-top:8px"/>
        <div style="margin-top:8px">${escapeHtml(it.desc)}</div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="primary" onclick="window.open('${it.url || '#'}','_blank')">Open Article</button>
          <button class="small-btn" onclick="toggleSaveItem('${it.id}')">${savedMarket.includes(it.id) ? 'Unsave' : 'Save'}</button>
        </div>
      </div>
    </div>
  `;
  modalRoot.style.display = 'block';
}
function closeMarketModal(){ document.getElementById('viewModal').innerHTML=''; document.getElementById('viewModal').style.display='none'; }

/* save / unsave article */
function toggleSaveItem(id){
  const idx = savedMarket.indexOf(id);
  if(idx >= 0){
    savedMarket.splice(idx,1);
    showToast('Removed from saved articles');
  } else {
    savedMarket.unshift(id);
    showToast('Saved to your articles');
  }
  saveSavedItems();
  renderMarket();
  renderSavedItems();
}

function renderSavedItems(){
  const root = document.getElementById('savedList');
  const count = document.getElementById('savedCount');
  root.innerHTML = '';
  count.textContent = savedMarket.length + ' saved';
  if(savedMarket.length === 0){ root.innerHTML = '<div class="muted">No saved articles yet</div>'; return; }
  savedMarket.forEach(id => {
    const it = marketItems.find(m=>m.id===id);
    if(!it) return;
    const div = document.createElement('div');
    div.className = 'grid-item';
    div.innerHTML = `<img src="${it.img}" alt="${escapeHtml(it.title)}"/><div style="position:absolute;left:8px;bottom:8px;color:var(--white);font-weight:700">${escapeHtml(it.title)}</div>`;
    div.onclick = ()=> viewNewsItem(it.id);
    root.appendChild(div);
  });
}

/* ensure saved array */
function ensureSavedInit(){ if(!Array.isArray(savedMarket)) savedMarket = []; }
ensureSavedInit();

/* ------------------------
   Notifications system
   ------------------------ */
function addNotification(username, type, text, meta={}){
  notifications[username] = notifications[username] || [];
  notifications[username].unshift({ type, text, meta, at: new Date().toISOString(), read: false });
  saveNotifications();
  renderNotificationsDot();
}
function getNotifications(username){
  return notifications[username] || [];
}
function toggleNotifications(){
  const modal = document.getElementById('notificationsModal');
  const list = getNotifications(currentUser || '__guest__');
  modal.innerHTML = `<div class="modal"><div class="modal-card">
    <div style="display:flex;justify-content:space-between;align-items:center"><h3>Notifications</h3><button class="small-btn" onclick="closeSimpleModal('notificationsModal')">Close</button></div>
    <div style="margin-top:8px;max-height:60vh;overflow:auto">
      ${list.length===0 ? '<div class="muted">No notifications</div>' : list.map(n=>`<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><div style="font-weight:700">${escapeHtml(n.text)}</div><div style="font-size:12px;color:var(--muted)">${new Date(n.at).toLocaleString()}</div></div>`).join('')}
    </div>
  </div></div>`;
  modal.style.display = 'block';
}
function closeSimpleModal(id){ const m = document.getElementById(id); if(m) m.style.display='none'; }
function renderNotificationsDot(){
  const dot = document.getElementById('notifDot');
  if(!dot) return;
  const list = getNotifications(currentUser || '__guest__');
  const unread = (list || []).filter(n=>!n.read).length;
  dot.style.display = unread > 0 ? 'inline-block' : 'none';
}

/* ------------------------
   Trending & tags (simple)
   ------------------------ */
function renderTrending(){
  const root = document.getElementById('trendingContent');
  root.innerHTML = '';
  // top posts by likes
  const top = [...posts].sort((a,b)=> (b.likedBy.length||0) - (a.likedBy.length||0)).slice(0,6);
  if(top.length === 0){ root.innerHTML = '<div class="panel muted">No trending posts yet</div>'; return; }
  top.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'trending-card';
    div.innerHTML = `<div style="font-weight:700">${escapeHtml(p.text || '(no text)')}</div><div style="font-size:12px;color:var(--muted)">by ${escapeHtml(p.user)} · ${p.likedBy.length} likes</div>`;
    root.appendChild(div);
  });

  // trending tags
  const tagsRoot = document.getElementById('trendingTags');
  if(tagsRoot){
    const tags = {};
    posts.forEach(p=>{
      (p.text || '').match(/#([a-zA-Z0-9_]+)/g)?.forEach(t => { tags[t] = (tags[t]||0)+1; });
    });
    tagsRoot.innerHTML = Object.keys(tags).slice(0,8).map(t=>`<button class="small-btn" onclick="filterByTag('${encodeURIComponent(t)}')">${t} (${tags[t]})</button>`).join(' ');
  }
}

/* filter by hashtag */
function filterByTag(tag){
  try{ tag = decodeURIComponent(tag); }catch(e){}
  const q = tag.replace('#','');
  renderPosts(q);
  showPage('feed');
}

/* ------------------------
   Stories (simple placeholder)
   ------------------------ */
function renderStories(){
  const root = document.getElementById('storiesBar');
  if(!root) return;
  root.classList.remove('hidden');
  root.innerHTML = '';
  stories.forEach(s=>{
    const b = document.createElement('div');
    b.className = 'story';
    b.textContent = s.user ? s.user[0].toUpperCase() : 'S';
    b.title = s.user;
    root.appendChild(b);
  });
}

/* add story (kept skeleton) */
function addStory(){ if(!currentUser) return showToast('Login to add story'); stories.unshift({id:'st'+Date.now(), user: currentUser, img:'', createdAt: new Date().toISOString()}); saveStories(); renderStories(); showToast('Story added'); }

/* ------------------------
   Misc small helpers / profile edit
   ------------------------ */
function enterEditProfile(){ showPage('profile'); document.getElementById('bio').focus(); }
function cancelEditProfile(){ if(currentUser && users[currentUser]) document.getElementById('bio').value = users[currentUser].bio || ''; showToast('Edit cancelled'); }
function updateProfileUsername(){ showToast('Username cannot be changed in this demo'); }

/* ------------------------
   Editor modal (simple)
   ------------------------ */
function openEditorModal(postId){
  const modalRoot = document.getElementById('viewModal');
  if(postId){
    const post = posts.find(p=>p.id===postId);
    if(!post) return;
    modalRoot.innerHTML = `<div class="modal"><div class="modal-card"><h3>Edit post</h3><textarea id="editorText">${escapeHtml(post.text)}</textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="primary" onclick="saveEdit(${postId})">Save</button><button class="small-btn" onclick="closePostModal(${postId})">Cancel</button></div></div></div>`;
  } else {
    modalRoot.innerHTML = `<div class="modal"><div class="modal-card"><h3>Compose</h3><textarea id="editorText"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="primary" onclick="saveNewFromEditor()">Post</button><button class="small-btn" onclick="closePostModal('editor')">Cancel</button></div></div></div>`;
  }
  modalRoot.style.display = 'block';
}
function saveEdit(postId){
  const txt = document.getElementById('editorText').value.trim();
  const post = posts.find(p=>p.id===postId);
  if(!post) return;
  post.text = txt;
  post.editedAt = new Date().toISOString();
  savePosts(); renderPosts(); closePostModal(postId); showToast('Post updated');
}
function saveNewFromEditor(){
  const txt = document.getElementById('editorText').value.trim();
  if(!txt) return showToast('Write something');
  createPostObject(txt, null);
  closePostModal('editor');
}

/* ------------------------
   Notifications UI wiring
   ------------------------ */
function openMessagesModal(){
  const modal = document.getElementById('messagesModal');
  modal.innerHTML = `<div class="modal"><div class="modal-card"><h3>Messages (demo)</h3><div class="muted">Messaging is a light demo in this build.</div><div style="margin-top:8px"><button class="small-btn" onclick="closeSimpleModal('messagesModal')">Close</button></div></div></div>`;
  modal.style.display = 'block';
}

/* helpers: small public exports for inline handlers */
window.showPage = showPage;
window.onRegister = onRegister;
window.onLogin = onLogin;
window.onCreatePost = onCreatePost;
window.clearDraft = clearDraft;
window.saveDraft = saveDraft;
window.enterCompose = enterCompose;
window.logout = logout;
window.toggleNotifDot = toggleNotifDot;
window.toggleLike = toggleLike;
window.toggleCommentsArea = toggleCommentsArea;
window.addComment = addComment;
window.onEditPost = onEditPost;
window.onDeletePost = onDeletePost;
window.showProfile = showProfile;
window.updateBio = updateBio;
window.updateProfilePic = updateProfilePic;
window.openPostModal = openPostModal;
window.closePostModal = closePostModal;
window.openPostModalById = openPostModalById;
window.toggleSaveItem = toggleSaveItem;
window.viewMarketItem = viewNewsItem;
window.renderMarket = renderMarket;
window.renderExplore = renderExplore;
window.openMessagesModal = openMessagesModal;
window.loadNewsFeed = loadNewsFeed;
window.viewNewsItem = viewNewsItem;

/* ------------------------
   Final small init
   ------------------------ */
(function finalInit(){
  // Apply saved theme
  const t = localStorage.getItem(LS_THEME);
  if(t === 'light') document.body.classList.add('light');

  // Auto load sample news only if LS empty
  if(!localStorage.getItem(LS_MARKET)) saveMarketState();

  renderNotificationsDot();
  renderTrending();
})();

// Stories horizontal scroll enhancement
const storiesContainer = document.getElementById('storiesBar');
if(storiesContainer){
  storiesContainer.addEventListener('wheel', (e)=>{
    e.preventDefault();
    storiesContainer.scrollLeft += e.deltaY;
  });
}

