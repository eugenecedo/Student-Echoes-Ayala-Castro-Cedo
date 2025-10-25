/* =========================
   Student Echoes - 1_fixed_part1.js
   Purpose: fixed + polished core (Part 1 of 2)
   Replace your existing 1.js with Part1 + Part2 (in order)
   ========================= */

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
  // ensure removal
  clearTimeout(t._toastTimeout);
  t._toastTimeout = setTimeout(()=> t.classList.remove('show'), timeout);
}

function saveUsers(){ try{ localStorage.setItem(LS_USERS, JSON.stringify(users)); }catch(e){} }
function savePosts(){ try{ localStorage.setItem(LS_POSTS, JSON.stringify(posts)); }catch(e){} }
function saveMarketState(){ try{ localStorage.setItem(LS_MARKET, JSON.stringify(marketItems)); }catch(e){} }
function saveSavedItems(){ try{ localStorage.setItem(LS_SAVED_ITEMS, JSON.stringify(savedMarket)); }catch(e){} }
function saveMessages(){ try{ localStorage.setItem(LS_MESSAGES, JSON.stringify(messages)); }catch(e){} }
function saveNotifications(){ try{ localStorage.setItem(LS_NOTIFS, JSON.stringify(notifications)); }catch(e){} }
function saveStories(){ try{ localStorage.setItem(LS_STORIES, JSON.stringify(stories)); }catch(e){} }
function saveTheme(val){ try{ localStorage.setItem(LS_THEME, val); }catch(e){} }

/* -----------------------
   Keep current setter
   ----------------------- */
function setCurrent(user){
  currentUser = user;
  if(user) localStorage.setItem(LS_CURRENT, user);
  else localStorage.removeItem(LS_CURRENT);
}

/* -----------------------
   Small helpers (escapeHtml etc)
   ----------------------- */
