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
  businessEmail: true,

  // position
  infoBoxPosition: 'below'
};

// load settings from storage
function loadSettings() {
  browser.storage.sync.get(defaultSettings).then((settings) => {
    Object.keys(defaultSettings).forEach(key => {
      const checkbox = document.getElementById(key);
      if (checkbox) {
        if (checkbox.type === 'checkbox') {
          checkbox.checked = settings[key];
        } else if (checkbox.type === 'radio') {
          checkbox.checked = (checkbox.value === settings[key]);
        }
      }
    });
    if (settings.infoBoxPosition === 'adjacent') {
      document.getElementById('positionAdjacent').checked = true;
    } else {
      document.getElementById('positionBelow').checked = true;
    }
  });
}

// save settings to storage
function saveSettings() {
  const settings = {};
  Object.keys(defaultSettings).forEach(key => {
    const checkbox = document.getElementById(key);
    if (checkbox) {
      if (checkbox.type === 'checkbox') {
        settings[key] = checkbox.checked;
      } else if (checkbox.type === 'radio' && checkbox.checked) {
        settings[key] = checkbox.value;
      }
    }
  });
  const pos = document.querySelector('input[name="infoBoxPosition"]:checked');
  if (pos) settings.infoBoxPosition = pos.value;

  browser.storage.sync.set(settings);
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  const allCheckboxes = Object.keys(defaultSettings)
  .filter(key => {
    const el = document.getElementById(key);
    return el && el.type === 'checkbox';
  })
  .map(key => document.getElementById(key));

  // at least 1 checkbox must always be checked
  allCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function (e) {
      const checkedCount = allCheckboxes.filter(cb => cb.checked).length;
      if (!e.target.checked && checkedCount === 0) {
        e.target.checked = true;
        return;
      }
      saveSettings();
    });
  });

  document.querySelectorAll('input[name="infoBoxPosition"]').forEach(radio => {
    radio.addEventListener('change', saveSettings);
  });
});