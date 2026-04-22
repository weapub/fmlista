(function preloadHeroImage() {
  try {
    var heroUrl = window.localStorage.getItem('app_hero_image_url');
    if (!heroUrl) return;

    var preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = heroUrl;
    preload.setAttribute('fetchpriority', 'high');
    document.head.appendChild(preload);
  } catch (_) {
    // ignore
  }
})();
