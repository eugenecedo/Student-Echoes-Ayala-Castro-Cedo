<<<<<<< HEAD
// ------------------------------
// 🔹 Load or Initialize Profile
// ------------------------------
let profileData = JSON.parse(localStorage.getItem("profileData")) || {
  name: localStorage.getItem("username") || "Guest User",
  bio: "",
  picture: "https://i.pravatar.cc/100",
  followers: 0,
  following: 0,
  followingList: [],
  followerList: []
};

// Redirect if not logged in
if (!localStorage.getItem("username")) {
  window.location.href = "log in.html";
}
=======
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
>>>>>>> 50022bac42a4551381a990a4126e673727981db2

// ------------------------------
// 🔹 Apply Profile to Page
// ------------------------------
function applyProfileToPage() {
  document.getElementById("username").textContent = profileData.name;
  document.getElementById("header-profile-pic").src = profileData.picture;
  document.getElementById("profile-picture").src = profileData.picture;
  document.getElementById("profile-name-input").value = profileData.name;
  document.getElementById("profile-bio").value = profileData.bio;
  document.getElementById("followers-count").textContent = profileData.followers;
  document.getElementById("following-count").textContent = profileData.following;
}
applyProfileToPage();

// ------------------------------
// 🔹 Logout
// ------------------------------
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("username");
  localStorage.removeItem("profileData");
  window.location.href = "log in.html";
});

// ------------------------------
// 🔹 Theme Toggle
// ------------------------------
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("theme-light");
  themeToggle.textContent = document.body.classList.contains("theme-light")
    ? "Dark"
    : "Light";
});
document.getElementById("darkModeBtn").addEventListener("click", () => {
  document.body.classList.toggle("theme-light");
});

<<<<<<< HEAD
// ------------------------------
// 🔹 Sidebar Switching
// ------------------------------
const menuItems = document.querySelectorAll("#menu li");
const sections = document.querySelectorAll(".content-section");

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    menuItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    const target = item.dataset.section;
    sections.forEach((sec) => sec.classList.add("hidden"));
    document.getElementById(`${target}-section`).classList.remove("hidden");
  });
});

// ------------------------------
// 🔹 Post System
// ------------------------------
const postForm = document.getElementById("post-form");
const postText = document.getElementById("post-text");
const postImage = document.getElementById("post-image");
const feedEl = document.getElementById("feed");
const posts = [];

function renderPosts() {
  feedEl.innerHTML = "";
  posts.forEach((p) => {
    const el = document.createElement("article");
    el.className = "post card";
    el.innerHTML = `
      <div class="post-head">
        <img src="${profileData.picture}" alt="user" style="border-radius:50%">
        <div style="flex:1">
          <div style="font-weight:600">${profileData.name}</div>
          <div style="font-size:12px;color:var(--muted)">Just now</div>
        </div>
=======
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
>>>>>>> 50022bac42a4551381a990a4126e673727981db2
      </div>
      <div class="post-body">
        <div>${p.text}</div>
        ${p.image ? `<img src="${p.image}" alt="post image" />` : ""}
      </div>`;
    feedEl.prepend(el);
  });
}

<<<<<<< HEAD
postForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = postText.value.trim();
  const image = postImage.value.trim();
  if (!text && !image) return;
  posts.push({ text, image });
  renderPosts();
  postText.value = "";
  postImage.value = "";
});

// ------------------------------
// 🔹 Chat
// ------------------------------
const chatSend = document.getElementById("chat-send");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");

if (chatSend) {
  chatSend.addEventListener("click", () => {
    const msg = chatInput.value.trim();
    if (!msg) return;
    const bubble = document.createElement("div");
    bubble.textContent = `${profileData.name}: ${msg}`;
    bubble.style.margin = "5px 0";
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
    chatInput.value = "";
  });
}

// ------------------------------
// 🔹 Profile Editing
// ------------------------------
const profileNameInput = document.getElementById("profile-name-input");
const profileBio = document.getElementById("profile-bio");
const profilePic = document.getElementById("profile-picture");
const profilePicInput = document.getElementById("profile-pic-input");
const saveProfileBtn = document.getElementById("save-profile-btn");
const changePicBtn = document.getElementById("change-pic-btn");

changePicBtn.addEventListener("click", () => profilePicInput.click());
profilePicInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    profilePic.src = evt.target.result;
    document.getElementById("header-profile-pic").src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

saveProfileBtn.addEventListener("click", () => {
  profileData.name = profileNameInput.value.trim() || profileData.name;
  profileData.bio = profileBio.value.trim();
  profileData.picture = profilePic.src;
  localStorage.setItem("profileData", JSON.stringify(profileData));
  applyProfileToPage();
  alert("✅ Profile saved successfully!");
});

