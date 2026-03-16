# GuideHands — Devpost Submission Draft

**Tagline:** Your AI co-pilot for navigating complex websites

---

## Inspiration

Millions of people struggle with complex digital interfaces every day. Government benefits portals, healthcare systems, and banking applications are designed for efficiency, not accessibility. For users with cognitive disabilities, low digital literacy, or limited English proficiency, a multi-step form can feel like an impossible maze. We wanted to build something that sits beside you in the browser and says: "Here's what to do next."

## What it does

GuideHands is a Chrome extension that acts as a real-time navigation assistant for any website. It:

- Opens as a side panel next to the page you're browsing
- Reads the page structure (headings, buttons, forms, links) through DOM extraction
- Takes your goal in plain language (e.g., "I want to file a disability benefits claim")
- Uses Gemini 2.5 Flash to analyze the page and recommend the next step
- Highlights the exact element you should interact with using a spotlight effect
- Automatically follows you to the next page and continues guiding
- Explains unfamiliar terminology in context (e.g., "What is a DD-214?")
- Reads recommendations aloud for users who need audio guidance

We demonstrate it with a fictional veteran benefits portal — a 3-page workflow where a user files a new disability claim, fills in service details, and uploads required documents.

## How we built it

**Architecture:**
- Chrome Extension (Manifest V3) with a side panel UI, service worker for message relay, and content script for DOM extraction and visual highlights
- Next.js API backend deployed on Google Cloud Run
- Google Gemini 2.5 Flash via the @google/genai SDK with structured JSON output schema
- Web Speech API for read-aloud and voice input

**Key technical decisions:**
- DOM context extraction instead of screenshots — faster, more reliable, works on any page
- Fuzzy text matching for "Show me" highlights — finds elements even when Gemini's description doesn't match exactly
- Session state machine in the side panel — tracks the guided flow across page navigations
- Auto-navigation detection via chrome.tabs.onUpdated — seamless multi-page workflows

## Challenges we ran into

- **Element matching accuracy**: Gemini describes elements in natural language ("the green Submit button"), but finding that element in the DOM requires fuzzy matching. We built a scoring algorithm that weighs text content, tag type, and visibility.
- **Cross-page state management**: Chrome extensions lose side panel state on navigation. We built a state machine that chains context between pages so Gemini knows what the user already completed.
- **Content script injection timing**: Pages that load slowly or use SPAs need retry logic for content script injection. We implemented exponential backoff with 3 retries.

## Accomplishments that we're proud of

- The "Show me" spotlight effect with backdrop overlay — it feels magical when it highlights exactly the right button
- Auto-follow across page navigations — click "I did this", navigate to the next page, and guidance appears automatically
- The "Explain more" feature — when a user doesn't know what a DD-214 is, Gemini provides deep contextual education, not just a simpler restatement
- Works on ANY website, not just our demo portal

## What we learned

- Structured output schemas with Gemini are incredibly powerful for building reliable UI agents — the response is always parseable and actionable
- DOM context extraction is surprisingly effective — headings, buttons, and visible text give Gemini enough signal to understand most pages without screenshots
- Chrome Extension Manifest V3 side panels are a great UX pattern for AI assistants — they stay open alongside the page without blocking content

## What's next for GuideHands

- **SPA support**: Better navigation detection for single-page applications using MutationObserver
- **Multi-language**: Leverage Gemini's multilingual capabilities for non-English interfaces
- **Learning mode**: Remember what the user has done before and skip redundant guidance
- **Enterprise deployment**: Configurable backend URL for organizations to self-host

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
