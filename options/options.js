document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('scriptSelect');
  browser.storage.local.get('scriptVariant').then(result => {
    select.value = result.scriptVariant || 'default';
  });
  
  select.addEventListener('change', () => {
    browser.storage.local.set({ scriptVariant: select.value });
  });
});