// GuideHands — Background Service Worker (MV3)
// Relays messages between side panel and content scripts.
// Hardened: retry logic, race-condition guard, tab-change awareness.

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

// Helper: send message to content script, injecting first if needed
async function injectAndSend(tabId, message, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // First attempt: try sending directly (manifest content_scripts may already be loaded)
            if (attempt === 0) {
                try {
                    const resp = await new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(tabId, message, (r) => {
                            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                            else resolve(r);
                        });
                    });
                    return resp;
                } catch {
                    // Content script not ready yet — fall through to injection
                }
            }

            // Inject content script (idempotent — re-registers listener if page changed)
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });

            // Small delay to let the listener register
            await new Promise(r => setTimeout(r, 150 + attempt * 200));

            // Try sending the message
            const response = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tabId, message, (resp) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(resp);
                    }
                });
            });

            return response;
        } catch (err) {
            console.log(`[GuideHands] Attempt ${attempt + 1} failed:`, err.message);
            if (attempt === maxRetries - 1) throw err;
            // Wait before retry
            await new Promise(r => setTimeout(r, 300));
        }
    }
}

// Relay messages from side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_PAGE_CONTEXT') {
        (async () => {
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tabs[0]?.id) {
                    sendResponse({ error: 'No active tab found' });
                    return;
                }
                const tab = tabs[0];

                // Guard: cannot read chrome://, edge://, about:, extension pages
                if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
                    tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://'))) {
                    sendResponse({ error: 'Cannot read internal browser pages. Navigate to a website first.' });
                    return;
                }

                const response = await injectAndSend(tab.id, { type: 'EXTRACT_CONTEXT' });
                sendResponse(response);
            } catch (err) {
                sendResponse({ error: err.message || 'Failed to read page context' });
            }
        })();
        return true;
    }

    if (message.type === 'CAPTURE_TAB') {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ dataUrl });
            }
        });
        return true;
    }

    if (message.type === 'HIGHLIGHT_ELEMENT' || message.type === 'CLEAR_HIGHLIGHTS') {
        (async () => {
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tabs[0]?.id) {
                    sendResponse({ success: false, reason: 'No active tab' });
                    return;
                }
                const response = await injectAndSend(tabs[0].id, message);
                sendResponse(response);
            } catch (err) {
                sendResponse({ success: false, reason: err.message });
            }
        })();
        return true;
    }
});

// ── Auto-detect page navigation ─────────────────────────────
// Track last-known URL per tab to detect real navigations
const tabUrls = new Map();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;
    if (!tab.url || !(tab.url.startsWith('http://') || tab.url.startsWith('https://'))) return;

    const previousUrl = tabUrls.get(tabId);
    tabUrls.set(tabId, tab.url);

    // Skip if URL hasn't actually changed (same-page reload)
    if (previousUrl === tab.url) return;

    // Notify side panel — it decides whether to act based on its state
    chrome.runtime.sendMessage({
        type: 'PAGE_NAVIGATED',
        url: tab.url,
        tabId: tabId
    }).catch(() => {
        // Side panel may not be open — this is expected, suppress error
    });
});

chrome.tabs.onRemoved.addListener((tabId) => {
    tabUrls.delete(tabId);
});
