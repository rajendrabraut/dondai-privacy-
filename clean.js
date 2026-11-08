const clutter = new CSSStyleSheet();
const selectors = [
  '[data-ad-slot]', '[data-ad-client]', 'ins.adsbygoogle',
  'iframe[id^="google_ads_iframe_"]', 'iframe[name^="google_ads_iframe_"]',
  '[id^="div-gpt-ad-"]', '[data-google-query-id]'
];
if (location.hostname === 'youtube.com' || location.hostname.endsWith('.youtube.com')) {
  selectors.push('ytd-ad-slot-renderer', 'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-sparkles-text-search-renderer', 'ytd-in-feed-ad-layout-renderer');
}
clutter.replaceSync(selectors.join(', ') + ' { display: none !important; }');
let revision = 0;
async function applyCleanup() {
  const current = ++revision;
  const { cleanup = true, paused = [] } = await chrome.storage.local.get(['cleanup', 'paused']);
  if (current !== revision) return;
  const enabled = cleanup && !paused.some(host => location.hostname === host || location.hostname.endsWith('.' + host));
  const sheets = document.adoptedStyleSheets.filter(sheet => sheet !== clutter);
  document.adoptedStyleSheets = enabled ? [...sheets, clutter] : sheets;
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.cleanup || changes.paused)) void applyCleanup();
});
void applyCleanup();
