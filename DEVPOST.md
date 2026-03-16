# About GuideHands

## Inspiration

Government benefits portals, healthcare enrollment systems, and banking interfaces aren't built for the people who need them most. A veteran filing a disability claim for the first time faces dozens of unfamiliar fields, acronyms like "DD-214," and multi-step workflows with no one to ask for help. For users with cognitive disabilities, low digital literacy, or limited English proficiency, these systems are barriers, not tools.

We wanted to build something that sits right beside you in the browser — not a chatbot in another tab, not a help article to read — but a co-pilot that sees the same page you see and tells you, in plain language, what to do next.

## What it does

GuideHands is a Chrome extension that opens as a side panel alongside any website. You type your goal in plain language — "I want to file a new disability benefits claim" — and it reads the page, analyzes what's on screen, and gives you a single clear recommendation for your next step.

When you click **Show me**, GuideHands dims the rest of the page and spotlights the exact element you need to interact with — a pulsing purple outline with a floating label that says "Next step." When you complete that step and navigate to a new page, GuideHands automatically detects the navigation and re-analyzes without you pressing anything.

If you encounter unfamiliar terminology — like "DD-214" on a veteran benefits form — you click **Explain more** and get a real explanation: what the document is, why it's required, where to find yours. Not a simpler restatement. Actual context.

The extension also reads guidance aloud using the Web Speech API, accepts voice input for hands-free goal entry, and shows a confidence score so you know how certain the AI is about its recommendation.

We built a demo around a fictional veteran benefits portal — a 3-page workflow covering a dashboard, a claim details form, and a document upload checklist — but GuideHands works on any website. The architecture is general-purpose.

## How we built it

The system has three layers:

**Chrome Extension (Manifest V3)** — A content script extracts structured page context from the DOM: headings, buttons, links, form fields, and visible text. A service worker relays messages between the content script, the side panel UI, and handles navigation detection via `chrome.tabs.onUpdated`. The side panel runs a state machine with five states (idle, analyzing, result ready, awaiting next page, recoverable error) to manage the guided flow across pages.

**Next.js API on Google Cloud Run** — A single `/api/analyze` endpoint receives the page context and the user's goal, constructs a detailed prompt, and calls Gemini with a strict JSON response schema. The schema enforces structured output: screen summary, user goal interpretation, recommended next step, confidence score, warnings, and an ordered list of UI actions (click, type, scroll, select, wait) with target descriptions and reasons.

**Google Gemini 2.5 Flash via @google/genai SDK** — We use structured output with a response schema so every response is reliably parseable. Temperature is set to 0.1 to keep recommendations deterministic and factual. The prompt includes a hard constraint: the model must never make medical, legal, or eligibility decisions — only describe how to operate the interface.

The "Show me" feature uses a scoring-based fuzzy matcher on the client side. When Gemini says "click the Start New Claim button," the content script scores every interactive element on the page against that description — weighing exact text matches, partial word overlap, and semantic type bonuses (button descriptions matching actual `<button>` elements score higher). Elements above a 50-point threshold get the spotlight treatment: a backdrop overlay, a pulsing outline, and a floating label. Highlights auto-clear after 8 seconds.

The backend is containerized with a multi-stage Docker build (Node 20 Alpine, standalone Next.js output, non-root user) and deployed to Cloud Run in `us-central1` with `--allow-unauthenticated` so the extension can call it cross-origin.

## Challenges we ran into

**Bridging natural language to DOM elements.** Gemini describes UI elements in human terms — "the green Submit button in the bottom right" — but the DOM doesn't have a concept of "bottom right." We had to build a fuzzy scoring algorithm that combines text content matching, quoted string extraction, HTML tag-type bonuses, and a confidence threshold to avoid false positives. Getting the threshold right (50 points) took iteration; too low and we highlighted the wrong thing, too high and we highlighted nothing.

**State continuity across page navigations.** Chrome extensions don't persist side panel state when the user navigates to a new page within the same tab. We built a session state machine that chains context between analysis calls — when you click "I did this," the extension stores what you completed and feeds it to Gemini as `previousContext` on the next page, so the model knows where you are in the workflow.

**Content script injection timing.** Some pages take seconds to fully render, and content scripts injected too early return empty context. We implemented retry logic with exponential backoff (3 attempts, 500ms incremental delay) to handle slow pages gracefully.

**Cloud Run cold starts.** The first request after inactivity takes 2-3 seconds longer than subsequent ones. We added a 30-second fetch timeout with `AbortController` and stepped loading messages ("Reading the page...", "Understanding the layout...", "Preparing your guidance...") so the user always knows something is happening.

## What we learned

**Structured output schemas make AI agents reliable.** By defining a strict JSON schema with required fields and enum types, every Gemini response is parseable and actionable. We never had to handle free-text parsing or malformed output. This is the single most important pattern for building production AI features.

**DOM context extraction works better than screenshots for navigation.** We initially built a screenshot-based flow but found that sending structured text (headings, buttons, form fields, visible text) to Gemini produced more accurate and faster results. The model doesn't need to "see" the page — it needs to understand the page's structure. This also reduced payload size and latency significantly.

**Side panels are the right UX for browser AI assistants.** They stay open alongside the page without covering content. The user can read guidance and interact with the page simultaneously. This is a meaningfully better pattern than popups, new tabs, or injected overlays.

## What's next

**SPA detection** — Navigation detection currently relies on URL changes via `chrome.tabs.onUpdated`. Single-page applications that update content without changing the URL need a `MutationObserver`-based approach to detect when the page has meaningfully changed.

**Multi-language support** — Gemini already handles multilingual content, but the extension UI and prompt templates are English-only. Localizing the interface and adapting the prompt construction for non-English pages would expand reach significantly.

**Persistent memory** — Right now, every session starts fresh. Remembering what a user has already completed across sessions would let GuideHands skip redundant guidance and resume where the user left off.

**Organizational deployment** — Configurable backend URLs and managed API keys would let organizations deploy GuideHands for their employees or customers, tailored to specific internal portals.

## Built With

- Chrome Extension (Manifest V3)
- Google Gemini 2.5 Flash
- Google GenAI SDK (@google/genai)
- Google Cloud Run
- Google Cloud Build
- Next.js 16
- TypeScript
- Web Speech API
- CSS Animations
