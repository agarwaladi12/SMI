// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const metadataDisplayDiv = document.getElementById('metadataDisplay');

    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];

        // Check if it's a YouTube video page before sending the message
        if (currentTab && currentTab.url && currentTab.url.includes("youtube.com")) {
            console.log("Popup: Sending message to content script in tab:", currentTab.id);
            // Send a message to the content script in the active tab
            chrome.tabs.sendMessage(currentTab.id, { action: "getMetadata" }, (response) => {
                loadingDiv.style.display = 'none'; // Hide loading message

                // Check for errors or if the content script didn't respond
                if (chrome.runtime.lastError) {
                    console.error("Popup Error:", chrome.runtime.lastError.message);
                    errorDiv.textContent = `Error: Could not communicate with the page. Try reloading the YouTube page. (${chrome.runtime.lastError.message})`;
                    errorDiv.style.display = 'block';
                    return;
                }
                if (!response) {
                    console.error("Popup Error: No response received from content script.");
                    errorDiv.textContent = 'Error: No data received. Is the content script running? Try reloading the page.';
                     errorDiv.style.display = 'block';
                    return;
                }

                // Check if the response contains data (even if some fields are 'not found')
                if (response.title) {
                    console.log("Popup: Received metadata:", response);
                    metadataDisplayDiv.style.display = 'block'; // Show metadata section

                    // Display the fetched data
                    document.getElementById('title').textContent = response.title || 'N/A';
                    document.getElementById('channel').textContent = response.channelName || 'N/A';
                    document.getElementById('views').textContent = response.viewCount || 'N/A';
                    document.getElementById('date').textContent = response.uploadDate || 'N/A';
                    document.getElementById('videoId').textContent = response.videoId || 'N/A';
                    document.getElementById('description').textContent = response.description || 'N/A';
                    document.getElementById('fetchTime').textContent = response.fetchTime ? new Date(response.fetchTime).toLocaleString() : 'N/A';

                } else {
                     errorDiv.textContent = 'Error: Received invalid data structure from content script.';
                     errorDiv.style.display = 'block';
                     console.error("Popup Error: Received invalid response structure:", response);
                }
            });
        } else {
            // Not on a YouTube video page
            loadingDiv.style.display = 'none';
            errorDiv.textContent = "This extension only works on YouTube video pages (youtube.com...).";
            errorDiv.style.display = 'block';
             console.log("Popup: Not a YouTube video page.");
        }
    });
});
