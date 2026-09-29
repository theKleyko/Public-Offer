(function () {
  'use strict';
  if (window.KleykoMeasurement) return;
  const config = window.KLEYKO_TRACKING || {};
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const params = new URLSearchParams(location.search);
  const preview = local && params.get('tracking') === 'preview';
  const page = location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const protectedChoice = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  const live = !local && location.hostname === config.domain && config.mode === 'plausible' &&
    config.privacyReviewComplete === true && !params.has('design') && !protectedChoice &&
    config.endpoint === 'https://plausible.io/api/event';
  const events = [];
  const sent = new Set();
  window.KleykoMeasurement = Object.freeze({mode: preview ? 'preview' : live ? 'plausible' : 'off', events});
  if ((!preview && !live) || !['/audit', '/testimonials'].includes(page)) return;
  const campaign = window.KleykoLinks.fromURL(location.href) || window.KleykoLinks.fromShort(location.href);
  const cleanURL = new URL(page, 'https://' + config.domain);
  if (campaign) cleanURL.search = new URLSearchParams(campaign).toString();
  // Only known referral origins, never search terms, article paths or arbitrary URLs.
  let referrer = '';
  try {
    const r = new URL(document.referrer);
    if (/^(www\.|m\.)?youtube\.com$/.test(r.hostname) || r.hostname === 'youtu.be') referrer = 'https://www.youtube.com/';
    else if (r.hostname === 'substack.com' || r.hostname.endsWith('.substack.com')) referrer = 'https://substack.com/';
    else if (r.hostname === config.domain) referrer = 'https://' + config.domain + '/';
  } catch { /* No known referrer: leave unknown. */ }
  function record(name) {
    if (sent.has(name)) return;
    sent.add(name);
    const event = {name, url: cleanURL.href, domain: config.domain};
    if (referrer) event.referrer = referrer;
    if (preview) {
      const row = {at: new Date().toISOString(), ...event};
      events.push(row);
      window.dispatchEvent(new CustomEvent('kleyko:measurement', {detail: row}));
      return;
    }
    // No cookies/credentials, no raw query string, no retry on ambiguous responses.
    // Failure must never hold up navigation or payments.
    fetch(config.endpoint, {method: 'POST', headers: {'Content-Type': 'text/plain'},
      body: JSON.stringify(event), credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true
    }).catch(() => {});
  }
  // Carry only this click's approved campaign to the separate testimonials page.
  // No cookies, sessionStorage, localStorage, cross-session identity or checkout decoration.
  if (campaign) document.querySelectorAll('a[href]').forEach(a => {
    const u = new URL(a.href, location.href);
    const path = u.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    if (u.origin === location.origin && ['/audit', '/testimonials'].includes(path)) {
      Object.entries(campaign).forEach(([k, v]) => u.searchParams.set(k, v));
      if (preview) u.searchParams.set('tracking', 'preview');
      a.href = u.href;
    }
  });
  record('pageview');
  function scroll() {
    const distance = document.documentElement.scrollHeight - innerHeight;
    if (distance <= 0 || document.visibilityState !== 'visible') return;
    const percent = Math.max(0, scrollY) / distance * 100;
    for (const n of [25, 50, 75, 90]) if (percent >= n) record('scroll_' + n);
  }
  addEventListener('scroll', scroll, {passive: true});
  // A deep anchor counts as depth reached, never proof that previous sections were read.
  requestAnimationFrame(scroll);
  let visibleMs = 0;
  let previous = performance.now();
  function tick() {
    const now = performance.now();
    if (document.visibilityState === 'visible') visibleMs += Math.min(now - previous, 1500);
    previous = now;
    for (const n of [30, 60, 120]) if (visibleMs >= n * 1000) record('visible_' + n + 's');
  }
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => {previous = performance.now();});
  const videoIds = new Set(['audit_01','audit_02','audit_03','audit_04','prior_01','prior_02','prior_03','prior_04','prior_05','prior_06','prior_07']);
  document.querySelectorAll('video[data-testimonial]').forEach(video => {
    const id = video.dataset.testimonial;
    if (!videoIds.has(id)) return;
    video.addEventListener('playing', () => record('testimonial_' + id + '_start'));
    function progress() {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      let played = 0;
      for (let i = 0; i < video.played.length; i++) played += video.played.end(i) - video.played.start(i);
      const percent = played / video.duration * 100;
      for (const n of [25, 50, 75, 90]) if (percent >= n) record('testimonial_' + id + '_played_' + n);
    }
    video.addEventListener('timeupdate', progress);
    video.addEventListener('ended', progress);
  });
  const actions = new Set(['checkout_click', 'contact_email', 'contact_telegram', 'pdf_click', 'testimonials_open']);
  function click(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;
    const a = e.target.closest?.('a[data-measure]');
    if (a && actions.has(a.dataset.measure)) {
      record(a.dataset.measure);
      if (preview && a.dataset.measure !== 'testimonials_open') e.preventDefault();
    }
  }
  document.addEventListener('click', click);
  document.addEventListener('auxclick', click);
})();
