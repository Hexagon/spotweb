// Google Analytics bootstrap, an external file so that pages need no inline script (CSP).
// The measurement id comes from the script tag: <script src="/assets/ga.js" data-ga-id="G-…">
(function () {
  var id = document.currentScript && document.currentScript.dataset.gaId;
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", id);
})();
