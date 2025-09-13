// default settings
const defaultSettings = {
  // first column
  subscriberCount: true,
  location: true,
  joinedDate: true,

  // second column
  totalVideos: true,
  totalViewCount: true,
  playlists: true,

  // third column
  latestVideo: true,
  latestShorts: true,
  latestLivestream: true,

  // fourth column
  description: true,
  externalLinks: true,
  businessEmail: true
};

// load settings from storage
function loadSettings() {
  browser.storage.sync.get(defaultSettings).then((settings) => {
    Object.keys(defaultSettings).forEach(key => {
      const checkbox = document.getElementById(key);
      if (checkbox) {
        checkbox.checked = settings[key];
      }
    });
  });
}

// save settings to storage
function saveSettings() {
  const settings = {};
  Object.keys(defaultSettings).forEach(key => {
    const checkbox = document.getElementById(key);
    if (checkbox) {
      settings[key] = checkbox.checked;
    }
  });

  browser.storage.sync.set(settings);
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  Object.keys(defaultSettings).forEach(key => {
    const checkbox = document.getElementById(key);
    if (checkbox) {
      checkbox.addEventListener('change', saveSettings);
    }
  });
});