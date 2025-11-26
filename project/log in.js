/* log in.js
 *
 * Login page script for the demo. When the user submits their credentials:
 * - Basic client-side validation is performed (non-empty)
 * - A friendly display name is derived from the email local part (demo-only)
 * - A userProfile object is created and saved to localStorage under "userProfile"
 * - "loggedIn" flag is set in localStorage
 * - Redirects to feed.html so the main app uses the saved profile
 *
 * Note: In production you would authenticate against a server and use the response
 * to populate the profile securely.
 */
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
    avatar: 'https://i.pravatar.cc/80?u=' + encodeURIComponent(email), // deterministic avatar by email
    bio: '',
    joined: new Date().toLocaleDateString(),
    communitiesJoined: 0,
    joinedCommunities: []
  };

  try {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);
    // IMPORTANT: store under key 'userProfile' because feed.js's getUserProfile() reads KEY.PROFILE
    localStorage.setItem("userProfile", JSON.stringify(profile));
  } catch (err) {
    console.warn('Could not persist login to localStorage', err);
  }

  // Redirect to feed which will read the saved userProfile and show the username
  window.location.href = "feed.html";
});