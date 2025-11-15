// feed.js - Social Dashboard with Editable Profile + Working News (multiple sources + fallback)

// Seed data
const seedFriends = [
  { id:1, name:'Emily', avatar:'https://i.pravatar.cc/40?img=1', online:true },
  { id:2, name:'Fiona', avatar:'https://i.pravatar.cc/40?img=2', online:true },
  { id:3, name:'Jennifer', avatar:'https://i.pravatar.cc/40?img=3', online:false },
  { id:4, name:'Anne', avatar:'https://i.pravatar.cc/40?img=4', online:false },
  { id:5, name:'Andrew', avatar:'https://i.pravatar.cc/40?img=5', online:true },
  { id:6, name:'Sonia', avatar:'https://i.pravatar.cc/40?img=6', online:false },
];

let posts = [
  {
    id:101,
    author:{name:'Amandine', avatar:'https://i.pravatar.cc/48?img=12'},
    time:'2:34 PM',
    text:'Just took a late walk through the hills. The light was incredible.',
    image:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=60&auto=format&fit=crop',
    likes:89, comments:4, shares:1, liked:false
  },
  {
    id:102,
    author:{name:'Casie', avatar:'https://i.pravatar.cc/48?img=45'},
    time:'3:12 AM',
    text:'Foggy mornings are my favorite. Coffee + mist = mood.',
    image:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=60&auto=format&fit=crop',
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
const userImg = document.querySelector('.user img');
const userName = document.querySelector('.username');
const addImageBtn = document.getElementById('add-image-btn');
const postImage = document.getElementById('post-image');
const preview = document.getElementById('preview');

addImageBtn.addEventListener('click', () => postImage.click());

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

async function fetchNewsFromNewsAPI(apiKey, pageSize = 8) {
  // This uses the v2 top-headlines endpoint; subject to CORS and API key limits.
  const url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=${pageSize}`;
  try {
    const res = await fetch(`${url}&apiKey=${encodeURIComponent(apiKey)}`);
    if(!res.ok) throw new Error(`NewsAPI response ${res.status}`);
    const data = await res.json();
    if(data.status !== 'ok') throw new Error('NewsAPI error');
    return data.articles.map(a => ({
      title: a.title || 'Untitled',
      url: a.url || '#',
      summary: a.description || a.content || '',
      source: (a.source && a.source.name) || 'NewsAPI'
    }));
  } catch (err) {
    console.warn('NewsAPI failed:', err);
    throw err;
  }
}

async function fetchNewsFromSpaceflight(limit = 8) {
  const url = `https://api.spaceflightnewsapi.net/v3/articles?_limit=${limit}`;
  try {
    const res = await fetch(url);
    if(!res.ok) throw new Error(`Spaceflight API ${res.status}`);
    const data = await res.json();
    return data.map(item => ({
      title: item.title,
      url: item.url,
      summary: item.summary,
      source: item.newsSite || 'Spaceflight'
    }));
  } catch (err) {
    console.warn('Spaceflight API failed:', err);
    throw err;
  }
}

async function fetchNewsFromHN(limit = 8) {
  // Get front page hits via Algolia HN API
  const url = `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`;
  try {
    const res = await fetch(url);
    if(!res.ok) throw new Error(`HN Algolia ${res.status}`);
    const data = await res.json();
    return (data.hits || []).map(h => ({
      title: h.title || h.story_title || 'Untitled',
      url: h.url || h.story_url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      summary: h.comment_text ? h.comment_text.replace(/<[^>]+>/g,'') : '',
      source: 'Hacker News'
    }));
  } catch (err) {
    console.warn('HN fetch failed:', err);
    throw err;
  }
}

async function fetchNews(preferredLimit = 8) {
  // Attempt chain: NewsAPI (if key), Spaceflight, Hacker News
  const apiKey = localStorage.getItem('newsApiKey');
  let lastErr = null;
  if(apiKey){
    try {
      const items = await fetchNewsFromNewsAPI(apiKey, preferredLimit);
      return { items, used: 'newsapi' };
    } catch (err) {
      lastErr = err;
    }
  }

  // try Spaceflight (public)
  try {
    const items = await fetchNewsFromSpaceflight(preferredLimit);
    return { items, used: 'spaceflight' };
  } catch (err) {
    lastErr = err;
  }

  // fallback to Hacker News
  try {
    const items = await fetchNewsFromHN(preferredLimit);
    return { items, used: 'hackernews' };
  } catch (err) {
    lastErr = err;
  }

  throw lastErr || new Error('No news sources available');
}

// Render news with UI controls: Refresh and Manage API key
async function renderNews(useCache = false) {
  const container = document.getElementById('news-content');
  if(!container) return;
  // add controls and place for list
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-weight:600">Latest News</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn small" id="refreshNewsBtn">Refresh</button>
        <button class="btn small" id="manageNewsKeyBtn" title="Set or clear NewsAPI key">News API</button>
      </div>
    </div>
    <div id="news-list" style="min-height:100px;">
      <div style="color:var(--muted)">Loading news…</div>
    </div>
  `;
  const listEl = document.getElementById('news-list');
  const refreshBtn = document.getElementById('refreshNewsBtn');
  const manageBtn = document.getElementById('manageNewsKeyBtn');

  refreshBtn.onclick = () => {
    // visual feedback
    refreshBtn.textContent = 'Refreshing...';
    fetchAndShowNews().finally(()=> refreshBtn.textContent = 'Refresh');
  };

  manageBtn.onclick = () => {
    const current = localStorage.getItem('newsApiKey') || '';
    const key = prompt('Enter NewsAPI.org API key (leave blank to remove):', current);
    if(key === null) return;
    if(key.trim() === '') {
      localStorage.removeItem('newsApiKey');
      alert('NewsAPI key cleared. Will use fallback sources.');
    } else {
      localStorage.setItem('newsApiKey', key.trim());
      alert('NewsAPI key saved. Next refresh will use NewsAPI.');
    }
    fetchAndShowNews();
  };

  // optionally allow cached lastNews in sessionStorage for quick load
  if(useCache){
    try {
      const cached = sessionStorage.getItem('lastNews');
      if(cached){
        const parsed = JSON.parse(cached);
        showNewsItems(parsed.items, parsed.used);
      }
    } catch(e){}
  }

  // Fetch and render
  async function fetchAndShowNews(){
    try {
      const res = await fetchNews(8);
      sessionStorage.setItem('lastNews', JSON.stringify(res));
      showNewsItems(res.items, res.used);
    } catch (err) {
      console.error('All news sources failed:', err);
      listEl.innerHTML = `<div class="muted">Couldn't load news. Try setting a NewsAPI key or check your network.</div>`;
    }
  }

  function showNewsItems(items, usedSource) {
    if(!items || items.length === 0){
      listEl.innerHTML = `<div class="muted">No news items found.</div>`;
      return;
    }
    listEl.innerHTML = items.map(item => `
      <div style="margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.03);">
        <a href="${item.url}" target="_blank" rel="noopener" style="font-weight:600;color:var(--accent);text-decoration:none;">${escapeHtml(item.title)}</a>
        <div style="color:var(--muted);font-size:14px;margin-top:6px;">${escapeHtml(item.summary || '')}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px;">Source: ${escapeHtml(item.source || 'Unknown')}</div>
      </div>
    `).join('');
    // small hint which source used
    const hint = document.createElement('div');
    hint.style.marginTop = '8px';
    hint.style.fontSize = '12px';
    hint.style.color = 'var(--muted)';
    hint.textContent = `Source: ${usedSource || 'unknown'} • Updated ${new Date().toLocaleTimeString()}`;
    listEl.appendChild(hint);
  }

  // initial fetch
  fetchAndShowNews();
}

