// content.js

// Function to scrape data from the page
function scrapeMetadata() {
    let metadata = {
        title: null,
        channelName: null,
        viewCount: null,
        uploadDate: null,
        description: null,
        videoId: null,
        fetchTime: new Date().toISOString() // Record when data was fetched
    };

    try {
        // --- Selectors (These WILL change over time!) ---

        // Title (Usually in an H1 tag)
        metadata.title = document.querySelector("h1 yt-formatted-string#video-title")?.innerText ||
                         document.querySelector("h1.title yt-formatted-string")?.innerText || // Fallback
                         "Title not found";

        // Channel Name (Usually a link within the owner/upload info section)
        metadata.channelName = document.querySelector("#owner #channel-name #text a")?.innerText ||
                               document.querySelector("ytd-video-owner-renderer .ytd-channel-name a")?.innerText || // Fallback
                               "Channel not found";

        // Views and Date (Often together, need parsing)
        // Look for the container holding views/date info below the title
        const statsElement = document.querySelector("#info-container #info #count") || // Newer layout?
                             document.querySelector("#info-text.ytd-video-primary-info-renderer") || // Older layout?
                             document.querySelector("#info .view-count-and-publish-date"); // Another possibility

        if (statsElement) {
            // Try extracting specifically, these spans might change order/existences
            const viewSpan = statsElement.querySelector("span:first-child");
            const dateSpan = statsElement.querySelector("#info-strings yt-formatted-string"); // Common location for date string

            metadata.viewCount = viewSpan?.innerText.match(/([\d,]+)\s+views/)?.[1] || "Views not found"; // Extract numbers before " views"
            metadata.uploadDate = dateSpan?.innerText || "Date not found";

             // Fallback if specific spans fail: grab combined text and parse
             if (metadata.viewCount === "Views not found" || metadata.uploadDate === "Date not found") {
                 const combinedText = statsElement.innerText;
                 const viewMatch = combinedText.match(/([\d,]+)\s+views/);
                 const dateMatch = combinedText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/); // Basic date format match
                 metadata.viewCount = viewMatch ? viewMatch[1] : "Views not parseable";
                 metadata.uploadDate = dateMatch ? dateMatch[0] : "Date not parseable";
             }

        } else {
            metadata.viewCount = "Stats element not found";
            metadata.uploadDate = "Stats element not found";
        }


        // Description (Often needs expanding first, but we'll try the initial visible part)
        // This might be truncated. Getting the full description reliably might require clicking "Show more".
        metadata.description = document.querySelector("#description-inline-expander span.yt-core-attributed-string")?.innerText ||
                               document.querySelector("#description .content")?.innerText || // Fallback
                               "Description not found";


        // Video ID (From URL)
        const urlParams = new URLSearchParams(window.location.search);
        metadata.videoId = urlParams.get('v') || "Video ID not found in URL";

    } catch (error) {
        console.error("YouTube Metadata Fetcher Error:", error);
        // Return partial data if some selectors worked
    }

    return metadata;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getMetadata") {
        console.log("Content script received request for metadata.");
        const data = scrapeMetadata();
        console.log("Sending metadata:", data);
        sendResponse(data);
        // Indicate that the response is sent asynchronously (optional but good practice)
        return true;
    }
});

console.log("YouTube Metadata Fetcher content script loaded."); // For debugging
