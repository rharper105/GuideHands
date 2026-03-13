// GuideHands — Content Script
// Extracts structured page context from the active tab's DOM.

function extractPageContext() {
    const context = {
        url: window.location.href,
        title: document.title,
        headings: [],
        buttons: [],
        links: [],
        formFields: [],
        visibleText: ''
    };

    // Headings
    document.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
        const text = el.textContent?.trim();
        if (text) {
            context.headings.push({
                level: el.tagName.toLowerCase(),
                text: text.substring(0, 200)
            });
        }
    });

    // Buttons
    document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]').forEach((el) => {
        const text = el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('value') || '';
        if (text) {
            context.buttons.push({
                text: text.substring(0, 150),
                disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
                ariaLabel: el.getAttribute('aria-label') || ''
            });
        }
    });

    // Links
    document.querySelectorAll('a[href]').forEach((el) => {
        const text = el.textContent?.trim() || el.getAttribute('aria-label') || '';
        if (text && text.length > 1) {
            context.links.push({
                text: text.substring(0, 150),
                href: el.getAttribute('href')?.substring(0, 300) || '',
                ariaLabel: el.getAttribute('aria-label') || ''
            });
        }
    });

    // Form fields
    document.querySelectorAll('input, select, textarea').forEach((el) => {
        const label = el.getAttribute('aria-label')
            || el.getAttribute('placeholder')
            || el.labels?.[0]?.textContent?.trim()
            || el.getAttribute('name')
            || '';
        if (label) {
            context.formFields.push({
                type: el.type || el.tagName.toLowerCase(),
                label: label.substring(0, 200),
                value: el.type === 'password' ? '••••' : (el.value || '').substring(0, 100),
                required: el.required || false
            });
        }
    });

    // Visible text summary (first ~1500 chars of visible body text)
    const bodyText = document.body?.innerText || '';
    context.visibleText = bodyText.substring(0, 1500).replace(/\s+/g, ' ').trim();

    // Cap arrays to prevent oversized payloads
    context.headings = context.headings.slice(0, 30);
    context.buttons = context.buttons.slice(0, 30);
    context.links = context.links.slice(0, 40);
    context.formFields = context.formFields.slice(0, 30);

    return context;
}

// Listen for extraction requests from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_CONTEXT') {
        try {
            const context = extractPageContext();
            sendResponse(context);
        } catch (err) {
            sendResponse({ error: err.message });
        }
    }
    return true;
});
