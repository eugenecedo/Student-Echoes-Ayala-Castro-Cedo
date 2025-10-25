// app.js - responsive dashboard with hamburger drawer and theme toggle

// Seed data (same as earlier)
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

// render helpers
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
        <div style="font-size:18px; opacity:.6">•••</div>
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
        </div>
        <div style="color:var(--muted); font-size:13px">Share</div>
      </div>
    `;
    feedEl.appendChild(article);
  });

  // attach like handlers
  document.querySelectorAll('.like-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.getAttribute('data-id'));
      toggleLike(id);
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
    row.innerHTML = `<div>${c.name}</div><div style="font-size:12px;color:var(--muted)">${c.members} members</div>`;
    commList.appendChild(row);
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

  const newP = {
    id: Date.now(),
    author:{name:'You', avatar:'https://i.pravatar.cc/48?img=65'},
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

// small util to avoid HTML injection when inserting text
function escapeHtml(str){
  return str.replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

// theme
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

// drawer (hamburger) behavior
function openDrawer(){
  body.classList.add('drawer-open');
  hamburger.setAttribute('aria-expanded','true');
  // ensure focus lands in drawer for accessibility
  sidebar.setAttribute('tabindex','-1');
  sidebar.focus();
}
function closeDrawer(){
  body.classList.remove('drawer-open');
  hamburger.setAttribute('aria-expanded','false');
}

// listeners
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

clearNotifsBtn.addEventListener('click', ()=>{
  notifications = []; renderNotifications();
});

postForm.addEventListener('submit', createPost);

// hamburger and overlay events
hamburger.addEventListener('click', ()=>{
  if(body.classList.contains('drawer-open')) closeDrawer(); else openDrawer();
});
overlay.addEventListener('click', closeDrawer);

// close drawer with Escape key when open
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && body.classList.contains('drawer-open')) closeDrawer();
});

// initial render (simulate async fetch)
function init(){
  renderFriends();
  renderCommunities();
  setTimeout(()=>{ renderFeed(); renderNotifications(); }, 300);
  initTheme();
}

init();
