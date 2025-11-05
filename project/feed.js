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
      </div>
      <div class="post-body">
        <div>${p.text}</div>
        ${p.image ? `<img src="${p.image}" alt="post image" />` : ""}
      </div>`;
    feedEl.prepend(el);
  });
}

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

function openPopup(type) {
  popupList.innerHTML = "";
  popupTitle.textContent = type === "followers" ? "Followers" : "Following";

  const names =
    type === "followers"
      ? profileData.followerList
      : profileData.followingList;

  if (names.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No " + type + " yet.";
    empty.style.color = "gray";
    popupList.appendChild(empty);
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

popupClose.addEventListener("click", () => {
  popupOverlay.classList.add("hidden");
});

document
  .getElementById("followers-display")
  .addEventListener("click", () => openPopup("followers"));
document
  .getElementById("following-display")
  .addEventListener("click", () => openPopup("following"));
