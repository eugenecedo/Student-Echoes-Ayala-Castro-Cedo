// feed.js - Social Dashboard with Categories (ADD-ONLY mode: categories can be added, not removed)

// Seed friends
const seedFriends = [
  { id:1, name:'Emily', avatar:'https://i.pravatar.cc/40?img=1', online:true },
  { id:2, name:'Fiona', avatar:'https://i.pravatar.cc/40?img=2', online:true },
  { id:3, name:'Jennifer', avatar:'https://i.pravatar.cc/40?img=3', online:false },
  { id:4, name:'Anne', avatar:'https://i.pravatar.cc/40?img=4', online:false },
  { id:5, name:'Andrew', avatar:'https://i.pravatar.cc/40?img=5', online:true },
  { id:6, name:'Sonia', avatar:'https://i.pravatar.cc/40?img=6', online:false },
];

// categories store (persisted in localStorage). In "JUST ADD" mode we provide add/edit limited to rename; no delete.
let categories = JSON.parse(localStorage.getItem('categories') || 'null') || [
  { id: 1, name: 'Photography' },
  { id: 2, name: 'Technology' },
  { id: 3, name: 'Lifestyle' },
  { id: 4, name: 'Space' }
];

// active category filter, null = all
let activeCategoryId = null;

let posts = [
  {
    id:101,
    author:{name:'Amandine', avatar:'https://i.pravatar.cc/48?img=12'},
    time:'2:34 PM',
    text:'Just took a late walk through the hills. The light was incredible.',
    image:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=60&auto=format&fit=crop',
    categoryId: 1,
    likes:89, comments:4, shares:1, liked:false
  },
  {
    id:102,
    author:{name:'Casie', avatar:'https://i.pravatar.cc/48?img=45'},
    time:'3:12 AM',
    text:'Foggy mornings are my favorite. Coffee + mist = mood.',
    image:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=60&auto=format&fit=crop',
    categoryId: 3,
    likes:25, comments:6, shares:0, liked:false
  }
];

let notifications = [
  { id:1, text:'Holly Harrel added a photo to Talk.', time:'about an hour ago', avatar:'https://i.pravatar.cc/36?img=10' },
  { id:2, text:'Jennifer sent you a friend request.', time:'4 hours ago', avatar:'https://i.pravatar.cc/36?img=3' }
];

const communities = [
  { id:1, name:'UI/UX Designers', members:54 },
  { id:2, name:'Frontend Developers', members:16 },
];

// Profile utilities
function getUserProfile() {
  const raw = localStorage.getItem('userProfile');
  if (raw) return JSON.parse(raw);
  // Default profile
  return {
    name: "Marjohn",
    avatar: "https://i.pravatar.cc/80?img=7",
    bio: "Frontend developer at AMU. Passionate about design, accessibility, and coffee ☕️.",
    joined: "Feb 2024",
    communitiesJoined: 2
  };
}
function setUserProfile(upd) {
  localStorage.setItem('userProfile', JSON.stringify(upd));
  renderTopRightUser();
}

// persist categories helper
function saveCategories() {
  localStorage.setItem('categories', JSON.stringify(categories));
}

// DOM refs
const friendsList = document.getElementById('friends-list');
const feedEl = document.getElementById('feed');
const notifList = document.getElementById('notif-list');
const commList = document.getElementById('communities-list');
const themeToggle = document.getElementById('theme-toggle');
const clearNotifsBtn = document.getElementById('clear-notifs');
const postForm = document.getElementById('post-form');
const postText = document.getElementById('post-text');
const hamburger = document.getElementById('hamburger');
const overlay = document.getElementById('overlay');
const body = document.body;
const sidebar = document.getElementById('sidebar');
const navList = document.getElementById('nav-list');
const tabFeed = document.getElementById('tab-feed');
const tabNews = document.getElementById('tab-news');
const tabProfile = document.getElementById('tab-profile');
const tabCategories = document.getElementById('tab-categories');
const userImg = document.querySelector('.user img');
const userName = document.querySelector('.username');
const addImageBtn = document.getElementById('add-image-btn');
const postImage = document.getElementById('post-image');
const preview = document.getElementById('preview');
const postCategorySelect = document.getElementById('post-category');
const newCategoryBtn = document.getElementById('new-category-btn');
const categoriesContent = document.getElementById('categories-content');
const globalSearch = document.getElementById('global-search');

