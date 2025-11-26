// login script — stores a proper userProfile so feed.js shows the user's name
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = (document.getElementById("email").value || "").trim();
  const pass = (document.getElementById("password").value || "").trim();

  if (!email || !pass) {
    alert("Please enter email and password.");
    return;
  }

  // Demo-only: derive a friendly display name from the email local part
  function deriveDisplayName(email) {
    const local = (email.split('@')[0] || 'User').replace(/[._\-]+/g, ' ');
    return local.split(' ').map(w => w ? (w[0].toUpperCase() + w.slice(1)) : '').join(' ').trim() || 'User';
  }

  const displayName = deriveDisplayName(email);

  // Build profile object matching feed.js expectations
  const profile = {
    name: displayName,
    avatar: 'https://i.pravatar.cc/80?u=' + encodeURIComponent(email),
    bio: '',
    joined: new Date().toLocaleDateString(),
    communitiesJoined: 0,
    joinedCommunities: []
  };

  try {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userProfile", JSON.stringify(profile)); // key feed.js reads
  } catch (err) {
    console.warn('Could not persist login to localStorage', err);
  }

  // Redirect to feed which reads the userProfile and updates UI
  window.location.href = "feed.html";
});