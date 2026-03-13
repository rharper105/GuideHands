// GuideHands — Side Panel Logic (Hardened)
// Session state machine, retry-aware page context, error recovery.

// ── Configuration ──────────────────────────────────────────────
const BACKEND_URL = 'http://localhost:3000';
const DEBUG = true;
const MAX_CONTEXT_RETRIES = 2;

// ── DOM Elements ───────────────────────────────────────────────
const goalInput = document.getElementById('goalInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const refreshBtn = document.getElementById('refreshBtn');
const micBtn = document.getElementById('micBtn');
const screenshotBtn = document.getElementById('screenshotBtn');

const statusSection = document.getElementById('statusSection');
const statusMessage = document.getElementById('statusMessage');

const awaitingSection = document.getElementById('awaitingSection');
const awaitingText = document.getElementById('awaitingText');
const awaitingAnalyze = document.getElementById('awaitingAnalyze');
const awaitingStartOver = document.getElementById('awaitingStartOver');

const errorSection = document.getElementById('errorSection');
const errorText = document.getElementById('errorText');
const errorRetry = document.getElementById('errorRetry');
const errorRefresh = document.getElementById('errorRefresh');
const errorStartOver = document.getElementById('errorStartOver');

const resultSection = document.getElementById('resultSection');
const nextStep = document.getElementById('nextStep');
const confidenceBadge = document.getElementById('confidenceBadge');
const userGoal = document.getElementById('userGoal');
const screenSummary = document.getElementById('screenSummary');
const warningsContainer = document.getElementById('warningsContainer');
const detailsContainer = document.getElementById('detailsContainer');
const toggleDetails = document.getElementById('toggleDetails');

const btnDone = document.getElementById('btnDone');
const btnFailed = document.getElementById('btnFailed');
const btnExplain = document.getElementById('btnExplain');
const btnRefreshContext = document.getElementById('btnRefreshContext');
const btnShowMe = document.getElementById('btnShowMe');
const btnClearHighlights = document.getElementById('btnClearHighlights');

const contextDebug = document.getElementById('contextDebug');
const contextOutput = document.getElementById('contextOutput');

const healthDot = document.getElementById('healthDot');
const healthText = document.getElementById('healthText');

const screenshotSection = document.getElementById('screenshotSection');
const screenshotPreview = document.getElementById('screenshotPreview');
const removeScreenshot = document.getElementById('removeScreenshot');

// ── Session State ──────────────────────────────────────────────
// States: idle | analyzing | result_ready | awaiting_next_page | recoverable_error
let session = {
    state: 'idle',
    goal: '',
    stepIndex: 0,
    lastPageSummary: '',
    lastRecommendation: '',
    lastUrl: '',
    previousContext: null,  // chain context sent to backend
    lastResult: null,
};

let currentPageContext = null;
let currentScreenshot = null;
let isListening = false;
let detailsVisible = false;

// ── State Transitions ──────────────────────────────────────────
function transitionTo(newState) {
    session.state = newState;

    // Hide all state-specific sections
    statusSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    awaitingSection.classList.add('hidden');
    errorSection.classList.add('hidden');

    switch (newState) {
        case 'idle':
            analyzeBtn.disabled = false;
            break;
        case 'analyzing':
            analyzeBtn.disabled = true;
            showStatus('Analyzing with GuideHands...', 'loading');
            break;
        case 'result_ready':
            analyzeBtn.disabled = false;
            resultSection.classList.remove('hidden');
            break;
        case 'awaiting_next_page':
            analyzeBtn.disabled = false;
            awaitingSection.classList.remove('hidden');
            awaitingText.textContent =
                `Step ${session.stepIndex} completed. Navigate to the next page, then click "Analyze This Page" to continue.`;
            break;
        case 'recoverable_error':
            analyzeBtn.disabled = false;
            errorSection.classList.remove('hidden');
            break;
    }
}

function showRecoverableError(message) {
    errorText.textContent = message;
    transitionTo('recoverable_error');
}

// ── Health Check ───────────────────────────────────────────────
async function checkHealth() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/analyze`);
        if (res.ok) {
            healthDot.classList.add('ok');
            healthDot.classList.remove('error');
            healthText.textContent = 'Backend connected';
        } else {
            throw new Error();
        }
    } catch {
        healthDot.classList.add('error');
        healthDot.classList.remove('ok');
        healthText.textContent = 'Backend disconnected';
    }
}

// ── Page Context (with retry) ──────────────────────────────────
function requestPageContext() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTEXT' }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response?.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    });
}

async function fetchPageContextWithRetry() {
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_CONTEXT_RETRIES; attempt++) {
        try {
            showStatus(attempt === 0
                ? 'Extracting page context...'
                : `Retrying page context (attempt ${attempt + 1})...`,
                'loading');
            const context = await requestPageContext();

            // Validate we got something meaningful
            if (!context || (!context.url && !context.title && !context.visibleText)) {
                throw new Error('Page returned empty context. It may still be loading.');
            }

            currentPageContext = context;
            session.lastUrl = context.url || '';

            if (DEBUG) {
                contextDebug.classList.remove('hidden');
                contextOutput.textContent = JSON.stringify(context, null, 2);
            }

            hideStatus();
            return context;
        } catch (err) {
            lastError = err;
            console.log(`[GuideHands] Context attempt ${attempt + 1} failed:`, err.message);
            if (attempt < MAX_CONTEXT_RETRIES) {
                await sleep(500 + attempt * 500);
            }
        }
    }

    // All retries exhausted
    return null;
}

// ── Screenshot ─────────────────────────────────────────────────
async function captureTabScreenshot() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response?.error) {
                reject(new Error(response.error));
            } else {
                resolve(response.dataUrl);
            }
        });
    });
}

async function takeScreenshot() {
    try {
        showStatus('Capturing tab screenshot...', 'loading');
        currentScreenshot = await captureTabScreenshot();
        screenshotPreview.src = currentScreenshot;
        screenshotSection.classList.remove('hidden');
        hideStatus();
    } catch (err) {
        showStatus(`Screenshot failed: ${err.message}`, 'error');
    }
}

// ── Voice Dictation ────────────────────────────────────────────
function toggleDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showStatus('Voice dictation not supported.', 'error');
        return;
    }
    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('active');
        micBtn.textContent = '🔴';
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        goalInput.value = goalInput.value ? goalInput.value + ' ' + transcript : transcript;
    };
    recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
            showStatus('Microphone access denied.', 'error');
        } else if (event.error !== 'no-speech') {
            showStatus(`Mic error: ${event.error}`, 'error');
        }
        isListening = false;
        micBtn.classList.remove('active');
        micBtn.textContent = '🎤';
    };
    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('active');
        micBtn.textContent = '🎤';
    };
    try { recognition.start(); } catch { showStatus('Could not start microphone.', 'error'); }
}

// ── UI Helpers ─────────────────────────────────────────────────
function showStatus(text, type) {
    statusSection.classList.remove('hidden');
    statusMessage.textContent = text;
    statusMessage.className = `status-message ${type}`;
    if (type === 'loading') statusMessage.classList.add('loading-pulse');
}

function hideStatus() {
    statusSection.classList.add('hidden');
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function showResult(data) {
    session.lastResult = data;
    session.lastRecommendation = data.recommended_next_step || '';
    session.lastPageSummary = data.screen_summary || '';

    nextStep.textContent = data.recommended_next_step || 'No recommendation available.';
    confidenceBadge.textContent = `${data.confidence || 0}% Confident`;
    userGoal.textContent = data.user_goal || session.goal;
    screenSummary.textContent = data.screen_summary || '';

    // Warnings
    if (data.warnings && data.warnings.length > 0) {
        warningsContainer.classList.remove('hidden');
        warningsContainer.innerHTML = data.warnings.map(w =>
            `<div class="warning-item">⚠️ ${escapeHtml(w)}</div>`
        ).join('');
    } else {
        warningsContainer.classList.add('hidden');
    }

    // Detailed steps
    if (data.actions && data.actions.length > 0) {
        detailsContainer.innerHTML = data.actions.map((action, i) => `
      <div class="action-step">
        <div class="step-number">${i + 1}</div>
        <div class="step-content">
          <h4><span class="step-type">${escapeHtml(action.type)}</span>${escapeHtml(action.target)}</h4>
          <p>${escapeHtml(action.reason)}</p>
          ${action.text ? `<div class="step-meta">Type: <code>"${escapeHtml(action.text)}"</code></div>` : ''}
          ${action.direction ? `<div class="step-meta">Scroll: <strong>${escapeHtml(action.direction)}</strong></div>` : ''}
        </div>
      </div>
    `).join('');
    }

    detailsVisible = false;
    detailsContainer.classList.add('hidden');
    toggleDetails.textContent = '▶ Show detailed steps';

    transitionTo('result_ready');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function startOver() {
    session = {
        state: 'idle',
        goal: '',
        stepIndex: 0,
        lastPageSummary: '',
        lastRecommendation: '',
        lastUrl: '',
        previousContext: null,
        lastResult: null,
    };
    currentPageContext = null;
    currentScreenshot = null;
    goalInput.value = '';
    screenshotSection.classList.add('hidden');
    screenshotPreview.src = '';
    contextDebug.classList.add('hidden');
    transitionTo('idle');
}

// ── Analyze ────────────────────────────────────────────────────
async function analyze() {
    // Persist goal into session
    session.goal = goalInput.value.trim() || session.goal || 'What should I do on this page?';
    goalInput.value = session.goal;

    transitionTo('analyzing');

    // Fetch page context with retry
    const context = await fetchPageContextWithRetry();
    if (!context) {
        showRecoverableError('Could not read the page after multiple attempts. The page may still be loading, or it may be an internal browser page.');
        return;
    }

    showStatus('Analyzing with GuideHands...', 'loading');

    try {
        const payload = {
            pageContext: context,
            prompt: session.goal,
            url: context.url,
            previousContext: session.previousContext
        };

        if (currentScreenshot) {
            payload.image = currentScreenshot;
        }

        const res = await fetch(`${BACKEND_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Analysis failed');
        }

        session.stepIndex++;
        session.previousContext = null; // Clear chain context after successful use
        hideStatus();
        showResult(data);
    } catch (err) {
        showRecoverableError(`Analysis failed: ${err.message}`);
    }
}

