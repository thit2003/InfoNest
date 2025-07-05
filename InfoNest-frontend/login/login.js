// InfoNest-frontend/login/login.js

document.addEventListener('DOMContentLoaded', () => {
  // Get form elements by their new IDs
  const loginForm = document.getElementById('loginForm'); // Get the form element
  const usernameInput = document.getElementById('usernameInput'); // Changed from 'email'
  const passwordInput = document.getElementById('passwordInput');
  const messageDisplay = document.getElementById('message'); // For displaying feedback

  // Add event listener to the form's submit event
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the browser's default form submission (page reload)

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Basic client-side validation
    if (!username || !password) {
      messageDisplay.style.color = 'red';
      messageDisplay.textContent = 'Please enter both username and password.';
      return; // Stop the function if validation fails
    }

    try {
      // Make a POST request to your backend's login API
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST', // This must be POST
        headers: {
          'Content-Type': 'application/json', // Tell the server we're sending JSON
        },
        body: JSON.stringify({ username, password }), // Convert JS object to JSON string
      });

      const data = await response.json(); // Parse the JSON response from the server

      if (response.ok) { // Check if the HTTP status code is in the 2xx range (e.g., 200 OK)
        localStorage.setItem('token', data.token); // Store the JWT token
        localStorage.setItem('username', username); // Store username for display on home page

        messageDisplay.style.color = 'green';
        messageDisplay.textContent = 'Login successful! Redirecting to home...';

        // Redirect to the home page after a short delay
        setTimeout(() => {
          window.location.href = '../home/home.html';
        }, 1500); // 1.5 seconds delay
      } else {
        // If response.ok is false, it means server returned an error (e.g., 401, 400)
        messageDisplay.style.color = 'red';
        messageDisplay.textContent = data.error || 'Login failed. Invalid credentials.';
        console.error('Backend error during login:', data.error);
      }
    } catch (error) {
      // Catch any network errors (e.g., server not running, no internet)
      messageDisplay.style.color = 'red';
      messageDisplay.textContent = 'Network error. Could not connect to the server.';
      console.error('Fetch error during login:', error);
    }
  });
});