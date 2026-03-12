'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, MessageSquare, Send, X, AlertTriangle, CheckCircle2, MousePointer2, Keyboard, ArrowDownUp, MousePointerClick, Loader2, Monitor } from 'lucide-react';
import { AnalysisResponse, Action } from '@/lib/schema';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<'checking' | 'ok' | 'error'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend health on load
  useEffect(() => {
    fetch('/api/analyze')
      .then(res => res.ok ? setHealth('ok') : setHealth('error'))
      .catch(() => setHealth('error'));
  }, []);

  // Handle paste events globally
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) handleFile(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null); // Clear previous results
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const captureScreen = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen capture is not supported in this browser.');
      }
      // Request video stream
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });

      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.srcObject = stream;

      // Wait for it to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(null);
      });

      // Small delay to ensure the frame renders correctly
      await new Promise(r => setTimeout(r, 150));

      // Draw the frame to a canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert and set
      const dataUrl = canvas.toDataURL('image/png');
      setImage(dataUrl);
      setResult(null);
      setError(null);

      // Immediately stop all tracks to protect privacy and end capture
      stream.getTracks().forEach(track => track.stop());
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Screen capture was denied.');
      } else {
        setError(err.message || 'Screen capture failed.');
      }
    }
  };

  const analyzeScreen = async () => {
    if (!image) {
      setError('Please add a screenshot first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, prompt: prompt || 'What should I do on this screen?' })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze screen');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'click': return <MousePointerClick className="action-icon click" />;
      case 'type': return <Keyboard className="action-icon type" />;
      case 'scroll': return <ArrowDownUp className="action-icon scroll" />;
      case 'select': return <MousePointer2 className="action-icon select" />;
      default: return <CheckCircle2 className="action-icon default" />;
    }
  };

  return (
    <div className="animate-fade-in dashboard-layout">
      <div className="left-panel">
        <header className="header" style={{ textAlign: 'left' }}>
          <h1>GuideHands</h1>
          <p>Your visual co-pilot for navigating digital interfaces.</p>
        </header>

        {!image ? (
          <section
            className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 1rem auto' }} />
            <h2>Upload or Paste Screenshot</h2>
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
              Drag an image, click to browse, or use Cmd+V to paste your screen context.
            </p>
            <button
              className="btn-primary"
              onClick={(e) => { e.stopPropagation(); captureScreen(); }}
              style={{ marginTop: '1.5rem', marginLeft: 'auto', marginRight: 'auto', background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              <Monitor size={18} />
              Capture Current Page
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </section>
        ) : (
          <div className="image-preview-container">
            <button className="remove-image" onClick={() => { setImage(null); setResult(null); }}>
              <X size={20} />
            </button>
            <img src={image} alt="Target UI" className="image-preview" />
          </div>
        )}

        <section className="input-area" style={{ marginTop: 'auto' }}>
          <MessageSquare color="var(--muted)" />
          <input
            type="text"
            placeholder="What are you trying to accomplish?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyzeScreen()}
          />
          <button
            className="btn-primary"
            disabled={!image || isAnalyzing}
            onClick={analyzeScreen}
          >
            {isAnalyzing ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            <span>Analyze</span>
          </button>
        </section>

        {error && (
          <div className="error-card">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: health === 'ok' ? 'var(--accent)' : health === 'error' ? 'var(--danger)' : 'var(--warning)'
          }} />
          {health === 'ok' ? 'Backend Connected' : health === 'error' ? 'Backend Disconnected' : 'Checking Backend...'}
        </div>
      </div>

      <div className="right-panel">
        {isAnalyzing ? (
          <div className="loading-state">
            <Loader2 size={48} className="spin primary-color" />
            <h3>Analyzing Interface...</h3>
            <p>GuideHands is scanning the UI and interpreting your request.</p>
          </div>
        ) : result ? (
          <div className="results-container animate-fade-in">
            <div className="result-card highlight-card">
              <div className="card-header">
                <h3>Recommended Next Step</h3>
                <span className="confidence-badge">{result.confidence}% Confident</span>
              </div>
              <p className="big-text">{result.recommended_next_step}</p>
            </div>

            <div className="result-card">
              <h3>Screen Context</h3>
              <p><strong>Goal:</strong> {result.user_goal}</p>
              <p style={{ marginTop: '0.5rem', color: 'var(--muted)' }}>{result.screen_summary}</p>
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <div className="warnings-container">
                {result.warnings.map((w, i) => (
                  <div key={i} className="warning-item">
                    <AlertTriangle size={16} />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="actions-list">
              <h3>Execution Steps</h3>
              {result.actions.map((action, i) => (
                <div key={i} className="action-step">
                  <div className="action-icon-wrapper">
                    {getActionIcon(action.type)}
                  </div>
                  <div className="action-details">
                    <h4>
                      <span className="action-type">{action.type.toUpperCase()}</span>
                      {action.target}
                    </h4>
                    <p>{action.reason}</p>
                    {action.text && <div className="action-meta">Type: <code>"{action.text}"</code></div>}
                    {action.direction && <div className="action-meta">Scroll: <strong>{action.direction}</strong></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-shield">
              <UploadCloud size={32} />
            </div>
            <h3>Awaiting Context</h3>
            <p>Upload a screenshot and ask a question to see GuideHands in action.</p>
          </div>
        )}
      </div>
    </div>
  );
}