// ── Event Listeners ────────────────────────────────────────────
analyzeBtn.addEventListener('click', analyze);
refreshBtn.addEventListener('click', async () => {
    const ctx = await fetchPageContextWithRetry();
    if (!ctx) showRecoverableError('Could not read the page.');
});
micBtn.addEventListener('click', toggleDictation);
screenshotBtn.addEventListener('click', takeScreenshot);

removeScreenshot.addEventListener('click', () => {
    currentScreenshot = null;
    screenshotSection.classList.add('hidden');
    screenshotPreview.src = '';
});

goalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') analyze();
});

toggleDetails.addEventListener('click', () => {
    detailsVisible = !detailsVisible;
    detailsContainer.classList.toggle('hidden', !detailsVisible);
    toggleDetails.textContent = detailsVisible ? '▼ Hide detailed steps' : '▶ Show detailed steps';
});

// ── Guided Flow Buttons ────────────────────────────────────────
btnDone.addEventListener('click', () => {
    // Transition to awaiting-next-page — do NOT immediately re-analyze
    session.previousContext = `User completed step ${session.stepIndex}: "${session.lastRecommendation}". Generate the next logical step in their workflow.`;
    transitionTo('awaiting_next_page');
});

btnFailed.addEventListener('click', () => {
    session.previousContext = `User indicated step ${session.stepIndex} failed: "${session.lastRecommendation}". Provide an alternative approach based on fresh page context.`;
    transitionTo('awaiting_next_page');
    awaitingText.textContent = 'Step marked as unsuccessful. Click "Analyze This Page" for an alternative approach.';
});

