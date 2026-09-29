/* No secrets belong in this public file. Read tracking/README.md before activation. */
window.KLEYKO_TRACKING = Object.freeze({
  mode: 'plausible', // off | plausible; localhost ?tracking=preview never sends data. Live since Marco's OK, 29 Sep 2026.
  domain: 'thekleyko.com',
  endpoint: 'https://plausible.io/api/event',
  privacyReviewComplete: true // Marco, 29 Sep 2026: cookieless Plausible without a banner; notice at /privacy
});