if (addImageBtn) addImageBtn.addEventListener('click', () => postImage.click());

postImage.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = function(e){
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = 'none';
  }
});

// Minimal news fetch helpers used by the app
async function fetchNewsFromSpaceflight(limit = 8) {
  const url = `https://api.spaceflightnewsapi.net/v3/articles?_limit=${limit}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Spaceflight API ${res.status}`);
  const data = await res.json();
  return data.map(item => ({
    title: item.title,
    url: item.url,
    summary: item.summary,
    source: item.newsSite || 'Spaceflight'
  }));
}
async function fetchNewsFromHN(limit = 8) {
  const url = `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`HN Algolia ${res.status}`);
  const data = await res.json();
  return (data.hits || []).map(h => ({
    title: h.title || h.story_title || 'Untitled',
    url: h.url || h.story_url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    summary: h.comment_text ? h.comment_text.replace(/<[^>]+>/g,'') : '',
    source: 'Hacker News'
  }));
}
async function fetchNews(preferredLimit = 8) {
  try { return { items: await fetchNewsFromSpaceflight(preferredLimit), used: 'spaceflight' }; }
  catch(e) { return { items: await fetchNewsFromHN(preferredLimit), used: 'hackernews' }; }
}
async function renderNews(useCache = false) {
  const container = document.getElementById('news-content');
  if(!container) return;
  container.innerHTML = `<div style="color:var(--muted)">Loading news…</div>`;
  try {
    const r = await fetchNews(6);
    container.innerHTML = r.items.map(i=>`
      <div style="margin-bottom:12px">
        <a href="${i.url}" target="_blank" rel="noopener">${escapeHtml(i.title)}</a>
        <div style="color:var(--muted);font-size:13px">${escapeHtml(i.summary || '')}</div>
      </div>
    `).join('');
  } catch(err){
    container.innerHTML = `<div class="muted">Couldn't load news.</div>`;
  }
}

// --- UI renderers ---

function renderTopRightUser() {
  const user = getUserProfile();
  if (userImg) userImg.src = user.avatar;
  if (userName) userName.textContent = user.name;
}

function renderFriends(){
  if(!friendsList) return;
  friendsList.innerHTML = '';
  seedFriends.forEach(f=>{
    const div = document.createElement('div');
    div.className = 'friend';
    div.innerHTML = `
      <img src="${f.avatar}" alt="${escapeHtml(f.name)}" />
      <div style="flex:1">
        <div style="font-weight:600">${escapeHtml(f.name)}</div>
        <div style="font-size:12px; color:var(--muted)">${f.online ? 'Online' : 'Offline'}</div>
      </div>
      <div style="width:10px;height:10px;border-radius:50%; background:${f.online ? '#34d399' : '#94a3b8'}"></div>
    `;
    friendsList.appendChild(div);
  });
}

function getCategoryName(catId){
  if(!catId) return 'Uncategorized';
  const c = categories.find(x=>x.id === catId);
  return c ? c.name : 'Uncategorized';
}

function renderFeed(){
  if(!feedEl) return;
  const searchTerm = (globalSearch && globalSearch.value || '').trim().toLowerCase();
  let visible = posts.slice();

  // apply category filter
  if(activeCategoryId){
    visible = visible.filter(p => p.categoryId === activeCategoryId);
  }

  // apply search
  if(searchTerm){
    visible = visible.filter(p => (p.text || '').toLowerCase().includes(searchTerm) || getCategoryName(p.categoryId).toLowerCase().includes(searchTerm) || (p.author && p.author.name && p.author.name.toLowerCase().includes(searchTerm)));
  }

  feedEl.innerHTML = '';
  if(visible.length === 0){
    feedEl.innerHTML = `<div class="card muted" style="padding:12px;">No posts match your filters.</div>`;
    return;
  }

  visible.forEach(post=>{
    const article = document.createElement('article');
    article.className = 'post card';
    article.innerHTML = `
      <div class="post-head">
        <img src="${post.author.avatar}" alt="${escapeHtml(post.author.name)}" />
        <div style="flex:1">
          <div style="font-weight:600">${escapeHtml(post.author.name)}</div>
          <div style="font-size:12px; color:var(--muted)">${escapeHtml(post.time)} • <span style="font-weight:600">${escapeHtml(getCategoryName(post.categoryId))}</span></div>
        </div>
        <div style="font-size:18px; opacity:.6">
          <button class="icon-btn menu-btn" data-id="${post.id}" title="Post menu">•••</button>
        </div>
      </div>
      <div class="post-body">
        <div>${escapeHtml(post.text)}</div>
        ${post.image ? `<img src="${post.image}" alt="post image">` : ''}
      </div>
      <div class="post-foot">
        <div>
          <button class="icon-btn like-btn ${post.liked ? 'liked' : ''}" data-id="${post.id}">
            ❤️ <span class="like-count">${post.likes}</span>
          </button>
          <span style="margin-left:12px">💬 ${post.comments}</span>
          <span style="margin-left:12px">🔁 ${post.shares}</span>
          <button class="icon-btn share-btn" data-id="${post.id}" style="margin-left:12px;" title="Share">Share</button>
        </div>
      </div>
    `;
    feedEl.appendChild(article);
  });

  // attach handlers
  document.querySelectorAll('.like-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.getAttribute('data-id'));
      toggleLike(id);
    });
  });

  document.querySelectorAll('.share-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.getAttribute('data-id'));
      sharePost(id);
    });
  });

  document.querySelectorAll('.menu-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = Number(btn.getAttribute('data-id'));
      openPostMenu(e.currentTarget, id);
    });
  });
}