// --- existing UI renderer functions ---

function renderTopRightUser() {
  const user = getUserProfile();
  if (userImg) userImg.src = user.avatar;
  if (userName) userName.textContent = user.name;
}

function renderFriends(){
  friendsList.innerHTML = '';
  seedFriends.forEach(f=>{
    const div = document.createElement('div');
    div.className = 'friend';
    div.innerHTML = `
      <img src="${f.avatar}" alt="${f.name}" />
      <div style="flex:1">
        <div style="font-weight:600">${f.name}</div>
        <div style="font-size:12px; color:var(--muted)">${f.online ? 'Online' : 'Offline'}</div>
      </div>
      <div style="width:10px;height:10px;border-radius:50%; background:${f.online ? '#34d399' : '#94a3b8'}"></div>
    `;
    friendsList.appendChild(div);
  });
}

function renderFeed(){
  feedEl.innerHTML = '';
  posts.forEach(post=>{
    const article = document.createElement('article');
    article.className = 'post card';
    article.innerHTML = `
      <div class="post-head">
        <img src="${post.author.avatar}" alt="${post.author.name}" />
        <div style="flex:1">
          <div style="font-weight:600">${post.author.name}</div>
          <div style="font-size:12px; color:var(--muted)">${post.time}</div>
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
        <div style="color:var(--muted); font-size:13px"></div>
      </div>
    `;
    feedEl.appendChild(article);
  });

  // Like handler
  document.querySelectorAll('.like-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.getAttribute('data-id'));
      toggleLike(id);
    });
  });

  // Share handler
  document.querySelectorAll('.share-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.getAttribute('data-id'));
      sharePost(id);
    });
  });

  // Menu handler
  document.querySelectorAll('.menu-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = Number(btn.getAttribute('data-id'));
      openPostMenu(e.currentTarget, id);
    });
  });
}

