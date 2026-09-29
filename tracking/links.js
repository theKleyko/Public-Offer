/* Shared, dependency-free campaign convention for the generator and website. */
(function (root) {
  'use strict';
  const placements = { youtube: ['description', 'pinned_comment', 'profile'], substack: ['article', 'email', 'profile'] };
  function campaign(source, content, placement) {
    if (!placements[source]?.includes(placement)) throw Error('Choose a supported source and placement.');
    if (source === 'youtube' && !/^[A-Za-z0-9_-]{11}$/.test(content)) throw Error('Use the 11-character YouTube video ID.');
    if (source === 'substack' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(content)) throw Error('Use the public article slug, with lowercase letters, numbers and hyphens.');
    if (content.length > 100) throw Error('Content ID must be at most 100 characters.');
    return {
      utm_source: source,
      utm_medium: source === 'youtube' ? 'organic_video' : placement === 'email' ? 'newsletter' : 'organic_article',
      utm_campaign: 'ego_audit',
      utm_content: (source === 'youtube' ? 'yt_' : 'ss_') + content + '--' + placement
    };
  }
  function fromURL(input) {
    const u = new URL(input, 'https://thekleyko.com');
    const p = u.searchParams;
    const source = p.get('utm_source');
    const raw = p.get('utm_content') || '';
    const split = raw.lastIndexOf('--');
    if (split < 0 || p.get('utm_campaign') !== 'ego_audit') return null;
    try {
      const value = campaign(source, raw.slice(3, split), raw.slice(split + 2));
      return Object.entries(value).every(([k, v]) => p.get(k) === v) ? value : null;
    } catch { return null; }
  }
  function build(source, content, placement, base = 'https://thekleyko.com/audit') {
    const u = new URL(base);
    u.search = new URLSearchParams(campaign(source, content, placement)).toString();
    u.hash = '';
    return u.href;
  }
  root.KleykoLinks = Object.freeze({campaign, fromURL, build, placements});
})(typeof window === 'undefined' ? globalThis : window);
