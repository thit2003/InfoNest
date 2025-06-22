function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (email && password) {
    // Redirect to home page if both email and password are entered
    window.location.href = "../home/home.html"; // adjust path if needed
  } else {
    alert("Please enter your email and password.");
  }
}
