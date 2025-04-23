document.addEventListener('DOMContentLoaded', function() {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const meta = document.getElementById('meta');
  const titleSpan = document.getElementById('title');
  const urlSpan = document.getElementById('url');
  const typeSpan = document.getElementById('type');
  const timeSpan = document.getElementById('time');

  function extractVideoId(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has('v')) {
        return urlObj.searchParams.get('v');
      }
      if (urlObj.pathname.startsWith('/shorts/')) {
        return urlObj.pathname.split('/shorts/')[1];
      }
      return null;
    } catch (e) {
      console.error('Invalid URL:', url);
      return null;
    }
  }

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];

    if (!tab) {
      loading.style.display = 'none';
      error.textContent = 'No active tab found.';
      return;
    }

    const url = tab.url;
    const videoId = extractVideoId(url);

    if (!videoId) {
      loading.style.display = 'none';
      error.textContent = 'Not a YouTube video or shorts page.';
      return;
    }

    // Hide loading, show meta
    loading.style.display = 'none';
    meta.style.display = 'block';

    titleSpan.textContent = tab.title;
    urlSpan.textContent = url;
    typeSpan.textContent = url.includes('/shorts/') ? 'YouTube Shorts' : 'YouTube Video';
    timeSpan.textContent = new Date().toISOString();

    

    saveButton.addEventListener('click', function() {
      const payload = {
        title: titleSpan.textContent,
        url: urlSpan.textContent,
        type: typeSpan.textContent,
        fetchTime: timeSpan.textContent,
        userTags: []
      };

      fetch('http://localhost:8888/youtube/save_metadata.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(async (response) => {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data.status === 'success') {
            alert('Saved successfully!');
          } else if (data.status === 'duplicate') {
            alert('Video already saved!');
          } else {
            alert('Error saving data.');
          }
        } catch (e) {
          console.error('Server response was not valid JSON:', text);
          alert('Server error: ' + text);
        }
      })
      .catch(err => {
        console.error('Fetch failed', err);
        alert('Error connecting to server.');
      });
    });
  });
});