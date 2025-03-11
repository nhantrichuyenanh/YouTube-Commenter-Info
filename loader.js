(function() {
  browser.storage.local.get('scriptVariant').then(result => {
    const variant = result.scriptVariant || 'default';
    const scriptFile = variant === 'compact' ? 'scripts/compact.js' : 'scripts/default.js';
    const s = document.createElement('script');
    s.src = browser.runtime.getURL(scriptFile);
    s.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
  });
})();