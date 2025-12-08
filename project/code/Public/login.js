// Switch between Login and Register forms
function showForm(id) {
    document.getElementById('login-form').style.display = (id === 'login-form') ? 'block' : 'none';
    document.getElementById('register-form').style.display = (id === 'register-form') ? 'block' : 'none';

    document.getElementById('tab-login').classList.toggle('active', id === 'login-form');
    document.getElementById('tab-register').classList.toggle('active', id === 'register-form');

    clearMessages();
    localStorage.setItem('activeForm', id);
}

// Clear notification messages
function clearMessages() {
    document.getElementById('messages').innerHTML = "";
}

// Display error message
function showError(msg) {
    document.getElementById('messages').innerHTML =
        `<p class="error-message">${msg}</p>`;
}

// Display success message
function showSuccess(msg) {
    document.getElementById('messages').innerHTML =
        `<p class="success-message">${msg}</p>`;
}

// --- KEY CONSTANTS ---
const DB_KEY = 'amu_users_db'; // Stores the array of all registered accounts

// LOGIN FORM EVENT
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearMessages();

    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    if (!email || !pass) {
        return showError("Please enter both email and password.");
    }

    // 1. Retrieve the list of registered users
    const users = JSON.parse(localStorage.getItem(DB_KEY) || '[]');

    // 2. Find the user with matching email AND password
    const foundUser = users.find(u => u.email === email && u.password === pass);

    if (foundUser) {
        // 3. MATCH FOUND: Set the session data using this user's specific info
        
        // Update the active profile used by feed.js
        const sessionProfile = {
            name: foundUser.name,
            avatar: foundUser.avatar,
            bio: foundUser.bio || "",
            joined: foundUser.joined,
            communitiesJoined: foundUser.communitiesJoined || 0,
            joinedCommunities: foundUser.joinedCommunities || [],
            following: foundUser.following || [],
            myFollowers: foundUser.myFollowers || []
        };

        localStorage.setItem("userProfile", JSON.stringify(sessionProfile));
        localStorage.setItem("loggedInUser", foundUser.email);

        showSuccess(`Welcome back, ${foundUser.name}! Redirecting...`);

        setTimeout(() => {
            window.location.href = "feed.html";
        }, 1000);

    } else {
        // 4. NO MATCH FOUND
        showError("Invalid email or password. Please try again or register.");
    }
});


// REGISTER FORM EVENT
document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearMessages();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const p1 = document.getElementById('reg-password').value;
    const p2 = document.getElementById('reg-password2').value;

    if (!name || !email || p1.length < 6) {
        return showError("Please fill up all fields. Password must be at least 6 characters.");
    }
    
    if (p1 !== p2) {
        return showError("Passwords do not match.");
    }

    // 1. Retrieve existing users
    const users = JSON.parse(localStorage.getItem(DB_KEY) || '[]');

    // 2. Check if email already exists
    if (users.some(u => u.email === email)) {
        return showError("This email is already registered. Please log in.");
    }

    // 3. Create the new user object
    const avatarNumber = Math.floor(Math.random() * 70);
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: p1, // Storing password to allow login check
        avatar: "https://i.pravatar.cc/80?img=" + avatarNumber,
        bio: "Just joined!",
        joined: new Date().toLocaleDateString(),
        communitiesJoined: 0,
        joinedCommunities: [],
        following: [],
        myFollowers: []
    };

    // 4. Save to the array and update localStorage
    users.push(newUser);
    localStorage.setItem(DB_KEY, JSON.stringify(users));

    showSuccess("Account created successfully! Please log in.");
    
    // Clear inputs and switch tab
    document.getElementById('register-form').reset();
    setTimeout(() => {
        showForm("login-form");
    }, 1500);
});


// Forgot Password Modal
function openForgot() {
    document.getElementById('forgot-modal').style.display = "flex";
}

function closeForgot() {
    document.getElementById('forgot-modal').style.display = "none";
}

function sendForgot() {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) {
        alert("Please enter your email.");
        return;
    }

    alert("Password reset email sent! (Simulated)");
    closeForgot();
}

// Restore last active tab
document.addEventListener('DOMContentLoaded', () => {
    const active = localStorage.getItem('activeForm') || "login-form";
    showForm(active);
});