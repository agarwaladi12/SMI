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

        // SEND METADATA TO SERVER
        fetch("http://localhost:8888/youtube/save_metadata.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(response)
        })
        .then(res => res.text()) // ← just get plain text, not JSON
	.then(text => {
  	  console.log("Server raw response:", text);
	})
        .then(data => {
          console.log("Saved to database:", data);
        })
        .catch(err => {
          console.error("Failed to save metadata:", err);
        });
      });
    } else {
      loading.style.display = "none";
      error.textContent = "This only works on YouTube video or Shorts pages.";
    }
  });
});
