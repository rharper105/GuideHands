# GuideHands

> AI-powered accessibility co-pilot that guides users through complex websites, step by step.

GuideHands is a Chrome extension that sits in the browser's side panel, reads the current page via DOM context extraction, and uses Google Gemini 2.5 Flash to provide step-by-step navigation guidance with visual highlights, read-aloud, and auto-follow across page navigations.

Built for the **Gemini Live Agent Challenge** (UI Navigator category). Backend hosted on **Google Cloud Run**.

## The Problem

Government portals, healthcare systems, benefits applications, and banking interfaces are overwhelming. Users with cognitive disabilities, low digital literacy, or limited English proficiency are left behind by complex multi-step workflows they don't understand.

## The Solution

GuideHands acts as a personal navigation assistant that:
- **Reads the page** you're on (headings, buttons, forms, links, visible text)
- **Understands your goal** ("I want to file a disability claim")
- **Recommends the next step** in plain language ("Click the 'Start New Claim' button")
- **Shows you where** with a visual spotlight highlight
- **Follows along** automatically when you navigate to the next page
- **Explains terminology** you don't understand (e.g., "What is a DD-214?")
- **Reads aloud** for users who need audio guidance

## Core Features

| Feature | Description |
|---------|-------------|
| Page Analysis | Extracts DOM context (headings, buttons, forms, links, text) without screenshots |
| AI Guidance | Gemini 2.5 Flash provides next-step recommendations with confidence scores |
| Show Me | Spotlight highlight with backdrop overlay and pulse animation on the target element |
| Auto-Follow | Detects page navigation and automatically re-analyzes the new page |
| Explain More | Deep contextual explanations of unfamiliar terminology and concepts |
| Read Aloud | Web Speech API reads recommendations for accessibility |
| Voice Input | Dictate your goal instead of typing |
| Error Recovery | Graceful fallback when elements can't be found or the backend is slow |

## Architecture

```
Chrome Extension (Side Panel)
    |
    |-- background.js (service worker, message relay, navigation detection)
    |-- sidepanel.js  (UI logic, session state machine, API calls)
    |-- content.js    (DOM extraction, visual highlights, fuzzy element matching)
    |
    v
Next.js API on Google Cloud Run (/api/analyze)
    |
    v
Google Gemini 2.5 Flash (@google/genai SDK)
    |
    v
Structured JSON response (summary, next step, confidence, actions, warnings)
```

## How It Works

1. **Analyze** — Open the side panel, type your goal, click "Analyze Page"
2. **Get Guidance** — Gemini reads the page context and recommends the next action
3. **Take Action** — Click "Show me" to see a spotlight on the target element
4. **Continue** — Click "I did this" and navigate. GuideHands auto-analyzes the next page

## Local Development

### Prerequisites
- Node.js 18+
- Google Chrome
- A Gemini API key ([get one here](https://aistudio.google.com/apikey))

### Setup

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/GuideHands.git
cd GuideHands
npm install

# Configure API key
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Start dev server
npm run dev
```

### Load the Extension

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder from this repo
5. The GuideHands icon appears in your toolbar

### Try the Demo

1. Navigate to `http://localhost:3000` (redirects to the demo portal)
2. Click the GuideHands extension icon to open the side panel
3. Type: "I want to file a new disability benefits claim"
4. Click **Analyze Page** and follow the guided flow

The demo portal is a 3-page veteran benefits walkthrough:
- **Page 1**: Dashboard with "Start New Claim" button
- **Page 2**: Claim details form with personal info and service details
- **Page 3**: Document upload checklist (DD-214, medical records)

## Google Cloud Run Deployment

The backend is deployed to Google Cloud Run for production use.

### Quick Deploy

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Set your API key and deploy
export GEMINI_API_KEY="your_production_key"
bash scripts/deploy.sh
```

The deploy script builds the Docker container via Cloud Build and deploys to Cloud Run with the Gemini API key injected as an environment variable.

### Verify Deployment

```bash
# Health check
curl https://guidehands-100750064324.us-central1.run.app/api/analyze
# Returns: {"status":"ok","service":"GuideHands Analyze API"}
```

### Connect the Extension

After deployment, update `extension/sidepanel.js` line 5:
```javascript
const BACKEND_URL = 'https://guidehands-100750064324.us-central1.run.app';
```

Then reload the extension in `chrome://extensions`.

## Tech Stack

- **Chrome Extension** — Manifest V3, Side Panel API, Content Scripts
- **Next.js 16** — App Router, standalone output for containerization
- **Google Gemini 2.5 Flash** — Multimodal AI via `@google/genai` SDK
- **Google Cloud Run** — Serverless container hosting for the backend
- **Google Cloud Build** — Container image building
- **Web Speech API** — Read-aloud and voice dictation
- **TypeScript** — Backend API and type-safe response schemas

## Project Structure

```
GuideHands/
├── extension/           # Chrome extension source
│   ├── manifest.json    # Extension manifest (MV3)
│   ├── background.js    # Service worker
│   ├── sidepanel.js     # Side panel UI logic
│   ├── sidepanel.html   # Side panel markup
│   ├── sidepanel.css    # Side panel styles
│   └── content.js       # Content script (DOM + highlights)
├── src/app/
│   ├── api/analyze/     # Gemini-powered analysis endpoint
│   └── demo-portal/     # 3-page demo veteran benefits portal
├── Dockerfile           # Production multi-stage build
├── scripts/deploy.sh    # Cloud Run deployment script
└── package.json
```

## Limitations & Future Work

- **Single-page apps**: Navigation detection uses `chrome.tabs.onUpdated`, which may not fire for client-side routing in SPAs
- **Element matching**: "Show me" uses fuzzy text matching on button/link text; complex UIs may need more sophisticated selectors
- **Cold starts**: Cloud Run cold starts add 2-3 seconds on first request; subsequent requests are fast
- **Multi-language**: Currently English only; the architecture supports other languages via Gemini's multilingual capabilities

## License

MIT
