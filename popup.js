document.addEventListener("DOMContentLoaded", () => {
    const loading = document.getElementById("loading");
    const error = document.getElementById("error");
    const meta = document.getElementById("meta");
  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url.includes("youtube.com")) {
        chrome.tabs.sendMessage(tab.id, { action: "getBasicMetadata" }, (response) => {
          loading.style.display = "none";
          if (chrome.runtime.lastError || !response) {
            error.textContent = "Failed to get data. Try reloading the video.";
            return;
          }
  
          meta.style.display = "block";
          document.getElementById("title").textContent = response.title;
          document.getElementById("url").textContent = response.url;
          document.getElementById("type").textContent = response.type;
          document.getElementById("time").textContent = new Date(response.fetchTime).toLocaleString();
        });
      } else {
        loading.style.display = "none";
        error.textContent = "This only works on YouTube video or Shorts pages.";
      }
    });
  });