function renderNotifications(){
  notifList.innerHTML = '';
  if(notifications.length === 0){
    notifList.innerHTML = '<div class="muted">No notifications</div>';
    return;
  }
  notifications.forEach(n=>{
    const div = document.createElement('div');
    div.style.display = 'flex'; div.style.gap='10px'; div.style.marginBottom='8px';
    div.innerHTML = `<img src="${n.avatar}" style="width:36px;height:36px;border-radius:50%"/><div><div style="font-weight:600">${n.text}</div><div style="font-size:12px;color:var(--muted)">${n.time}</div></div>`;
    notifList.appendChild(div);
  });
}

function renderCommunities(){
  commList.innerHTML = '';
  communities.forEach(c=>{
    const row = document.createElement('div');
    row.style.display='flex'; row.style.justifyContent='space-between'; row.style.marginBottom='8px';
    row.innerHTML = `<div>
    <button class="btn small join-community" data-id="${c.id}" style="background:var(--accent);color:white;border:0;">
      Join
    </button> ${c.name}
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

function createPost(e){
  e.preventDefault();
  const text = postText.value.trim();
  const file = postImage.files[0];
let imageData = null;
if(file){
  const reader = new FileReader();
  reader.onload = function(e){
    imageData = e.target.result;
    actuallyCreatePost(imageData);
  };
  reader.readAsDataURL(file);
} else {
  actuallyCreatePost(null);
}

  if(!text && !image) return;

  const user = getUserProfile();
  const newP = {
    id: Date.now(),
    author:{name:user.name, avatar:user.avatar},
    time:'just now',
    text,
    image: image || null,
    likes:0, comments:0, shares:0, liked:false
  };
  posts.unshift(newP);
  notifications.unshift({ id:Date.now(), text:'You posted to the feed.', time:'just now', avatar:newP.author.avatar });
  postText.value=''; postImage.value='';
  renderFeed(); renderNotifications();
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
  let textToCopy = post.text;
  if(post.image) textToCopy += '\n' + post.image;
  navigator.clipboard.writeText(textToCopy).then(()=>{
    notifications.unshift({id:Date.now(), text:'Copied post to clipboard!', time:'just now', avatar:'https://i.pravatar.cc/36?img=65'});
    renderNotifications();
  }).catch(()=> {
    notifications.unshift({id:Date.now(), text:'Could not copy to clipboard.', time:'just now', avatar:'https://i.pravatar.cc/36?img=65'});
    renderNotifications();
  });
}

// Small util to avoid HTML injection when inserting text
function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

// Theme
function initTheme(){
  const saved = localStorage.getItem('theme');
  if(saved === 'light'){
    body.classList.add('theme-light');
    themeToggle.textContent = 'Dark';
    themeToggle.setAttribute('aria-pressed','true');
  } else {
    body.classList.remove('theme-light');
    themeToggle.textContent = 'Light';
    themeToggle.setAttribute('aria-pressed','false');
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

  if (!editMode) {
    profileContent.innerHTML = `
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
        <img src="${user.avatar}" alt="${user.name}" style="width:80px;height:80px;border-radius:50%;">
        <div>
          <div style="font-size:22px;font-weight:700;">${user.name}</div>
          <div style="color:var(--muted);font-size:15px;">
            ${escapeHtml(user.bio)}
          </div>
          <div style="margin-top:6px; font-size:13px;">
            <span>Joined: ${user.joined}</span>
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
      const newProfile = {
        name: formData.get('name') || getUserProfile().name,
        avatar: formData.get('avatar') || getUserProfile().avatar,
        bio: formData.get('bio') || '',
        joined: getUserProfile().joined,
        communitiesJoined: getUserProfile().communitiesJoined
      };
      // Save and propagate
      setUserProfile(newProfile);
      updateCurrentUserName(newProfile);
      renderProfile(false);
    };
    document.getElementById('cancelProfileBtn').onclick = () => renderProfile(false);
  }
}

