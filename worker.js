const dnr = chrome.declarativeNetRequest;
const filters = ['ads', 'trackers', 'adult', 'strict'];
const pauseRuleId = 1;
const navigationPauseId = 202;
let queue = Promise.resolve();

function serialize(task) {
  const result = queue.then(task);
  queue = result.catch(error => console.error(error.message));
  return result;
}

function domain(input) {
  const host = input.trim().toLowerCase();
  if (host.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)) {
    throw new Error('Enter a hostname such as example.com.');
  }
  return host;
}

async function updatePauseRule(hosts) {
  await dnr.updateDynamicRules({
    removeRuleIds: [pauseRuleId, navigationPauseId],
    addRules: hosts.length ? [{
      id: pauseRuleId, priority: 10, action: { type: 'allowAllRequests' },
      condition: { requestDomains: hosts, resourceTypes: ['main_frame'] }
    }, {
      id: navigationPauseId, priority: 10, action: { type: 'allow' },
      condition: { initiatorDomains: hosts, resourceTypes: ['main_frame'] }
    }] : []
  });
}

chrome.runtime.onInstalled.addListener(() => {
  serialize(async () => {
    const { paused = [] } = await chrome.storage.local.get('paused');
    await updatePauseRule(paused);
    await dnr.setExtensionActionOptions({ displayActionCountAsBadgeText: true });
  });
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.url !== chrome.runtime.getURL('panel.html')) return;
  serialize(async () => {
    switch (message.action) {
      case 'filter': {
        if (!filters.includes(message.id) || typeof message.enabled !== 'boolean') throw new Error('Invalid filter.');
        await dnr.updateEnabledRulesets(message.enabled
          ? { enableRulesetIds: [message.id] }
          : { disableRulesetIds: [message.id] });
        break;
      }
      case 'pause': {
        const host = domain(message.host);
        const { paused = [] } = await chrome.storage.local.get('paused');
        const next = paused.includes(host) ? paused.filter(item => item !== host) : [...paused, host];
        await updatePauseRule(next);
        await chrome.storage.local.set({ paused: next });
        break;
      }
      case 'custom': {
        const hosts = [...new Set(message.input.split(/\s+/).filter(Boolean).map(domain))];
        if (hosts.length > 200) throw new Error('Enter up to 200 domains.');
        const oldRules = await dnr.getDynamicRules();
        await dnr.updateDynamicRules({
          removeRuleIds: oldRules.filter(rule => ![pauseRuleId, navigationPauseId].includes(rule.id)).map(rule => rule.id),
          addRules: hosts.map((host, index) => ({
            id: index + 2, priority: 30, action: { type: 'block' },
            condition: { urlFilter: '||' + host + '^', resourceTypes: ['main_frame', 'sub_frame'] }
          }))
        });
        break;
      }
      default: throw new Error('Unknown action.');
    }
    return { ok: true };
  }).then(respond, error => respond({ error: error.message }));
  return true;
});