btnExplain.addEventListener('click', () => {
    session.previousContext = `User requested a simpler explanation of step ${session.stepIndex}: "${session.lastRecommendation}". Keep it extremely simple and beginner-friendly.`;
    analyze();
});

btnRefreshContext.addEventListener('click', async () => {
    const ctx = await fetchPageContextWithRetry();
    if (!ctx) showRecoverableError('Could not read the page.');
});

// ── Awaiting-state Buttons ─────────────────────────────────────
awaitingAnalyze.addEventListener('click', analyze);
awaitingStartOver.addEventListener('click', startOver);

// ── Error-recovery Buttons ─────────────────────────────────────
errorRetry.addEventListener('click', analyze);
errorRefresh.addEventListener('click', async () => {
    const ctx = await fetchPageContextWithRetry();
    if (ctx) transitionTo('idle');
});
errorStartOver.addEventListener('click', startOver);

// ── Visual Guidance ────────────────────────────────────────────
function sendHighlightMessage(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                resolve({ success: false, reason: chrome.runtime.lastError.message });
            } else {
                resolve(response || { success: false, reason: 'No response' });
            }
        });
    });
}

async function showMeHighlight() {
    const result = session.lastResult;
    if (!result) {
        showStatus('No analysis result to highlight.', 'error');
        return;
    }

    if ((result.confidence || 0) < 50) {
        showStatus('Confidence too low to highlight reliably. Follow the text guidance above.', 'error');
        return;
    }

    // Find the best target description from the result
    let target = null;
    if (result.actions && result.actions.length > 0) {
        target = result.actions[0].target;
    }
    if (!target) {
        target = result.recommended_next_step;
    }

    showStatus('Looking for the element on the page...', 'loading');
    const resp = await sendHighlightMessage({
        type: 'HIGHLIGHT_ELEMENT',
        target: target,
        label: 'Next step'
    });

    if (resp.success) {
        hideStatus();
    } else {
        showStatus(resp.reason || 'Could not find that element on the page. Follow the text guidance above.', 'error');
    }
}

async function clearPageHighlights() {
    await sendHighlightMessage({ type: 'CLEAR_HIGHLIGHTS' });
}

btnShowMe.addEventListener('click', showMeHighlight);
btnClearHighlights.addEventListener('click', clearPageHighlights);

// ── Init ───────────────────────────────────────────────────────
checkHealth();
transitionTo('idle');
