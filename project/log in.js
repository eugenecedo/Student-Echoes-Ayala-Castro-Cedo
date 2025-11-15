document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  if(email !== "" && pass !== ""){
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userEmail", email);

      window.location.href = "feed.html";
  } else {
      alert("Please enter email and password.");
  }
});