function escapeHtml(str){
  if(!str && str !== 0) return '';
  const s = String(str);
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
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
/* ---- ANONYMOUS LOGIN ---- */
function onAnonymousLogin(){
  let anonId = 'anon_' + Math.floor(Math.random()*1000000);
  while(users[anonId]) anonId = 'anon_' + Math.floor(Math.random()*1000000);
  users[anonId] = {
    password: '',
    bio: 'Anonymous user',
    pic: '',
    stats: {posts:0,likes:0,comments:0},
    following: [], followers: []
  };
  saveUsers();
  setCurrent(anonId);
  openApp();
  showToast('You are now anonymous!');
}

/* -----------------------
   App open / UI wiring
   ----------------------- */
function openApp(){
  const auth = document.getElementById('authWrap');
  const main = document.getElementById('mainApp');
  if(auth) auth.style.display = 'none';
  if(main) main.style.display = 'block';
  const navTop = document.getElementById('navTop');
  const navBottom = document.getElementById('navBottom');
  if(navTop) navTop.style.display = 'block';
  if(navBottom) navBottom.style.display = window.innerWidth <= 720 ? 'block' : 'none';
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
    const profileEl = document.getElementById('profilePage');
    if(profileEl) profileEl.classList.remove('hidden');
    document.getElementById('navProfile')?.classList.add('active');
    renderProfilePosts();
    refreshProfileUI();
  } else if(page === 'explore'){
    document.getElementById('explorePage')?.classList.remove('hidden');
    document.getElementById('navExplore')?.classList.add('active');
    renderExplore();
  } else if(page === 'market'){ // News page
    document.getElementById('marketPage')?.classList.remove('hidden');
    document.getElementById('navMarket')?.classList.add('active');
    renderMarket();
    renderSavedItems();
  } else if(page === 'trending'){
    document.getElementById('trendingPage')?.classList.remove('hidden');
    document.getElementById('navTrending')?.classList.add('active');
    renderTrending();
  } else {
    document.getElementById('feedPage')?.classList.remove('hidden');
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
  const el = document.getElementById('txtPost');
  if(!el) return;
  const text = el.value;
  localStorage.setItem(LS_DRAFT + '_' + currentUser, text);
  const dn = document.getElementById('draftNotice');
  if(dn) dn.textContent = text ? 'Draft saved' : '';
}
function loadDraft(){
  if(!currentUser) return;
  const val = localStorage.getItem(LS_DRAFT + '_' + currentUser) || '';
  const el = document.getElementById('txtPost');
  if(el) el.value = val;
  const dn = document.getElementById('draftNotice');
  if(dn) dn.textContent = val ? 'Draft loaded' : '';
}
function clearDraft(){
  if(currentUser) localStorage.removeItem(LS_DRAFT + '_' + currentUser);
  const txt = document.getElementById('txtPost'); if(txt) txt.value = '';
  const fp = document.getElementById('filePost'); if(fp) fp.value = '';
  const dn = document.getElementById('draftNotice'); if(dn) dn.textContent = '';
}

/* -----------------------
   Create post (with image -> DataURL) + hashtag parsing
   ----------------------- */
function onCreatePost(){
  if(!currentUser) return showToast('Please login first');
  const textEl = document.getElementById('txtPost');
  const text = textEl ? textEl.value.trim() : '';
  const fileEl = document.getElementById('filePost');
  const file = fileEl && fileEl.files ? fileEl.files[0] : null;
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
  if(!container) return;
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
function refreshProfileUI(viewUser) {
  const u = viewUser || currentUser;
  if (!u) return;

  // define user object and pic
  const userObj = users[u] || { bio: '', pic: '', followers: [], following: [] };
  const pic = userObj.pic || `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(u)}`;

  const header = document.getElementById("profileHeader");
  if (header) {
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;">
        <img id="profilePicBig" src="${pic}" alt="profile" class="profile-pic"
             style="width:88px;height:88px;cursor:pointer;border-radius:10px;object-fit:cover;">
        <div style="flex:1">
          <div id="profileUsernameDisplay" style="font-weight:700;font-size:20px;">${escapeHtml(u)}</div>
          <div id="profileBioMini" class="muted" style="margin-top:4px">${escapeHtml(userObj.bio || 'No bio yet')}</div>
          <div style="margin-top:10px;display:flex;gap:16px;font-size:14px;">
            <div id="followersCountWrap" style="cursor:pointer;" onclick="toggleFollowList('followers')">
              Followers: <b id="followersCount">${userObj.followers?.length || 0}</b>
            </div>
            <div id="followingCountWrap" style="cursor:pointer;" onclick="toggleFollowList('following')">
              Following: <b id="followingCount">${userObj.following?.length || 0}</b>
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          ${u === currentUser ? `<input type="file" id="profilePicInput" accept="image/*" style="display:none;"><button class="small-btn" onclick="document.getElementById('profilePicInput').click()">Change Photo</button>` : ''}
        </div>
      </div>
    `;
  }

  // Render follow button & lists
  renderFollowButton(u);
  renderFollowLists(u);
}
function renderFollowButton(profileUser) {
  const wrap = document.getElementById("followBtnWrap");
  if (!wrap) return;

  if (profileUser === currentUser) {
    wrap.innerHTML = ""; // Hide for own profile
    return;
  }

  const myUser = users[currentUser];
  const target = users[profileUser];
  if (!myUser || !target) return;

  const isFollowing = myUser.following?.includes(profileUser);
  wrap.innerHTML = `
    <button class="follow-btn ${isFollowing ? "following" : "follow"}" 
            onclick="toggleFollow('${profileUser}')">
      ${isFollowing ? "Following" : "Follow"}
    </button>
  `;
}

/* unified toggleFollow (single definition) */
function toggleFollow(targetUser){
  if(!currentUser) return showToast('Please login to follow');
  if(!users[targetUser]) return showToast('User not found');
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
   Render follow lists
   ----------------------- */
function renderFollowLists(username) {
  const uObj = users[username] || {};
  const followers = uObj.followers || [];
  const following = uObj.following || [];

  const followersList = document.getElementById("followersList");
  const followingList = document.getElementById("followingList");
  if(followersList){
    followersList.innerHTML = followers
      .map(name => {
        const p =
          users[name]?.pic ||
          `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(
            name
          )}`;
        return `<div class="follow-item" onclick="showProfile('${escapeHtml(name)}')">
                  <img src="${p}" alt="follower">
                  <div class="follow-item-name">@${escapeHtml(name)}</div>
                </div>`;
      })
      .join("") || '<div class="muted">No followers yet.</div>';
  }
  if(followingList){
    followingList.innerHTML = following
      .map(name => {
        const p =
          users[name]?.pic ||
          `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(
            name
          )}`;
        return `<div class="follow-item" onclick="showProfile('${escapeHtml(name)}')">
                  <img src="${p}" alt="following">
                  <div class="follow-item-name">@${escapeHtml(name)}</div>
                </div>`;
      })
      .join("") || '<div class="muted">Not following anyone yet.</div>';
  }
}

/* wire single profilePicInput change handler */
document.addEventListener('change', (e)=>{
  if(e.target && e.target.id === 'profilePicInput'){
    const file = e.target.files[0];
    if(!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      users[currentUser].pic = reader.result;
      saveUsers();
      refreshProfileUI(currentUser);
      renderPosts();
      showToast('🖼️ Profile picture updated!');
    };
    reader.readAsDataURL(file);
  }
});

/* ensure stats exist */
(function ensureUserStats(){ Object.keys(users).forEach(u=>{ if(!users[u].stats) users[u].stats = {posts:0,likes:0,comments:0}; if(!users[u].following) users[u].following = []; if(!users[u].followers) users[u].followers = []; }); saveUsers(); })();

/* =========================
   Student Echoes - 1_fixed_part2.js
   Part 2 (continued): profile grid, modals, explore, news, notifications, trending, stories, init
   ========================= */

/* -----------------------
   Profile grid rendering
   ----------------------- */
function renderProfilePosts(viewUser){
  const u = viewUser || currentUser;
  if(!u) return;
  const grid = document.getElementById('profileGrid');
  if(!grid) return;
  grid.innerHTML = '';
  const userPosts = posts.filter(p => p.user === u);
  const countEl = document.getElementById('profilePostCount');
  if(countEl) countEl.textContent = userPosts.length;
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
  if(!modalRoot) return;
  const likedText = post.likedBy.includes(currentUser) ? '💔 Unlike' : '❤️ Like';
  modalRoot.innerHTML = `
    <div class="modal" id="modal-${post.id}">
      <div class="modal-card" role="dialog" aria-labelledby="post-${post.id}">
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
  document.body.classList.add('modal-open');
}
function closePostModal(id){
  const modalRoot = document.getElementById('viewModal');
  if(!modalRoot) return;
  modalRoot.innerHTML = '';
  modalRoot.style.display = 'none';
  document.body.classList.remove('modal-open');
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
  const main = document.getElementById('mainApp');
  const auth = document.getElementById('authWrap');
  if(main) main.style.display = 'none';
  if(auth) auth.style.display = 'flex';
  const navTop = document.getElementById('navTop'); if(navTop) navTop.style.display='none';
  const navBottom = document.getElementById('navBottom'); if(navBottom) navBottom.style.display='none';
  showToast('👋 Logged out successfully.');
}

function enterCompose(){
  showPage('feed');
  const t = document.getElementById('txtPost');
  if(t) t.focus();
}

/* -----------------------
   Wire profile pic input (already added in Part1)
   ----------------------- */

/* -----------------------
   Profile grid rendering continued in Part1
   ----------------------- */

/* modal utilities for simple modals */
function closeSimpleModal(id){ 
  const m = document.getElementById(id); 
  if(m){
    m.style.display='none';
    // if this is viewModal, clear innerHTML
    if(id === 'viewModal') m.innerHTML = '';
  }
  document.body.classList.remove('modal-open');
}

/* ------------------------
   Explore (kept)
   ------------------------ */
function renderExplore(){
  const inp = document.getElementById('exploreSearch');
  const q = inp ? inp.value.trim().toLowerCase() : '';
  const resultsRoot = document.getElementById('exploreResults');
  if(!resultsRoot) return;
  resultsRoot.innerHTML = '';
  const filtered = posts.filter(p => {
    if(!q) return true;
    return p.user.toLowerCase().includes(q) || (p.text && p.text.toLowerCase().includes(q));
  });
  const countEl = document.getElementById('exploreCount');
  if(countEl) countEl.textContent = filtered.length + ' results';
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
  if(!root) return;
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
  if(!modalRoot) return;
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
  document.body.classList.add('modal-open');
}
function closeMarketModal(){ 
  const root = document.getElementById('viewModal');
  if(root){ root.innerHTML=''; root.style.display='none'; }
  document.body.classList.remove('modal-open');
}

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
  if(!root || !count) return;
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

/* notification sound guard (play only after user interaction) */
let _userInteractedForSound = false;
document.addEventListener('pointerdown', ()=>{ _userInteractedForSound = true; }, {once:true});

const _notifAudio = new Audio();
_notifAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='; // minimal placeholder

function playNotifSound(){
  if(!_userInteractedForSound) return;
  try{ _notifAudio.currentTime = 0; _notifAudio.play().catch(()=>{}); }catch(e){}
}

function addNotification(username, type, text, meta={}){
  notifications[username] = notifications[username] || [];
  notifications[username].unshift({ type, text, meta, at: new Date().toISOString(), read: false });
  saveNotifications();
  renderNotificationsDot();
  const cur = localStorage.getItem(LS_CURRENT);
  if(cur && username === cur) playNotifSound();
}

function getNotifications(username){
  return notifications[username] || [];
}
function toggleNotifications(){
  const modal = document.getElementById('notificationsModal');
  if(!modal) return;
  const list = getNotifications(currentUser || '__guest__');
  modal.innerHTML = `<div class="modal"><div class="modal-card">
    <div style="display:flex;justify-content:space-between;align-items:center"><h3>Notifications</h3><button class="small-btn" onclick="closeSimpleModal('notificationsModal')">Close</button></div>
    <div style="margin-top:8px;max-height:60vh;overflow:auto">
      ${list.length===0 ? '<div class="muted">No notifications</div>' : list.map(n=>`<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><div style="font-weight:700">${escapeHtml(n.text)}</div><div style="font-size:12px;color:var(--muted)">${new Date(n.at).toLocaleString()}</div></div>`).join('')}
    </div>
  </div></div>`;
  modal.style.display = 'block';
  document.body.classList.add('modal-open');
}
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
  if(!root) return;
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
function addStory(){ if(!currentUser) return showToast('Login to add story'); stories.unshift({id:'st'+Date.now(), user: currentUser, img:'', createdAt: new Date().toISOString()}); saveStories(); renderStories(); showToast('Story added'); }

/* ------------------------
   Misc small helpers / profile edit
   ------------------------ */
function enterEditProfile(){ showPage('profile'); const b = document.getElementById('bio'); if(b) b.focus(); }
function cancelEditProfile(){ if(currentUser && users[currentUser]){ const b = document.getElementById('bio'); if(b) b.value = users[currentUser].bio || ''; } showToast('Edit cancelled'); }
function updateProfileUsername(){ showToast('Username cannot be changed in this demo'); }

/* ------------------------
   Editor modal (simple)
   ------------------------ */
function openEditorModal(postId){
  const modalRoot = document.getElementById('viewModal');
  if(!modalRoot) return;
  if(postId){
    const post = posts.find(p=>p.id===postId);
    if(!post) return;
    modalRoot.innerHTML = `<div class="modal"><div class="modal-card"><h3>Edit post</h3><textarea id="editorText">${escapeHtml(post.text)}</textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="primary" onclick="saveEdit(${postId})">Save</button><button class="small-btn" onclick="closePostModal(${postId})">Cancel</button></div></div></div>`;
  } else {
    modalRoot.innerHTML = `<div class="modal"><div class="modal-card"><h3>Compose</h3><textarea id="editorText"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="primary" onclick="saveNewFromEditor()">Post</button><button class="small-btn" onclick="closePostModal('editor')">Cancel</button></div></div></div>`;
  }
  modalRoot.style.display = 'block';
  document.body.classList.add('modal-open');
}
function saveEdit(postId){
  const txtEl = document.getElementById('editorText');
  const txt = txtEl ? txtEl.value.trim() : '';
  const post = posts.find(p=>p.id===postId);
  if(!post) return;
  post.text = txt;
  post.editedAt = new Date().toISOString();
  savePosts(); renderPosts(); closePostModal(postId); showToast('Post updated');
}
function saveNewFromEditor(){
  const txtEl = document.getElementById('editorText');
  const txt = txtEl ? txtEl.value.trim() : '';
  if(!txt) return showToast('Write something');
  createPostObject(txt, null);
  closePostModal('editor');
}

/* ------------------------
   Notifications UI wiring
   ------------------------ */
function openMessagesModal(){
  const modal = document.getElementById('messagesModal');
  if(!modal) return;
  modal.innerHTML = `<div class="modal"><div class="modal-card"><h3>Messages (demo)</h3><div class="muted">Messaging is a light demo in this build.</div><div style="margin-top:8px"><button class="small-btn" onclick="closeSimpleModal('messagesModal')">Close</button></div></div></div>`;
  modal.style.display = 'block';
  document.body.classList.add('modal-open');
}

/* global exposure for UI */
window.showPage = showPage;
window.onRegister = onRegister;
window.onLogin = onLogin;
window.onAnonymousLogin = onAnonymousLogin;
window.onCreatePost = onCreatePost;
window.clearDraft = clearDraft;
window.saveDraft = saveDraft;
window.enterCompose = enterCompose;
window.logout = logout;
window.toggleNotifDot = function(){ const d = document.getElementById('notifDot'); if(d.style.display === 'none' || !d.style.display) { d.style.display='inline-block'; showToast('You have new notifications'); } else { d.style.display='none'; showToast('Notifications cleared'); } };
window.toggleLike = toggleLike;
window.toggleCommentsArea = toggleCommentsArea;
window.addComment = addComment;
window.onEditPost = onEditPost;
window.onDeletePost = onDeletePost;
window.showProfile = showProfile;
window.updateBio = function(){ const valEl = document.getElementById('bio'); const val = valEl ? valEl.value.trim() : ''; if(!currentUser) return showToast('No current user'); users[currentUser].bio = val; saveUsers(); renderPosts(); refreshProfileUI(); showToast('✏️ Bio updated!'); };
window.updateProfilePic = function(e){ const f = e.target.files && e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = () => { users[currentUser].pic = reader.result; saveUsers(); refreshProfileUI(); renderPosts(); showToast('🖼️ Profile picture updated'); renderProfilePosts(); }; reader.readAsDataURL(f); };
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

/* Final small init */
(function finalInit(){
  // Apply saved theme early (ensures CSS variables get the right class)
  const t_local = localStorage.getItem(LS_THEME) || localStorage.getItem('se_theme') || 'dark';
  if(t_local === 'light') document.body.classList.add('light');
  else document.body.classList.remove('light');

  // Auto load sample news only if LS empty
  if(!localStorage.getItem(LS_MARKET)) saveMarketState();
  renderNotificationsDot();
  renderTrending();

  // ensure nav adapts once fully loaded
  function adaptNav(){
    const navTop = document.getElementById('navTop');
    const navBottom = document.getElementById('navBottom');
    if(!navTop || !navBottom) return;
    if(window.innerWidth <= 720){ navTop.style.display='none'; navBottom.style.display='block'; }
    else { navTop.style.display='block'; navBottom.style.display='none'; }
  }
  window.addEventListener('resize', adaptNav);
  window.addEventListener('load', adaptNav);
  adaptNav();
})();

/* Stories horizontal scroll enhancement */
(function enhanceStoriesScroll(){
  const storiesContainer = document.getElementById('storiesBar');
  if(storiesContainer){
    storiesContainer.addEventListener('wheel', (e)=>{
      e.preventDefault();
      storiesContainer.scrollLeft += e.deltaY;
    }, {passive:false});
  }
})();

/* Storage sync across tabs */
window.addEventListener('storage', ()=> {
  users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  posts = JSON.parse(localStorage.getItem(LS_POSTS) || '[]');
  savedMarket = JSON.parse(localStorage.getItem(LS_SAVED_ITEMS) || '[]');
  messages = JSON.parse(localStorage.getItem(LS_MESSAGES) || '{}');
  notifications = JSON.parse(localStorage.getItem(LS_NOTIFS) || '{}');
  stories = JSON.parse(localStorage.getItem(LS_STORIES) || '[]');
  updateCounts();
});

