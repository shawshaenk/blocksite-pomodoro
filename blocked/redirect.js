// Get the current page URL
const currentPage = window.location.href;

// Get the URL of the blocked page
const blockedPage = chrome.runtime.getURL("blocked/blocked.html");

// Check if the current page is already the blocked page
if (currentPage !== blockedPage) {
  // Redirect to the blocked page
  window.location.href = blockedPage;
}