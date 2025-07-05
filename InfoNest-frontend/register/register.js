// InfoNest-frontend/register/register.js

document.addEventListener('DOMContentLoaded', () => {
  // Get form elements by their new IDs
  const registerForm = document.getElementById('registerForm'); // Get the form element
  const usernameInput = document.getElementById('usernameInput'); // Changed from 'email'
  const passwordInput = document.getElementById('passwordInput');
  const messageDisplay = document.getElementById('message'); // For displaying feedback

  // Add event listener to the form's submit event
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the browser's default form submission

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Basic client-side validation
    if (!username || !password) {
      messageDisplay.style.color = 'red';
      messageDisplay.textContent = 'Please enter both username and password.';
      return;
    }

    try {
      // Make a POST request to your backend's register API
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) { // Check if the HTTP status code is in the 2xx range (e.g., 201 Created)
        messageDisplay.style.color = 'green';
        messageDisplay.textContent = 'Registration successful! Redirecting to login...';

        // Redirect to the login page after a short delay
        setTimeout(() => {
          window.location.href = '../login/login.html';
        }, 1500); // 1.5 seconds delay
      } else {
        // If response.ok is false, it means server returned an error (e.g., 400 Bad Request)
        messageDisplay.style.color = 'red';
        messageDisplay.textContent = data.error || 'Registration failed.';
        console.error('Backend error during registration:', data.error);
      }
    } catch (error) {
      // Catch any network errors
      messageDisplay.style.color = 'red';
      messageDisplay.textContent = 'Network error. Could not connect to the server.';
      console.error('Fetch error during registration:', error);
    }
  });
});