// Update posts authored by user when profile changes
function updateCurrentUserName(newProfile) {
  // Use previous profile name from storage before it was updated - but getUserProfile already returns updated,
  // so we keep this robust by checking any posts that have the previous avatar or a "You" placeholder.
  const prevName = (function(){
    // We can attempt to find any post with avatar equal to current newProfile.avatar to avoid renaming wrong posts.
    // Simpler: update posts where author matches either the previous stored 'lastProfileName' (if any) or 'You'.
    return sessionStorage.getItem('lastProfileName') || 'You';
  })();

  posts = posts.map(p => {
    if(p.author.name === prevName || p.author.avatar === newProfile.avatar || p.author.name === newProfile.name){
      return { ...p, author: { name: newProfile.name, avatar: newProfile.avatar } };
    }
    return p;
  });

  // remember current name for later updates
  sessionStorage.setItem('lastProfileName', newProfile.name);

  renderFeed();
  renderTopRightUser();
}

// Post menu: allow delete (for own posts)
function openPostMenu(btn, postId){
  let menu = document.getElementById('post-menu-temp');
  if(menu) menu.remove();
  // only allow delete for user's own posts (match current profile name)
  const user = getUserProfile();
  const post = posts.find(p=>p.id===postId);
  if(!post || post.author.name!==user.name) return;
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

  // Position menu near button
  const rect = btn.getBoundingClientRect();
  // ensure menu doesn't go off screen
  let left = rect.left;
  if(left + 220 > window.innerWidth) left = window.innerWidth - 240;
  menu.style.left = left + 'px';
  menu.style.top = (rect.bottom+window.scrollY) + 'px';

  document.getElementById('delete-post-menu-btn').onclick = () => {
    posts = posts.filter(p=>p.id!==postId);
    notifications.unshift({id:Date.now(), text:'You deleted a post.', time:'just now', avatar:user.avatar});
    renderFeed(); renderNotifications();
    menu.remove();
  };

  // remove menu if click outside
  window.addEventListener('mousedown', function handler(e){
    if(!menu.contains(e.target) && e.target!==btn){
      menu.remove();
      window.removeEventListener('mousedown', handler);
    }
  });
}

// Listeners
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

// Nav/tab handler: ensure news tab calls renderNews
navList.addEventListener('click', (e)=>{
  if(e.target.tagName==='LI'){
    navList.querySelectorAll('li').forEach(li=>li.classList.remove('active'));
    e.target.classList.add('active');
    const tab = e.target.getAttribute('data-tab');
    tabFeed.style.display = tab==='feed'? '' : 'none';
    feedEl.style.display = tab==='feed'? '' : 'none';
    tabNews.style.display = tab==='news'? '' : 'none';
    tabProfile.style.display = tab==='profile'? '' : 'none';
    if(tab==='news') renderNews(true); // try to use cache for snappy UI
    if(tab==='profile') renderProfile(false);
  }
});

// App init
function init(){
  renderTopRightUser();
  renderFriends();
  renderCommunities();
  setTimeout(()=>{ renderFeed(); renderNotifications(); }, 300);
  initTheme();
  // pre-render news container (but don't fetch until tab opened) - eager fetch optional:
  // renderNews(true);
}

init();

// Clear notifications
clearNotifsBtn.addEventListener('click', ()=>{
  notifications = []; renderNotifications();
});

// Create post
postForm.addEventListener('submit', createPost);
function actuallyCreatePost(){
  const text = postText.value.trim();
  const imageData = preview.src || null;

  if(!text && !imageData) return;

  const user = getUserProfile();
  const newP = {
    id: Date.now(),
    author:{name:user.name, avatar:user.avatar},
    time:'just now',
    text,
    image: imageData,
    likes:0, comments:0, shares:0, liked:false
  };
  posts.unshift(newP);
  notifications.unshift({ id:Date.now(), text:'You posted to the feed.', time:'just now', avatar:newP.author.avatar });
  postText.value=''; 
  postImage.value=''; 
  preview.style.display='none';
  renderFeed(); 
  renderNotifications();
}


// hamburger and overlay events
hamburger.addEventListener('click', ()=>{
  if(body.classList.contains('drawer-open')) closeDrawer(); else openDrawer();
});
overlay.addEventListener('click', closeDrawer);

// close drawer with Escape
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && body.classList.contains('drawer-open')) closeDrawer();
});
