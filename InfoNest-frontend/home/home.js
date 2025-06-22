// home.js

// Example: Add button click events or input handling if needed
document.querySelectorAll('.buttons-row button').forEach(button => {
  button.addEventListener('click', () => {
    alert(`You clicked: "${button.textContent}"`);
  });
});
