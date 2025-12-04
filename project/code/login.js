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

// LOGIN FORM EVENT
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearMessages();

    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    if (!email || !pass) {
        return showError("Please enter both email and password.");
    }

    localStorage.setItem("loggedInUser", email);
    
    // ✔ Store profile for feed.js
    const name = localStorage.getItem("registeredName");
    localStorage.setItem("userProfile", JSON.stringify({
        name: name || "New User",
        avatar: "https://i.pravatar.cc/80",
    }));

    showSuccess("Logged in successfully! Redirecting...");

    setTimeout(() => {
        window.location.href = "feed.html";
    }, 1000);
});


// REGISTER FORM EVENT
document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearMessages();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const p1 = document.getElementById('reg-password').value;
    const p2 = document.getElementById('reg-password2').value;

    if (!name || !email || p1.length < 6 || p1 !== p2) {
        return showError("Please fill up all fields correctly.");
    }

    // ✔ Save new user profile info
    localStorage.setItem("registeredName", name);
    localStorage.setItem("registeredEmail", email);

    showSuccess("Account created! (Simulated)");

    showForm("login-form");
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
