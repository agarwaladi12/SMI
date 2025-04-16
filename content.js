function getBasicMetadata() {
    const isVideo = window.location.href.includes("watch?v=") || window.location.href.includes("/shorts/");
  
    return {
      title: document.title.replace(" - YouTube", "") || "Unknown Title",
      url: window.location.href,
      fetchTime: new Date().toISOString(),
      type: isVideo ? (window.location.href.includes("shorts") ? "Shorts" : "Video") : "Unknown"
    };
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getBasicMetadata") {
      sendResponse(getBasicMetadata());
    }
  });