function renderNotifications(){
  if(!notifList) return;
  notifList.innerHTML = '';
  if(notifications.length === 0){
    notifList.innerHTML = '<div class="muted">No notifications</div>';
    return;
  }
  notifications.forEach(n=>{
    const div = document.createElement('div');
    div.style.display = 'flex'; div.style.gap='10px'; div.style.marginBottom='8px';
    div.innerHTML = `<img src="${n.avatar}" style="width:36px;height:36px;border-radius:50%"/><div><div style="font-weight:600">${escapeHtml(n.text)}</div><div style="font-size:12px;color:var(--muted)">${escapeHtml(n.time)}</div></div>`;
    notifList.appendChild(div);
  });
}

function renderCommunities(){
  if(!commList) return;
  commList.innerHTML = '';
  communities.forEach(c=>{
    const row = document.createElement('div');
    row.style.display='flex'; row.style.justifyContent='space-between'; row.style.marginBottom='8px';
    row.innerHTML = `<div>
    <button class="btn small join-community" data-id="${c.id}" style="background:var(--accent);color:white;border:0;">
      Join
    </button> ${escapeHtml(c.name)}
    </div>
    <div style="font-size:12px;color:var(--muted)">${c.members} members</div>`;
    commList.appendChild(row);
  });
  document.querySelectorAll('.join-community').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cId = Number(btn.getAttribute('data-id'));
      joinCommunity(cId);
    });
  });
}

// --- Categories UI & actions (ADD-ONLY mode) ---

function renderPostCategoryOptions() {
  if(!postCategorySelect) return;
  postCategorySelect.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = '';
  allOpt.textContent = '— None —';
  postCategorySelect.appendChild(allOpt);
  categories.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = String(c.id);
    opt.textContent = c.name;
    postCategorySelect.appendChild(opt);
  });
}

