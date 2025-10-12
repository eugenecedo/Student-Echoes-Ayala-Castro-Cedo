// storage keys (extended)
const LS_USERS = 'se_users';
const LS_POSTS = 'se_posts';
const LS_CURRENT = 'se_current';
const LS_DRAFT = 'se_draft';
const LS_SAVED_ITEMS = 'se_saved_items';
const LS_SAVED_POSTS = 'se_saved_posts';
const LS_CHATS = 'se_chats';
const LS_MARKET = 'se_market';
const LS_THEME = 'se_theme';

// app state
let users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
let posts = JSON.parse(localStorage.getItem(LS_POSTS) || '[]');
let savedMarket = JSON.parse(localStorage.getItem(LS_SAVED_ITEMS) || '[]');
let savedPosts = JSON.parse(localStorage.getItem(LS_SAVED_POSTS) || '[]');
let marketItems = JSON.parse(localStorage.getItem(LS_MARKET) || 'null');
let chats = JSON.parse(localStorage.getItem(LS_CHATS) || '{}');
let currentUser = localStorage.getItem(LS_CURRENT) || null;

// default market items
const MARKET_ITEMS_DEFAULT = [
  { id: 'm1', title: 'Used Math Textbook', desc: 'Calculus 1, good condition', price: '₱250', img: 'https://picsum.photos/seed/book1/400/300' },
  { id: 'm2', title: 'Laptop Sleeve', desc: '15-inch, padded', price: '₱350', img: 'https://picsum.photos/seed/sleeve/400/300' },
  { id: 'm3', title: 'Sticker Pack', desc: 'College-themed stickers', price: '₱80', img: 'https://picsum.photos/seed/stickers/400/300' },
  { id: 'm4', title: 'USB Flash Drive', desc: '32GB, fast', price: '₱150', img: 'https://picsum.photos/seed/usb/400/300' }
];
marketItems = marketItems || MARKET_ITEMS_DEFAULT;

/* -----------------------
   Toast & UI utilities
   ----------------------- */
function showToast(msg, timeout=2200){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), timeout);
}

function saveUsers(){ localStorage.setItem(LS_USERS, JSON.stringify(users)); }
function savePosts(){ localStorage.setItem(LS_POSTS, JSON.stringify(posts)); }
function saveMarketState(){ localStorage.setItem(LS_MARKET, JSON.stringify(marketItems)); }
function saveSavedItems(){ localStorage.setItem(LS_SAVED_ITEMS, JSON.stringify(savedMarket)); }
function saveSavedPosts(){ localStorage.setItem(LS_SAVED_POSTS, JSON.stringify(savedPosts)); }
function saveChats(){ localStorage.setItem(LS_CHATS, JSON.stringify(chats)); }
function saveTheme(v){ localStorage.setItem(LS_THEME, v); }

function setCurrent(u) {
  currentUser = u;
  if (u) {
    localStorage.setItem(LS_CURRENT, u);
  } else {
    localStorage.removeItem(LS_CURRENT);
  }
}


/* -----------------------
   Theme toggle
   ----------------------- */
function toggleTheme(){
  const isLight = document.body.classList.toggle('light-mode');
  saveTheme(isLight ? 'light' : 'dark');
  showToast(isLight ? 'Switched to light mode' : 'Switched to dark mode');
}
(function initTheme(){
  const t = localStorage.getItem(LS_THEME);
  if(t === 'light') document.body.classList.add('light-mode');
})();

/* -----------------------
   Auth: register/login
   ----------------------- */
function onRegister(){
  const u = document.getElementById('authUser').value.trim();
  const p = document.getElementById('authPass').value;
  if(!u || !p) return showToast('Please enter username & password');
  if(users[u]) return showToast('Username already taken');
  users[u] = { password: p, bio: '', pic:'', stats:{posts:0, likes:0, comments:0}, notifications: [] };
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
  renderAnalytics();
  renderChatsListPreview();
  refreshNotifDot();
}

/* -----------------------
   Page switching
   ----------------------- */
