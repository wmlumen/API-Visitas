(function () {
  var API = 'https://api-visitas-ei0d.onrender.com';
  var start = Date.now();
  var project = document.currentScript
    ? new URLSearchParams(document.currentScript.src.split('?')[1]).get('project') || 'unknown'
    : 'unknown';

  function trackVisit() {
    var s = document.createElement('script');
    s.src = API + '/track?project=' + encodeURIComponent(project) + '&page=' + encodeURIComponent(location.pathname);
    s.async = true;
    document.head.appendChild(s);
  }

  function sendTime() {
    var elapsed = Math.round((Date.now() - start) / 1000);
    if (elapsed < 1) return;
    var payload = API + '/track/time?project=' + encodeURIComponent(project) + '&seconds=' + elapsed;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(payload);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', payload, false);
      try { xhr.send(); } catch (e) {}
    }
  }

  trackVisit();

  window.addEventListener('beforeunload', sendTime);
  window.addEventListener('pagehide', sendTime);
})();
