/* Forwarding links (29 September 2026): thekleyko.com/substack, /protocol and the like count one
   click, then open their destination at once. For destinations that cannot run our code (Substack,
   the PDF, the survey). Optional ?v=<YouTube video ID or video number> names the video that sent the click.
   Same gates as events.js; the forward never waits for the count, and a blocked count still forwards.
   Usage, in the head of a page: config.js, then <script src="/tracking/forward.js"
   data-event="link_substack" data-to="https://..."></script>. ?tracking=preview on localhost
   shows the would-be events instead of forwarding. */
(function () {
  'use strict';
  var me = document.currentScript;
  var to = me.dataset.to;
  var name = me.dataset.event;
  var config = window.KLEYKO_TRACKING || {};
  var params = new URLSearchParams(location.search);
  var local = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) !== -1;
  var preview = local && params.get('tracking') === 'preview';
  var protectedChoice = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  var live = !local && location.hostname === config.domain && config.mode === 'plausible' &&
    config.privacyReviewComplete === true && !protectedChoice &&
    config.endpoint === 'https://plausible.io/api/event';

  // Only the page path and, if valid, the video ID. Nothing else from the address is sent.
  var page = new URL(location.pathname.replace(/\.html$/, ''), 'https://' + (config.domain || 'thekleyko.com'));
  var video = params.get('v');
  if (video && (/^[A-Za-z0-9_-]{11}$/.test(video) || /^[1-9][0-9]{0,5}$/.test(video))) {
    page.search = new URLSearchParams({
      utm_source: 'youtube', utm_medium: 'organic_video',
      utm_campaign: page.pathname.slice(1), utm_content: 'yt_' + video
    }).toString();
  }
  var referrer = '';
  try {
    var r = new URL(document.referrer);
    if (/^(www\.|m\.)?youtube\.com$/.test(r.hostname) || r.hostname === 'youtu.be') referrer = 'https://www.youtube.com/';
    else if (r.hostname === 'substack.com' || /\.substack\.com$/.test(r.hostname)) referrer = 'https://substack.com/';
    else if (r.hostname === config.domain) referrer = 'https://' + config.domain + '/';
  } catch (e) { /* Unknown origin stays unknown. */ }

  var events = ['pageview', name].map(function (n) {
    var event = {name: n, url: page.href, domain: config.domain};
    if (referrer) event.referrer = referrer;
    return event;
  });
  if (preview) {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.textContent = 'Preview, nothing sent. Would record: ' + JSON.stringify(events) + ' then open ' + to;
    });
    return;
  }
  if (live) events.forEach(function (event) {
    try {
      fetch(config.endpoint, {method: 'POST', headers: {'Content-Type': 'text/plain'},
        body: JSON.stringify(event), credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true
      }).catch(function () {});
    } catch (e) { /* Counting must never hold up the forward. */ }
  });
  location.replace(to);
})();
