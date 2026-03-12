# GuideHands 🧭

> A contest-ready multimodal UI navigation agent built for the Gemini Live Agent Challenge (UI Navigator Category).

GuideHands is a visual co-pilot that helps users navigate confusing digital workflows. It sees the UI (via screenshots), identifies what's on screen, and suggests structured next actions (`click`, `type`, `scroll`, `select`) through a clean, premium interface powered by Google Gemini.

## Features (MVP Scope)
- **Visual Context Array**: Paste (`Cmd+V`), drag-and-drop, or browse to upload a screenshot.
- **Multimodal AI Engine**: Leverages `gemini-2.5-flash` natively to understand screen states and user intent together.
- **Structured Outputs**: Predictable JSON action schema generated strictly by the model, allowing visual mapping or future Puppeteer automation.
- **Premium Interface**: Built with Next.js and custom CSS for a polished, competitive UX that demonstrates a live agent feel.

## Architecture & Data Flow

```mermaid
flowchart LR
    A[Next.js UI (Client)] -- "Base64 Image + Text Intent" --> B[Next.js API (Cloud Run)]
    B -- "Prompt + Schema" --> C[Google GenAI SDK]
    C -- "Multimodal Inference" --> D((Gemini 2.5 Flash))
    D -- "Strict JSON Output" --> B
    B -- "Structured Actions" --> A
```

## Setup & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # Required for the Gemini multimodal analysis endpoint
   GEMINI_API_KEY="your_api_key_here"
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## Google Cloud Run Deployment

This project is configured optimally for Cloud Run using Next.js standalone output.

### Quick Deploy
We have provided a script to deploy automatically using your local `gcloud` settings:
```bash
export GEMINI_API_KEY="your_production_key"
./scripts/deploy.sh
```

### Manual Deploy (Cloud Build)
1. Ensure the Google Cloud SDK is installed and authenticated (`gcloud auth login`).
2. Submit the build via Cloud Build:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/guidehands
   ```
3. Deploy the container:
   ```bash
   gcloud run deploy guidehands \
     --image gcr.io/YOUR_PROJECT_ID/guidehands \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=your_production_key
   ```

## Demo & Hackathon Submission Evidence

For the Gemini Live Agent Challenge, you must provide proof of deployment.

**1. Proof of Cloud Run:**
Navigate to the hosted URL appended with the health route (e.g., `https://guidehands-[hash]-uc.a.run.app/api/analyze`). It should return:
```json
{"status":"ok","service":"GuideHands Analyze API"}
```
Capture a screenshot of this health endpoint returning `ok` with the Cloud Run lock/URL visible in the browser address bar.

**2. Logs Capture:**
To prove backend execution, run the following command while submitting a request in the deployed app:
```bash
gcloud run services logs tail guidehands --region us-central1
```
Take a screenshot of the terminal logs streaming the analysis requests.

**3. Demo Video:**
Record a 2-minute video showing:
- A confusing UI (e.g. AWS Console, complex settings).
- Dropping the screenshot into the GuideHands UI.
- The model successfully predicting the exact next click element.
- Explain the data flow powering the prediction.
