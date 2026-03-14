// GuideHands — Content Script
// Extracts structured page context and provides visual highlight guidance.

// ── Page Context Extraction ────────────────────────────────────
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

    document.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
        const text = el.textContent?.trim();
        if (text) {
            context.headings.push({
                level: el.tagName.toLowerCase(),
                text: text.substring(0, 200)
            });
        }
    });

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

    const bodyText = document.body?.innerText || '';
    context.visibleText = bodyText.substring(0, 1500).replace(/\s+/g, ' ').trim();

    context.headings = context.headings.slice(0, 30);
    context.buttons = context.buttons.slice(0, 30);
    context.links = context.links.slice(0, 40);
    context.formFields = context.formFields.slice(0, 30);

    return context;
}

// ── Visual Highlight System ────────────────────────────────────
const GH_HIGHLIGHT_CLASS = 'guidehands-highlight';
const GH_LABEL_CLASS = 'guidehands-label';
const GH_STYLE_ID = 'guidehands-highlight-styles';

function injectHighlightStyles() {
    if (document.getElementById(GH_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = GH_STYLE_ID;
    style.textContent = `
    .guidehands-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.35);
      z-index: 9997;
      pointer-events: none;
      animation: guidehands-fade-in 0.3s ease;
    }
    @keyframes guidehands-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .${GH_HIGHLIGHT_CLASS} {
      outline: 3px solid #7c5cfc !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 6px rgba(124,92,252,0.25), 0 0 30px rgba(124,92,252,0.4) !important;
      border-radius: 4px !important;
      z-index: 9998 !important;
      position: relative;
      animation: guidehands-pulse 0.7s ease-in-out 3 !important;
    }
    @keyframes guidehands-pulse {
      0%, 100% {
        outline-color: #7c5cfc;
        box-shadow: 0 0 0 6px rgba(124,92,252,0.25), 0 0 30px rgba(124,92,252,0.4);
      }
      50% {
        outline-color: #9b7dff;
        box-shadow: 0 0 0 10px rgba(124,92,252,0.4), 0 0 40px rgba(124,92,252,0.6);
      }
    }
    .${GH_LABEL_CLASS} {
      background: #7c5cfc;
      color: white;
      font-size: 13px;
      font-weight: 600;
      padding: 5px 14px;
      border-radius: 6px;
      white-space: nowrap;
      z-index: 9999;
      pointer-events: none;
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .${GH_LABEL_CLASS}::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid #7c5cfc;
    }
  `;
    document.head.appendChild(style);
}

function clearHighlights() {
    document.querySelectorAll(`.${GH_HIGHLIGHT_CLASS}`).forEach(el => {
        el.classList.remove(GH_HIGHLIGHT_CLASS);
        if (el.dataset.ghOrigPosition !== undefined) {
            el.style.position = el.dataset.ghOrigPosition;
            delete el.dataset.ghOrigPosition;
        }
    });
    document.querySelectorAll(`.${GH_LABEL_CLASS}`).forEach(el => el.remove());
    document.querySelectorAll('.guidehands-backdrop').forEach(el => el.remove());
}

function findTargetElement(targetDescription) {
    if (!targetDescription) return null;

    const desc = targetDescription.toLowerCase();

    // Extract quoted text from descriptions like: 'The "Sign In" button'
    const quotedMatch = desc.match(/["'"]([^"'"]+)["'"]/);
    const quotedText = quotedMatch ? quotedMatch[1] : null;

    // Strategy 1: Try exact text match on interactive elements
    const interactiveSelectors = [
        'button', '[role="button"]', 'a[href]',
        'input[type="submit"]', 'input[type="button"]',
        'input', 'select', 'textarea',
        'label', '[role="link"]', '[role="tab"]'
    ];

    let bestMatch = null;
    let bestScore = 0;

    const candidates = document.querySelectorAll(interactiveSelectors.join(', '));

    for (const el of candidates) {
        // Skip invisible elements
        if (el.offsetParent === null && el.tagName !== 'INPUT') continue;

        const elText = (el.textContent?.trim() || '').toLowerCase();
        const elLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const elValue = (el.getAttribute('value') || '').toLowerCase();
        const elPlaceholder = (el.getAttribute('placeholder') || '').toLowerCase();
        const elTitle = (el.getAttribute('title') || '').toLowerCase();
        const allText = `${elText} ${elLabel} ${elValue} ${elPlaceholder} ${elTitle}`;

        let score = 0;

        // Exact quoted text match (highest priority)
        if (quotedText && (elText === quotedText || elLabel === quotedText || elValue === quotedText)) {
            score = 100;
        }
        // Quoted text is contained in element text
        else if (quotedText && (elText.includes(quotedText) || elLabel.includes(quotedText))) {
            score = 80;
        }
        // Description words match element text
        else {
            const descWords = desc.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
            const matchingWords = descWords.filter(w => allText.includes(w));
            score = (matchingWords.length / Math.max(descWords.length, 1)) * 60;
        }

        // Bonus for element type matching description
        if (desc.includes('button') && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button')) score += 10;
        if (desc.includes('link') && el.tagName === 'A') score += 10;
        if (desc.includes('field') && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) score += 10;
        if (desc.includes('input') && ['INPUT', 'TEXTAREA'].includes(el.tagName)) score += 10;
        if (desc.includes('dropdown') && el.tagName === 'SELECT') score += 10;

        if (score > bestScore) {
            bestScore = score;
            bestMatch = el;
        }
    }

    // Also check headings if description mentions a section
    if (bestScore < 40) {
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
            const elText = (el.textContent?.trim() || '').toLowerCase();
            if (quotedText && elText.includes(quotedText)) {
                bestMatch = el;
                bestScore = 70;
            }
        });
    }

    // Minimum confidence threshold
    return bestScore >= 50 ? bestMatch : null;
}

function highlightElement(targetDescription, label) {
    clearHighlights();
    injectHighlightStyles();

    // Create backdrop overlay for spotlight effect
    const backdrop = document.createElement('div');
    backdrop.className = 'guidehands-backdrop';
    document.body.appendChild(backdrop);

    const el = findTargetElement(targetDescription);
    if (!el) {
        clearHighlights(); // Remove backdrop if element not found
        return { success: false, reason: 'Could not find the target element on the page.' };
    }

    el.classList.add(GH_HIGHLIGHT_CLASS);

    // Ensure z-index works and label can be positioned — override static elements
    const computedPos = window.getComputedStyle(el).position;
    if (computedPos === 'static') {
        el.dataset.ghOrigPosition = el.style.position || '';
        el.style.position = 'relative';
    }

    // Add floating label — use fixed positioning on body to avoid breaking inputs/textareas
    if (label) {
        const labelEl = document.createElement('div');
        labelEl.className = GH_LABEL_CLASS;
        labelEl.textContent = label;
        const rect = el.getBoundingClientRect();
        labelEl.style.position = 'fixed';
        labelEl.style.top = `${rect.top - 36}px`;
        labelEl.style.left = `${rect.left + rect.width / 2}px`;
        labelEl.style.transform = 'translateX(-50%)';
        document.body.appendChild(labelEl);
    }

    // Scroll into view smoothly
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-clear highlights after 8 seconds
    setTimeout(() => clearHighlights(), 8000);

    return { success: true };
}

// ── Message Listener ───────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_CONTEXT') {
        try {
            const context = extractPageContext();
            sendResponse(context);
        } catch (err) {
            sendResponse({ error: err.message });
        }
    }

    if (message.type === 'HIGHLIGHT_ELEMENT') {
        try {
            const result = highlightElement(message.target, message.label || 'Next step');
            sendResponse(result);
        } catch (err) {
            sendResponse({ success: false, reason: err.message });
        }
    }

    if (message.type === 'CLEAR_HIGHLIGHTS') {
        clearHighlights();
        sendResponse({ success: true });
    }

    return true;
});