function renderCategoriesPage() {
  if(!categoriesContent) return;
  // compute counts
  const counts = {};
  posts.forEach(p => {
    const id = p.categoryId || 0;
    counts[id] = (counts[id] || 0) + 1;
  });
  categoriesContent.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-weight:600">Categories</div>
      <div>
        <button class="btn small" id="clearCategoryFilterBtn">Show All</button>
        <button class="btn small" id="addCategoryBtn">Add Category</button>
      </div>
    </div>
    <div id="category-list" style="min-height:100px;"></div>
  `;
  const list = document.getElementById('category-list');
  // All item
  const allRow = document.createElement('div');
  allRow.style.display = 'flex'; allRow.style.justifyContent = 'space-between'; allRow.style.marginBottom='8px';
  allRow.innerHTML = `<div><button class="btn small category-filter" data-id="" style="margin-right:8px;">View</button> All</div><div style="font-size:12px;color:var(--muted)">${posts.length} posts</div>`;
  list.appendChild(allRow);

  categories.forEach(c=>{
    const row = document.createElement('div');
    row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.marginBottom='8px';
    const cnt = counts[c.id] || 0;
    // NOTE: no delete button included (JUST ADD). We do include an optional rename button to allow simple corrections.
    row.innerHTML = `<div><button class="btn small category-filter" data-id="${c.id}" style="margin-right:8px;">View</button> ${escapeHtml(c.name)}</div><div style="font-size:12px;color:var(--muted)">${cnt} posts <button class="btn small rename-cat" data-id="${c.id}" style="margin-left:8px;">Rename</button></div>`;
    list.appendChild(row);
  });

  // attach listeners
  document.querySelectorAll('.category-filter').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idVal = btn.getAttribute('data-id');
      activeCategoryId = idVal ? Number(idVal) : null;
      renderFeed();
      // switch to feed tab
      setActiveTab('feed');
    });
  });

  const clearBtn = document.getElementById('clearCategoryFilterBtn');
  const addBtn = document.getElementById('addCategoryBtn');
  if(clearBtn) clearBtn.addEventListener('click', ()=>{
    activeCategoryId = null;
    renderFeed();
  });
  if(addBtn) addBtn.addEventListener('click', addCategoryPrompt);

  // rename (allowed) — still considered an "add-only" style change because we're not removing categories
  document.querySelectorAll('.rename-cat').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.getAttribute('data-id'));
      const cat = categories.find(c=>c.id===id);
      if(!cat) return;
      const name = prompt('Rename category:', cat.name);
      if(name && name.trim()){
        cat.name = name.trim();
        saveCategories();
        renderPostCategoryOptions();
        renderCategoriesPage();
      }
    });
  });
}

function addCategoryPrompt(){
  const name = prompt('New category name:');
  if(!name) return;
  const trimmed = name.trim();
  if(!trimmed) return;
  // avoid duplicate names (case-insensitive)
  const exists = categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
  if(exists){
    alert('A category with that name already exists.');
    return;
  }
  const id = Date.now();
  categories.push({ id, name: trimmed });
  saveCategories();
  renderPostCategoryOptions();
  renderCategoriesPage();
}

// Helper to set UI active tab programmatically
function setActiveTab(tabName) {
  if(!navList) return;
  navList.querySelectorAll('li').forEach(li => li.classList.toggle('active', li.getAttribute('data-tab') === tabName));
  // show/hide tabs
  tabFeed.style.display = tabName === 'feed' ? '' : 'none';
  feedEl.style.display = tabName === 'feed' ? '' : 'none';
  tabNews.style.display = tabName === 'news' ? '' : 'none';
  tabProfile.style.display = tabName === 'profile' ? '' : 'none';
  tabCategories.style.display = tabName === 'Categories' ? '' : 'none';
  if(tabName === 'news') renderNews(true);
  if(tabName === 'profile') renderProfile(false);
  if(tabName === 'Categories') {
    renderCategoriesPage();
  }
}

// actions
function toggleLike(postId){
  posts = posts.map(p=>{
    if(p.id === postId){
      const liked = !p.liked;
      return { ...p, liked, likes: liked ? p.likes + 1 : p.likes - 1 };
    }
    return p;
  });
  renderFeed();
}

function joinCommunity(cId){
  const comm = communities.find(c=>c.id===cId);
  if(comm){
    comm.members += 1;
    notifications.unshift({ id:Date.now(), text:`You joined ${comm.name}.`, time:'just now', avatar:'https://i.pravatar.cc/36?img=65' });
    renderCommunities(); renderNotifications();
  }
}

function sharePost(postId){
  const post = posts.find(p=>p.id===postId);
  if(!post) return;
  let textToCopy = post.text || '';
  if(post.image) textToCopy += '\n' + post.image;
  if(post.categoryId) textToCopy += `\nCategory: ${getCategoryName(post.categoryId)}`;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(textToCopy).then(()=>{
      notifications.unshift({id:Date.now(), text:'Copied post to clipboard!', time:'just now', avatar:'https://i.pravatar.cc/36?img=65'});
      renderNotifications();
    }).catch(()=> {
      notifications.unshift({id:Date.now(), text:'Could not copy to clipboard.', time:'just now', avatar:'https://i.pravatar.cc/36?img=65'});
      renderNotifications();
    });
  } else {
    notifications.unshift({id:Date.now(), text:'Clipboard not supported.', time:'just now', avatar:'https://i.pravatar.cc/36?img=65'});
    renderNotifications();
  }
}

// Small util to avoid HTML injection when inserting text
function escapeHtml(str){
  if(!str && str !== 0) return '';
  return String(str).replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

// Theme
function initTheme(){
  const saved = localStorage.getItem('theme');
  if(saved === 'light'){
    body.classList.add('theme-light');
    if(themeToggle) { themeToggle.textContent = 'Dark'; themeToggle.setAttribute('aria-pressed','true'); }
  } else {
    body.classList.remove('theme-light');
    if(themeToggle) { themeToggle.textContent = 'Light'; themeToggle.setAttribute('aria-pressed','false'); }
  }
}

// Drawer (hamburger)
function openDrawer(){
  body.classList.add('drawer-open');
  hamburger.setAttribute('aria-expanded','true');
  sidebar.setAttribute('tabindex','-1');
  sidebar.focus();
}
function closeDrawer(){
  body.classList.remove('drawer-open');
  hamburger.setAttribute('aria-expanded','false');
}

// Editable Profile Functionality
function renderProfile(editMode = false) {
  const profileContent = document.getElementById('profile-content');
  const user = getUserProfile();
  const postCount = posts.filter(p => p.author.name === user.name).length;

  if (!profileContent) return;

  if (!editMode) {
    profileContent.innerHTML = `
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
        <img src="${user.avatar}" alt="${escapeHtml(user.name)}" style="width:80px;height:80px;border-radius:50%;">
        <div>
          <div style="font-size:22px;font-weight:700;">${escapeHtml(user.name)}</div>
          <div style="color:var(--muted);font-size:15px;">
            ${escapeHtml(user.bio)}
          </div>
          <div style="margin-top:6px; font-size:13px;">
            <span>Joined: ${escapeHtml(user.joined)}</span>
          </div>
        </div>
      </div>
      <div>
        <strong>Posts:</strong> ${postCount} <br>
        <strong>Communities:</strong> ${user.communitiesJoined}
      </div>
      <div style="margin-top:18px;">
        <button class="btn small" id="editProfileBtn">Edit Profile</button>
      </div>
    `;
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
      editBtn.onclick = () => renderProfile(true);
    }
  } else {
    profileContent.innerHTML = `
      <form id="editProfileForm" style="display:flex;flex-direction:column;gap:10px;">
        <label>
          Name:<br>
          <input type="text" name="name" value="${escapeHtml(user.name)}" style="width:100%;padding:6px;border-radius:6px;">
        </label>
        <label>
          Avatar URL:<br>
          <input type="text" name="avatar" value="${escapeHtml(user.avatar)}" style="width:100%;padding:6px;border-radius:6px;">
        </label>
        <label>
          Bio:<br>
          <textarea name="bio" rows="3" style="width:100%;padding:6px;border-radius:6px;">${escapeHtml(user.bio)}</textarea>
        </label>
        <div style="margin-top:12px;">
          <button class="btn small" id="saveProfileBtn" type="submit">Save</button>
          <button class="btn small" id="cancelProfileBtn" type="button" style="margin-left:8px;">Cancel</button>
        </div>
      </form>
    `;
    const form = document.getElementById('editProfileForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const prev = getUserProfile();
      const newProfile = {
        name: (formData.get('name') || prev.name).trim(),
        avatar: (formData.get('avatar') || prev.avatar).trim(),
        bio: (formData.get('bio') || '').trim(),
        joined: prev.joined,
        communitiesJoined: prev.communitiesJoined
      };
      setUserProfile(newProfile);
      updateCurrentUserName(prev, newProfile);
      renderProfile(false);
    };
    document.getElementById('cancelProfileBtn').onclick = () => renderProfile(false);
  }
}

// Update posts authored by user when profile changes
function updateCurrentUserName(prevProfile, newProfile) {
  posts = posts.map(p => {
    if(p.author.name === prevProfile.name || p.author.avatar === prevProfile.avatar){
      return { ...p, author: { name: newProfile.name, avatar: newProfile.avatar } };
    }
    return p;
  });
  sessionStorage.setItem('lastProfileName', newProfile.name);
  renderFeed();
  renderTopRightUser();
}

// Post menu: allow delete (for own posts)
function openPostMenu(btn, postId){
  let menu = document.getElementById('post-menu-temp');
  if(menu) menu.remove();
  const user = getUserProfile();
  const post = posts.find(p=>p.id===postId);
  if(!post || post.author.name !== user.name) return;

  menu = document.createElement('div');
  menu.id = 'post-menu-temp';
  menu.style.position = 'absolute';
  menu.style.background = 'var(--panel-dark)';
  menu.style.color = 'white';
  menu.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
  menu.style.borderRadius = '8px';
  menu.style.zIndex = '999';
  menu.style.padding = '8px 16px';
  menu.innerHTML = `<button class="btn small" id="delete-post-menu-btn">Delete</button>`;
  document.body.appendChild(menu);

  const rect = btn.getBoundingClientRect();
  let left = rect.left;
  if(left + 220 > window.innerWidth) left = window.innerWidth - 240;
  menu.style.left = left + 'px';
  menu.style.top = (rect.bottom + window.scrollY) + 'px';

  document.getElementById('delete-post-menu-btn').onclick = () => {
    posts = posts.filter(p=>p.id!==postId);
    notifications.unshift({id:Date.now(), text:'You deleted a post.', time:'just now', avatar:user.avatar});
    renderFeed(); renderNotifications();
    menu.remove();
  };

  // remove menu if click outside
  window.addEventListener('mousedown', function handler(e){
    if(!menu.contains(e.target) && e.target !== btn){
      menu.remove();
      window.removeEventListener('mousedown', handler);
    }
  });
}

// Listeners
if (themeToggle) {
  themeToggle.addEventListener('click', ()=>{
    if(body.classList.contains('theme-light')){
      body.classList.remove('theme-light');
      themeToggle.textContent='Light';
      themeToggle.setAttribute('aria-pressed','false');
      localStorage.setItem('theme','dark');
    } else {
      body.classList.add('theme-light');
      themeToggle.textContent='Dark';
      themeToggle.setAttribute('aria-pressed','true');
      localStorage.setItem('theme','light');
    }
  });
}

// Nav/tab handler
if (navList) {
  navList.addEventListener('click', (e)=>{
    if(e.target.tagName==='LI'){
      const tab = e.target.getAttribute('data-tab');
      setActiveTab(tab);
    }
  });
}

// Create post handling
function createPost(e){
  e.preventDefault();
  const text = (postText.value || '').trim();
  const file = postImage.files[0];
  const selectedCat = postCategorySelect ? (postCategorySelect.value || '') : '';

  const categoryId = selectedCat ? Number(selectedCat) : null;

  if(file){
    const reader = new FileReader();
    reader.onload = function(ev){
      actuallyCreatePost(text, ev.target.result, categoryId);
    };
    reader.readAsDataURL(file);
  } else {
    actuallyCreatePost(text, null, categoryId);
  }
}

function actuallyCreatePost(text, imageData, categoryId){
  if(!text && !imageData) return;

  const user = getUserProfile();
  const newP = {
    id: Date.now(),
    author:{name:user.name, avatar:user.avatar},
    time:'just now',
    text: text,
    image: imageData,
    categoryId: categoryId,
    likes:0, comments:0, shares:0, liked:false
  };
  posts.unshift(newP);
  notifications.unshift({ id:Date.now(), text:'You posted to the feed.', time:'just now', avatar:newP.author.avatar });
  postText.value=''; 
  postImage.value=''; 
  if(preview) preview.style.display='none';
  if(postCategorySelect) postCategorySelect.value = '';
  renderFeed(); 
  renderNotifications();
}

if (postForm) postForm.addEventListener('submit', createPost);

// new category button in post form
if (newCategoryBtn) {
  newCategoryBtn.addEventListener('click', addCategoryPrompt);
}

// search
if (globalSearch) {
  globalSearch.addEventListener('input', () => renderFeed());
}

// App init
function init(){
  renderTopRightUser();
  renderFriends();
  renderCommunities();
  renderPostCategoryOptions();
  setTimeout(()=>{ renderFeed(); renderNotifications(); }, 150);
  initTheme();
}
init();

// Clear notifications
if (clearNotifsBtn) {
  clearNotifsBtn.addEventListener('click', ()=>{
    notifications = []; renderNotifications();
  });
}

// hamburger and overlay events
if (hamburger) {
  hamburger.addEventListener('click', ()=>{
    if(body.classList.contains('drawer-open')) closeDrawer(); else openDrawer();
  });
}
if (overlay) overlay.addEventListener('click', closeDrawer);

// close drawer with Escape
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && body.classList.contains('drawer-open')) closeDrawer();
});