function clearActiveNav(){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
}
function showPage(page, instant=false){
  const pages = ['feed','profile','explore','market','savedPostsPage','messagesPage'];
  pages.forEach(p => {
    const el = document.getElementById(p + 'Page') || document.getElementById(p);
    if(el) el.classList.add('hidden');
  });

  // also hide main sections when switching
  document.getElementById('feedPage').classList.add('hidden');
  document.getElementById('explorePage').classList.add('hidden');
  document.getElementById('marketPage').classList.add('hidden');
  document.getElementById('profilePage').classList.add('hidden');
  document.getElementById('savedPostsPage').classList.add('hidden');
  document.getElementById('messagesPage').classList.add('hidden');

  clearActiveNav();
  if(page === 'profile'){
    document.getElementById('profilePage').classList.remove('hidden');
    document.getElementById('navProfile').classList.add('active');
    renderProfilePosts();
    refreshProfileUI();
  } else if(page === 'explore'){
    document.getElementById('explorePage').classList.remove('hidden');
    document.getElementById('navExplore').classList.add('active');
    renderExplore();
  } else if(page === 'market'){
    document.getElementById('marketPage').classList.remove('hidden');
    document.getElementById('navMarket').classList.add('active');
    renderMarket();
    renderSavedItems();
  } else if(page === 'savedPostsPage'){
    document.getElementById('savedPostsPage').classList.remove('hidden');
    renderSavedPosts();
  } else if(page === 'messagesPage'){
    document.getElementById('messagesPage').classList.remove('hidden');
    renderChats();
  } else {
    document.getElementById('feedPage').classList.remove('hidden');
    document.getElementById('navHome').classList.add('active');
    renderPosts();
  }

  window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
}

/* -----------------------
   Draft handling
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
  document.getElementById('filePost').value = '';
  document.getElementById('draftNotice').textContent = '';
}

/* -----------------------
   Create post (with image -> DataURL)
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
}

/* -----------------------
   Render posts
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
    const saved = savedPosts.includes(post.id);

    const commentsHtml = (post.comments || []).map(c => `<p><strong>@${escapeHtml(c.user)}</strong>: ${escapeHtml(c.text)}</p>`).join('');

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
      <div class="post-content"><div class="text">${escapeHtml(post.text)}</div>
        ${post.image ? `<img class="media" src="${post.image}" alt="post image">` : ''}
      </div>
      <div class="actions" style="display:flex;gap:12px;margin-top:10px">
        <button onclick="toggleLike(${post.id})">${liked ? '💔 Unlike' : '❤️ Like'} (${post.likedBy.length})</button>
        <button onclick="toggleCommentsArea(${post.id})">💬 Comment (${post.comments.length})</button>
        ${post.user === currentUser ? `<button onclick="onEditPost(${post.id})">✏️ Edit</button> <button onclick="onDeletePost(${post.id})" class="danger">🗑 Delete</button>` : `<button onclick="openChatWith('${escapeHtml(post.user)}')" class="small-btn">💬 Message</button>`}
        <button onclick="toggleSavePost(${post.id})" class="small-btn">${saved ? '🔖 Saved' : '🔖 Save'}</button>
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
    showToast('Removed like');
  } else {
    post.likedBy.push(currentUser);
    if(users[post.user]){
      if(!users[post.user].stats) users[post.user].stats = {posts:0,likes:0,comments:0};
      users[post.user].stats.likes = (users[post.user].stats.likes || 0) + 1;
    }
    if(post.user !== currentUser) addNotification(post.user, `${currentUser} liked your post`);
    showToast('You liked the post');
  }
  savePosts(); saveUsers(); renderPosts(); renderProfilePosts(); updateCounts(); refreshNotifDot();
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
  if(post.user !== currentUser) addNotification(post.user, `${currentUser} commented on your post`);
  refreshNotifDot();
}
function onEditPost(postId){
  const post = posts.find(p => p.id === postId);
  if(!post || post.user !== currentUser) return showToast('Cannot edit');
  const newText = prompt('Edit your post', post.text);
  if(newText === null) return;
  post.text = newText;
  post.editedAt = new Date().toISOString();
  savePosts(); renderPosts(); renderProfilePosts(); showToast('✏️ Post edited');
}
function onDeletePost(postId){
  const idx = posts.findIndex(p => p.id === postId);
  if(idx === -1) return;
  if(posts[idx].user !== currentUser) return showToast('Cannot delete');
  if(!confirm('Delete this post?')) return;
  posts.splice(idx,1);
  if(users[currentUser] && users[currentUser].stats) users[currentUser].stats.posts = Math.max(0, users[currentUser].stats.posts - 1);
  savePosts(); saveUsers(); renderPosts(); renderProfilePosts(); showToast('🗑 Post deleted'); updateCounts();
}

/* -----------------------
   Profile functions
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
  document.getElementById('miniPicRight').src = pic;
  document.getElementById('profilePicBig').src = pic;
  document.getElementById('profileUser').textContent = u;
  document.getElementById('profileUserRight').textContent = u;
  document.getElementById('profileBioMini').textContent = userObj.bio || "No bio yet";
  document.getElementById('profileBioMiniRight').textContent = userObj.bio || "No bio yet";
  document.getElementById('profileUsername').value = u;
  document.getElementById('bio').value = userObj.bio || '';

  if(!users[u].stats) users[u].stats = {posts:0,likes:0,comments:0};
  const postsCount = users[u].stats.posts || 0;
  const likes = users[u].stats.likes || 0;
  const comments = users[u].stats.comments || 0;
  document.getElementById('statPosts').textContent = postsCount;
  document.getElementById('statLikes').textContent = likes;
  document.getElementById('statComments').textContent = comments;
  document.getElementById('statPostsRight').textContent = postsCount;
  document.getElementById('statLikesRight').textContent = likes;
  document.getElementById('statCommentsRight').textContent = comments;

  const profilePosts = posts.filter(p => p.user === u).length;
  document.getElementById('profilePostCount').textContent = profilePosts;
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

/* -----------------------
   Profile grid rendering
   ----------------------- */
