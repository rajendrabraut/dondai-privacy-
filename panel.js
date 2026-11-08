const el = id => document.getElementById(id);
const filters = ['ads', 'trackers', 'adult', 'strict'];
const dnr = chrome.declarativeNetRequest;
let tab;
let host = '';
async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || 'The extension could not complete the action.');
}

function handle(control, event, action) {
  control.addEventListener(event, async () => {
    control.disabled = true;
    el('status').textContent = '';
    try {
      await action();
    } catch (error) {
      el('status').textContent = error.message;
    } finally {
      control.disabled = false;
      await refresh().catch(error => { el('status').textContent = error.message; });
    }
  });
}

async function refresh() {
  const [enabled, settings] = await Promise.all([
    dnr.getEnabledRulesets(), chrome.storage.local.get(['cleanup', 'paused'])
  ]);
  for (const id of filters) el(id).checked = enabled.includes(id);
  el('cleanup').checked = settings.cleanup ?? true;
  const pausedHosts = settings.paused || [];
  const paused = pausedHosts.includes(host);
  const parent = pausedHosts.find(item => host.endsWith('.' + item));
  el('pause').disabled = !host.includes('.') || Boolean(parent);
  el('pause').textContent = parent ? 'Filtering paused by ' + parent
    : paused ? 'Resume filtering for this host' : 'Pause ad filtering for this host';
}

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (/^https?:/.test(tab?.url || '')) host = new URL(tab.url).hostname;
  el('site').textContent = host || 'Open an HTTP or HTTPS page to inspect it.';
  const rules = await dnr.getDynamicRules();
  el('domains').value = rules.filter(rule => rule.id >= 2 && rule.id <= 201)
    .map(rule => rule.condition.urlFilter.slice(2, -1)).join('\n');
  await refresh();
  for (const id of filters) handle(el(id), 'change', () => send({ action: 'filter', id, enabled: el(id).checked }));
  handle(el('cleanup'), 'change', () => chrome.storage.local.set({ cleanup: el('cleanup').checked }));
  handle(el('pause'), 'click', () => send({ action: 'pause', host }));
  handle(el('save'), 'click', async () => {
    await send({ action: 'custom', input: el('domains').value });
    el('status').textContent = 'Custom domains saved.';
  });
}
init().catch(error => { el('status').textContent = error.message; });
