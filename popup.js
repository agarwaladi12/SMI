document.addEventListener('DOMContentLoaded', function () {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const meta = document.getElementById('meta');
  const titleSpan = document.getElementById('title');
  const urlSpan = document.getElementById('url');
  const typeSpan = document.getElementById('type');
  const timeSpan = document.getElementById('time');
  const saveButton = document.getElementById('save');
  const viewDatabaseButton = document.getElementById('viewDatabase');

  const tagInput = document.getElementById('tag-input');
  const addTagButton = document.getElementById('add-tag-btn');
  const tagsList = document.getElementById('tags-list');
  let userTags = [];

  if (!loading || !error || !meta || !titleSpan || !urlSpan || !typeSpan || !timeSpan || !saveButton || !viewDatabaseButton || !tagInput || !addTagButton || !tagsList) {
    console.error('One or more DOM elements not found. Check popup.html.');
    return;
  }

  let previousVideoId = null;

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
  function checkIfVideoExists(url) {
    fetch(`http://localhost:8888/youtube/check_video.php?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (data.exists) {
          // Add a green glow or message to indicate it's already saved
          document.body.style.boxShadow = '0 0 10px 2px green';
          showToast('Already Saved ✅');
        }
      })
      .catch(err => console.error('Check video failed:', err));
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  function determineContentType(title, url) {
    const isAd = /\b(meta ai|sponsored|ad)\b/i.test(title);
    if (title === 'YouTube' || isAd) return 'Ad';
    if (url.includes('/shorts/')) return 'YouTube Shorts';
    return 'YouTube Video';
  }

  function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    meta.style.display = 'none';
  }

  function hideError() {
    error.style.display = 'none';
  }

  function updateMetadata(tab) {
    if (!tab || !tab.url) {
      showError('No active tab found.');
      return;
    }

    const url = tab.url;
    const videoId = extractVideoId(url);

    if (!videoId) {
      showError('Not a YouTube video or shorts page.');
      return;
    }

    const contentType = determineContentType(tab.title, url);
    if (videoId === previousVideoId) return;

    previousVideoId = videoId;

    hideError();
    meta.style.display = 'block';
    loading.style.display = 'none';

    titleSpan.textContent = tab.title;
    urlSpan.textContent = url;
    checkIfVideoExists(url);
    typeSpan.textContent = contentType;
    timeSpan.textContent = new Date().toLocaleString();
  }

  // Load initial metadata
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    updateMetadata(tabs[0]);
  });

  // Poll every 2 seconds
  setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      updateMetadata(tabs[0]);
    });
  }, 2000);

  // Add Tag
  function addTag(tag) {
    if (tag && !userTags.includes(tag)) {
      userTags.push(tag);
      const tagElement = document.createElement('span');
      tagElement.classList.add('tag');
      tagElement.textContent = tag;

      // Allow removing tag on click
      tagElement.addEventListener('click', () => {
        tagElement.remove();
        userTags = userTags.filter(t => t !== tag);
      });

      tagsList.appendChild(tagElement);
      tagInput.value = '';
    }
  }

  addTagButton.addEventListener('click', function () {
    const tag = tagInput.value.trim();
    addTag(tag);
  });

  tagInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const tag = tagInput.value.trim();
      addTag(tag);
    }
  });

  // Save Metadata
  saveButton.addEventListener('click', function () {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    const payload = {
      title: (titleSpan.textContent).replace(/ - YouTube$/, ''),
      url: urlSpan.textContent,
      type: typeSpan.textContent,
      fetchTime: timeSpan.textContent,
      userTags: Array.from(document.querySelectorAll('.tag'))
        .map(tag => tag.textContent)
        .join(', ')
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
            showToast('Saved successfully! ✅');
          } else if (data.status === 'duplicate') {
            showToast('Video already saved ⚠️');
          } else {
            showToast('Error saving data ❌');
          }
        } catch (e) {
          console.error('Invalid JSON response:', text);
          showToast('Server error: ' + text);
        }
      })
      .catch(err => {
        console.error('Fetch failed:', err);
        showToast('Connection error ❌');
      })
      .finally(() => {
        saveButton.disabled = false;
        saveButton.textContent = 'Save';

        // Reset tags
        userTags = [];
        tagsList.innerHTML = '';
        tagInput.value = '';
      });
  });

  // View DB
  viewDatabaseButton.addEventListener('click', function () {
    chrome.tabs.create({
      url: 'http://localhost:8888/phpMyAdmin5/index.php?route=/sql&db=youtube_research&table=youtube_metadata&pos=0'
    });
  });
});