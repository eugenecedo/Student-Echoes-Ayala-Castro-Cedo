// feed.js - Social Dashboard with Editable Facebook-style Profile

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
const postImage = document.getElementById('post-image');
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
  const image = postImage.value.trim();
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
  });
}

// Small util to avoid HTML injection when inserting text
function escapeHtml(str){
  if(!str) return '';
  return str.replace(/[&<>"']/g, function(m){
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
            ${user.bio}
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
          <input type="text" name="name" value="${user.name}" style="width:100%;padding:6px;border-radius:6px;">
        </label>
        <label>
          Avatar URL:<br>
          <input type="text" name="avatar" value="${user.avatar}" style="width:100%;padding:6px;border-radius:6px;">
        </label>
        <label>
          Bio:<br>
          <textarea name="bio" rows="3" style="width:100%;padding:6px;border-radius:6px;">${user.bio}</textarea>
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
        name: formData.get('name'),
        avatar: formData.get('avatar'),
        bio: formData.get('bio'),
        joined: user.joined,
        communitiesJoined: user.communitiesJoined
      };
      setUserProfile(newProfile);
      updateCurrentUserName(newProfile);
      renderProfile(false);
    };
    document.getElementById('cancelProfileBtn').onclick = () => renderProfile(false);
  }
}

// Update posts authored by user when profile changes
function updateCurrentUserName(newProfile) {
  posts = posts.map(p => {
    const currentName = getUserProfile().name;
    // Update posts by previous or new name for robustness!
    if (p.author.name === currentName || p.author.name === newProfile.name) {
      return { ...p, author: { name: newProfile.name, avatar: newProfile.avatar } };
    }
    return p;
  });
  renderFeed();
  renderTopRightUser();
}

// News demo
function renderNews(){
  const news = [
    {
      title: "Design Trends 2025 Announced",
      summary: "See what's new in global UI/UX for the upcoming year.",
      url: "#"
    },
    {
      title: "AMU Launches New Dev Community",
      summary: "Join the latest group for frontend devs and share your work!",
      url: "#"
    },
    {
      title: "Update: JS Security Best Practices",
      summary: "Latest guide from SEM group, including new XSS techniques.",
      url: "#"
    }
  ];
  const newsContent = document.getElementById('news-content');
  newsContent.innerHTML = news.map(n => `
    <div style="margin-bottom:16px;">
      <a href="${n.url}" style="font-weight:600;color:var(--accent);text-decoration:none;">${n.title}</a>
      <div style="color:var(--muted);font-size:14px;margin-top:4px;">
        ${n.summary}
      </div>
    </div>
  `).join('');
}

// Nav/tab handler
navList.addEventListener('click', (e)=>{
  if(e.target.tagName==='LI'){
    navList.querySelectorAll('li').forEach(li=>li.classList.remove('active'));
    e.target.classList.add('active');
    const tab = e.target.getAttribute('data-tab');
    tabFeed.style.display = tab==='feed'? '' : 'none';
    feedEl.style.display = tab==='feed'? '' : 'none';
    tabNews.style.display = tab==='news'? '' : 'none';
    tabProfile.style.display = tab==='profile'? '' : 'none';
    if(tab==='news') renderNews();
    if(tab==='profile') renderProfile(false);
  }
});

// Post menu: allow delete (for own posts)
function openPostMenu(btn, postId){
  let menu = document.getElementById('post-menu-temp');
  if(menu) menu.remove();
  // only allow delete for user's own posts (match current profile name)
  const user = getUserProfile();
  const post = posts.find(p=>p.id===postId);
  if(post.author.name!==user.name) return;
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
  menu.style.left = rect.left + 'px';
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

// App init
function init(){
  renderTopRightUser();
  renderFriends();
  renderCommunities();
  setTimeout(()=>{ renderFeed(); renderNotifications(); }, 300);
  initTheme();
}

init();

// Clear notifications
clearNotifsBtn.addEventListener('click', ()=>{
  notifications = []; renderNotifications();
});

// Create post
postForm.addEventListener('submit', createPost);

// hamburger and overlay events
hamburger.addEventListener('click', ()=>{
  if(body.classList.contains('drawer-open')) closeDrawer(); else openDrawer();
});
overlay.addEventListener('click', closeDrawer);

// close drawer with Escape
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && body.classList.contains('drawer-open')) closeDrawer();
});