function renderProfilePosts(viewUser){
  const u = viewUser || currentUser;
  if(!u) return;
  const grid = document.getElementById('profileGrid');
  grid.innerHTML = '';
  const userPosts = posts.filter(p => p.user === u);
  document.getElementById('profilePostCount').textContent = userPosts.length;
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

/* modal */
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
          <button class="small-btn" onclick="toggleSavePost(${post.id})">${savedPosts.includes(post.id) ? '🔖 Unsave' : '🔖 Save'}</button>
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

/* wire profile pic input */
document.addEventListener('change', (e)=>{
  if(e.target && e.target.id === 'profilePicInput') updateProfilePic(e);
});

/* ensure stats exist */
(function ensureUserStats(){ Object.keys(users).forEach(u=>{ if(!users[u].stats) users[u].stats = {posts:0,likes:0,comments:0}; if(!users[u].notifications) users[u].notifications = []; }); saveUsers(); })();

/* auto login if current user in storage */
(function init(){
  const cur = localStorage.getItem(LS_CURRENT);
  if(cur && users[cur]){ setCurrent(cur); openApp(); }
  // wire saved market items
  renderMarket();
})();

/* notify dot toggler (demo) */
function toggleNotifDot(btn){
  const d = document.getElementById('notifDot');
  if(d.style.display === 'none' || !d.style.display) { d.style.display='inline-block'; showToast('You have new notifications'); }
  else { d.style.display='none'; showToast('Notifications cleared'); }
}

/* Scroll hide/show nav logic (hidden when scrolling down) */
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
window.addEventListener('storage', ()=> { users = JSON.parse(localStorage.getItem(LS_USERS) || '{}'); posts = JSON.parse(localStorage.getItem(LS_POSTS) || '[]'); savedMarket = JSON.parse(localStorage.getItem(LS_SAVED_ITEMS) || '[]'); savedPosts = JSON.parse(localStorage.getItem(LS_SAVED_POSTS) || '[]'); chats = JSON.parse(localStorage.getItem(LS_CHATS) || '{}'); updateCounts(); });

/* ============================
   NOTIFICATIONS
   ============================ */
function addNotification(toUser, message){
  if(!users[toUser]) return;
  users[toUser].notifications = users[toUser].notifications || [];
  users[toUser].notifications.unshift({message, at:new Date().toISOString(), read:false});
  saveUsers();
  refreshNotifDot();
}

function refreshNotifDot(){
  if(!currentUser) return;
  const list = users[currentUser]?.notifications || [];
  const unread = list.filter(n => !n.read).length;
  const dot = document.getElementById('notifDot');
  if(unread > 0) dot.style.display = 'inline-block';
  else dot.style.display = 'none';
}

function openNotifications(){
  if(!currentUser) { showToast('Please login to view notifications'); return; }
  const modal = document.getElementById('notificationsModal');
  const n = users[currentUser]?.notifications || [];
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700">Notifications</div>
          <div><button class="small-btn" onclick="closeNotifications()">Close</button></div>
        </div>
        <div style="margin-top:12px">
          ${n.length === 0 ? '<div class="muted">No notifications</div>' : n.map((x,idx) => `<div style="padding:10px;border-radius:8px;margin-top:8px;background:linear-gradient(180deg, rgba(255,255,255,0.01), transparent)">${escapeHtml(x.message)} <div class="muted" style="font-size:12px;margin-top:6px">${new Date(x.at).toLocaleString()}</div></div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="small-btn" onclick="markAllRead()">Mark all read</button>
          <button class="small-btn" onclick="clearNotifications()">Clear all</button>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'block';
  // mark visible ones as read
  n.forEach(x => x.read = true);
  saveUsers();
  refreshNotifDot();
}
function closeNotifications(){ const modal = document.getElementById('notificationsModal'); modal.innerHTML=''; modal.style.display='none'; }
function clearNotifications(){ if(!currentUser) return; users[currentUser].notifications = []; saveUsers(); closeNotifications(); showToast('Notifications cleared'); refreshNotifDot(); }
function markAllRead(){ if(!currentUser) return; (users[currentUser].notifications || []).forEach(n=>n.read=true); saveUsers(); refreshNotifDot(); openNotifications(); }

/* ============================
   SAVED POSTS
   ============================ */
function toggleSavePost(postId){
  if(!currentUser) { showToast('Login to save posts'); return; }
  const i = savedPosts.indexOf(postId);
  if(i >= 0){ savedPosts.splice(i,1); showToast('Removed from saved posts'); }
  else { savedPosts.unshift(postId); showToast('Saved post'); }
  saveSavedPosts();
  renderPosts();
}

function renderSavedPosts(){
  if(!currentUser) { showToast('Login to view saved posts'); return; }
  showPage('savedPostsPage');
  const root = document.getElementById('savedPostsList');
  root.innerHTML = '';
  const list = savedPosts.map(id => posts.find(p => p.id === id)).filter(Boolean);
  document.getElementById('savedPostsCount').textContent = list.length;
  if(list.length === 0){ root.innerHTML = '<div class="panel muted">No saved posts</div>'; return; }
  list.forEach(p => {
    const div = document.createElement('div');
    div.className = 'saved-post';
    div.innerHTML = `
      ${p.image ? `<img src="${p.image}" alt="img">` : `<div style="width:120px;height:84px;border-radius:8px;background:linear-gradient(90deg, rgba(255,255,255,0.02), transparent);display:flex;align-items:center;justify-content:center;color:var(--muted)">(no image)</div>`}
      <div style="flex:1">
        <div style="font-weight:700">${escapeHtml(p.user)} · <span class="muted">${new Date(p.createdAt).toLocaleString()}</span></div>
        <div style="margin-top:6px">${escapeHtml((p.text||'').slice(0,220))}</div>
        <div style="margin-top:8px;display:flex;gap:8px">
          <button class="small-btn" onclick="openPostModalById(${p.id})">View</button>
          <button class="small-btn" onclick="toggleSavePost(${p.id})">Remove</button>
        </div>
      </div>
    `;
    root.appendChild(div);
  });
}

/* ============================
   CHAT / MESSAGING (local-only)
   ============================ */
function openChatWith(username){
  if(!currentUser) { showToast('Login to message'); return; }
  if(!users[username]) return showToast('User not found');
  // ensure chat structure
  const chatId = [currentUser, username].sort().join('_');
  chats[chatId] = chats[chatId] || [];
  saveChats();
  showPage('messagesPage');
  renderChats(username);
}

function renderChats(){
  if(!currentUser) { showToast('Login to view messages'); return; }
  showPage('messagesPage');
  renderChats(); // harmless re-render
}
function renderChatsListPreview(){
  // place a small preview in the right side (not required) - keep minimal
  // called on load to prepare chat state
}

function renderChats(selectedPeer){
  const root = document.getElementById('chatsRoot');
  root.innerHTML = '';
  // build list of peers (chats keys that include currentUser)
  const peers = [];
  Object.keys(chats).forEach(k=>{
    if(k.includes(currentUser)){
      const [a,b] = k.split('_');
      const peer = a === currentUser ? b : a;
      if(!peers.includes(peer)) peers.push(peer);
    }
  });
  // add all other users as possible peers
  Object.keys(users).forEach(u => { if(u !== currentUser && !peers.includes(u)) peers.push(u); });

  const leftCol = document.createElement('div');
  leftCol.style.display = 'flex';
  leftCol.style.flexDirection = 'column';
  leftCol.style.gap = '8px';
  leftCol.style.width = '220px';

  peers.forEach(p=>{
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.innerHTML = `<div style="font-weight:700">${escapeHtml(p)}</div><div class="muted" style="margin-left:auto">${(chats[[currentUser,p].sort().join('_')]||[]).length}</div>`;
    item.onclick = ()=> renderChatWindow(p);
    leftCol.appendChild(item);
  });

  const rightCol = document.createElement('div');
  rightCol.style.flex = '1';

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.gap = '12px';
  container.appendChild(leftCol);
  container.appendChild(rightCol);

  root.appendChild(container);

  if(selectedPeer) renderChatWindow(selectedPeer);
  else if(peers.length) renderChatWindow(peers[0]);
  else rightCol.innerHTML = '<div class="muted">No chats yet. Click a user to start a conversation.</div>';

  function renderChatWindow(peer){
    const chatId = [currentUser, peer].sort().join('_');
    const msgs = chats[chatId] || [];
    rightCol.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:700">Chat with ${escapeHtml(peer)}</div>
        <div><button class="small-btn" onclick="showPage('feed')">Close</button></div>
      </div>
      <div class="chat-window" id="chatWindowInner">
        ${msgs.map(m => `<div style="padding:6px 0"><strong>${escapeHtml(m.user)}</strong>: ${escapeHtml(m.text)} <div class="muted" style="font-size:11px">${new Date(m.at).toLocaleString()}</div></div>`).join('')}
      </div>
      <div class="chat-input">
        <input id="chatInputText" placeholder="Type a message..." style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:var(--white)">
        <button class="primary" onclick="sendMessageTo('${peer}')">Send</button>
      </div>
    `;
    document.getElementById('chatWithLabel').textContent = ` — chatting with ${peer}`;
    const w = document.getElementById('chatWindowInner');
    if(w) w.scrollTop = w.scrollHeight;
  }
}

function sendMessageTo(peer){
  if(!currentUser) return showToast('Login to send messages');
  const input = document.getElementById('chatInputText');
  if(!input) return;
  const text = input.value.trim();
  if(!text) return;
  const chatId = [currentUser, peer].sort().join('_');
  chats[chatId] = chats[chatId] || [];
  chats[chatId].push({user: currentUser, text, at: new Date().toISOString()});
  saveChats();
  input.value = '';
  renderChats(peer);
  showToast('Message sent');
  addNotification(peer, `${currentUser} sent you a message`);
}

/* helper to open chat quickly */
function openChats(){
  showPage('messagesPage');
  renderChats();
}

/* quick start chat button next to username */
function openChatWithUser(user){
  openChatWith(user);
}

/* ============================
   MARKETPLACE (mini catalog)
   ============================ */
function renderMarket(){
  const q = document.getElementById('marketSearch') ? document.getElementById('marketSearch').value.trim().toLowerCase() : '';
  const root = document.getElementById('marketList');
  if(!root) return;
  root.innerHTML = '';
  const filtered = marketItems.filter(it => {
    if(!q) return true;
    return it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q);
  });
  if(filtered.length === 0){
    root.innerHTML = '<div class="panel muted">No items found</div>';
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
          <button class="small-btn" onclick="viewMarketItem('${it.id}')">View</button>
          <button class="fav" onclick="toggleSaveMarketItem('${it.id}')">${isSaved ? 'Saved ✓' : 'Save'}</button>
        </div>
      </div>
    `;
    root.appendChild(el);
  });

  renderSavedItems();
}

function viewMarketItem(id){
  const it = marketItems.find(m=>m.id===id);
  if(!it) return;
  const modalRoot = document.getElementById('viewModal');
  modalRoot.innerHTML = `
    <div class="modal">
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700">${escapeHtml(it.title)} <span class="muted" style="font-weight:600;font-size:13px">· ${escapeHtml(it.price)}</span></div>
          <div><button class="small-btn" onclick="closeMarketModal()">Close</button></div>
        </div>
        <img src="${it.img}" style="width:100%;max-height:320px;object-fit:cover;border-radius:8px;margin-top:8px"/>
        <div style="margin-top:8px">${escapeHtml(it.desc)}</div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="primary" onclick="toggleSaveMarketItem('${it.id}')">${savedMarket.includes(it.id) ? 'Unsave' : 'Save'}</button>
          <button class="small-btn" onclick="fakeBuy('${it.id}')">Buy</button>
        </div>
      </div>
    </div>
  `;
  modalRoot.style.display = 'block';
}
function closeMarketModal(){ document.getElementById('viewModal').innerHTML=''; document.getElementById('viewModal').style.display='none'; }

function fakeBuy(id){
  showToast('🛒 Purchase simulated — this is a demo');
  closeMarketModal();
}

function toggleSaveMarketItem(id){
  const idx = savedMarket.indexOf(id);
  if(idx >= 0){
    savedMarket.splice(idx,1);
    showToast('Removed from saved items');
  } else {
    savedMarket.unshift(id);
    showToast('Saved to your items');
  }
  saveSavedItems();
  renderMarket();
  renderSavedItems();
}

function renderSavedItems(){
  const root = document.getElementById('savedList');
  const count = document.getElementById('savedCount');
  if(!root) return;
  root.innerHTML = '';
  count.textContent = savedMarket.length + ' saved';
  if(savedMarket.length === 0){ root.innerHTML = '<div class="muted">No saved items yet</div>'; return; }
  savedMarket.forEach(id => {
    const it = marketItems.find(m=>m.id===id);
    if(!it) return;
    const div = document.createElement('div');
    div.className = 'grid-item';
    div.innerHTML = `<img src="${it.img}" alt="${escapeHtml(it.title)}"/><div style="position:absolute;left:8px;bottom:8px;color:var(--white);font-weight:700">${escapeHtml(it.title)}</div>`;
    div.onclick = ()=> viewMarketItem(it.id);
    root.appendChild(div);
  });
}

/* ============================
   Chats helper to render list only (for quick button)
   ============================ */
function renderChatsListPreview(){
  // no-op for now; reserved for future small preview UI
}

/* ============================
   Analytics Dashboard
   ============================ */
function renderAnalytics(){
  const el = document.getElementById('analyticsPanel');
  if(!el) return;
  const totalPosts = posts.length;
  const totalLikes = posts.reduce((s,p)=>s + p.likedBy.length,0);
  const totalComments = posts.reduce((s,p)=>s + (p.comments ? p.comments.length : 0),0);
  const uniqueUsers = Object.keys(users).length;
  el.innerHTML = `
    <div style="font-weight:700;margin-bottom:8px">Analytics</div>
    <div class="muted" style="font-size:13px">Community snapshot</div>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
      <div>Total posts: <strong>${totalPosts}</strong></div>
      <div>Total likes: <strong>${totalLikes}</strong></div>
      <div>Total comments: <strong>${totalComments}</strong></div>
      <div>Registered users: <strong>${uniqueUsers}</strong></div>
    </div>
  `;
}

/* ============================
   Saved helpers / initialization
   ============================ */
function ensureSavedInit(){ if(!Array.isArray(savedMarket)) savedMarket = []; if(!Array.isArray(savedPosts)) savedPosts = []; if(typeof chats !== 'object') chats = {}; }
ensureSavedInit();

/* small helper to open profile editing (simple UX) */
function enterEditProfile(){
  showPage('profile');
  document.getElementById('bio').focus();
}
function cancelEditProfile(){
  if(currentUser && users[currentUser]) document.getElementById('bio').value = users[currentUser].bio || '';
  showToast('Edit cancelled');
}

// expose some to window for inline handlers
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
window.toggleSaveItem = toggleSaveMarketItem;
window.viewMarketItem = viewMarketItem;
window.toggleSavePost = toggleSavePost;
window.openChatWith = openChatWith;
window.openChatWithUser = openChatWithUser;
window.renderSavedPosts = renderSavedPosts;
window.renderChats = renderChats;
window.renderAnalytics = renderAnalytics;
window.openNotifications = openNotifications;
window.closeNotifications = closeNotifications;
window.sendMessageTo = sendMessageTo;
window.renderChatsListPreview = renderChatsListPreview;

// persist market array if it's default and not already in storage
saveMarketState();
saveSavedItems();
saveSavedPosts();
saveChats();