// ------------------------------
// 🔹 FOLLOW / UNFOLLOW SYSTEM with MUTUAL FOLLOW
// ------------------------------
function setupFollowSystem() {
  const friendItems = document.querySelectorAll(".friend-item");
  if (friendItems.length === 0) return;

  friendItems.forEach((item) => {
    const friendName = item.dataset.name;
    const btn = item.querySelector(".follow-btn");

    // Restore saved state
    if (profileData.followingList.includes(friendName)) {
      btn.textContent = "Unfollow";
    } else {
      btn.textContent = "Follow";
    }

    btn.addEventListener("click", () => {
      if (btn.textContent === "Follow") {
        btn.textContent = "Unfollow";
        profileData.following++;
        profileData.followingList.push(friendName);

        // Simulate "follow back" 50% chance
        if (Math.random() > 0.5) {
          profileData.followers++;
          profileData.followerList.push(friendName);
          alert(`${friendName} followed you back! 🙌`);
        }
      } else {
        btn.textContent = "Follow";
        profileData.following--;
        profileData.followingList = profileData.followingList.filter(
          (n) => n !== friendName
        );

        // Remove follower if they were following you
        if (profileData.followerList.includes(friendName)) {
          profileData.followers--;
          profileData.followerList = profileData.followerList.filter(
            (n) => n !== friendName
          );
        }
      }

      document.getElementById("followers-count").textContent =
        profileData.followers;
      document.getElementById("following-count").textContent =
        profileData.following;

      localStorage.setItem("profileData", JSON.stringify(profileData));
=======
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
>>>>>>> 50022bac42a4551381a990a4126e673727981db2
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

window.addEventListener("DOMContentLoaded", setupFollowSystem);
// ------------------------------
// 🔹 FOLLOWERS / FOLLOWING POPUP + UNFOLLOW BUTTON
// ------------------------------
const popupOverlay = document.getElementById("popup-overlay");
const popupTitle = document.getElementById("popup-title");
const popupList = document.getElementById("popup-list");
const popupClose = document.getElementById("popup-close");

function refreshCounts() {
  document.getElementById("followers-count").textContent = profileData.followers;
  document.getElementById("following-count").textContent = profileData.following;
  localStorage.setItem("profileData", JSON.stringify(profileData));
}

<<<<<<< HEAD
function openPopup(type) {
  popupList.innerHTML = "";
  popupTitle.textContent = type === "followers" ? "Followers" : "Following";
=======
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
>>>>>>> 50022bac42a4551381a990a4126e673727981db2

  const names =
    type === "followers"
      ? profileData.followerList
      : profileData.followingList;

<<<<<<< HEAD
  if (names.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No " + type + " yet.";
    empty.style.color = "gray";
    popupList.appendChild(empty);
=======
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
>>>>>>> 50022bac42a4551381a990a4126e673727981db2
  } else {
    names.forEach((n) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.padding = "8px 0";
      li.style.borderBottom = "1px solid var(--border, #ccc)";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = n;
      li.appendChild(nameSpan);

      // only show Unfollow button in "Following" list
      if (type === "following") {
        const btn = document.createElement("button");
        btn.textContent = "Unfollow";
        btn.className = "btn small unfollow-btn";
        btn.style.marginLeft = "8px";
        btn.style.background = "#e74c3c";
        btn.style.color = "#fff";
        btn.style.border = "none";
        btn.style.borderRadius = "6px";
        btn.style.cursor = "pointer";
        btn.style.padding = "5px 10px";

        btn.addEventListener("click", () => {
          // Remove from following
          profileData.followingList = profileData.followingList.filter(
            (x) => x !== n
          );
          profileData.following--;
          // If they were following you, remove follower too
          if (profileData.followerList.includes(n)) {
            profileData.followerList = profileData.followerList.filter(
              (x) => x !== n
            );
            profileData.followers--;
          }
          refreshCounts();
          li.remove(); // instantly update popup
        });
        li.appendChild(btn);
      }

      popupList.appendChild(li);
    });
  }

  popupOverlay.classList.remove("hidden");
}

<<<<<<< HEAD
popupClose.addEventListener("click", () => {
  popupOverlay.classList.add("hidden");
});

document
  .getElementById("followers-display")
  .addEventListener("click", () => openPopup("followers"));
document
  .getElementById("following-display")
  .addEventListener("click", () => openPopup("following"));
=======
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
>>>>>>> 50022bac42a4551381a990a4126e673727981db2
