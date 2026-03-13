export default function Documents() {
  return (
    <>
      <nav className="portal-breadcrumb">
        <a href="/demo-portal">Home</a>
        <span>&rsaquo;</span>
        <a href="/demo-portal">New Claim</a>
        <span>&rsaquo;</span>
        <a href="/demo-portal/claim-details">Claim Details</a>
        <span>&rsaquo;</span>
        Supporting Documents
      </nav>

      <main className="portal-main">
        <div className="portal-layout">
          {/* Main content */}
          <div className="portal-content">
            <div className="portal-card">
              <h2>Supporting Documents &mdash; Step 3 of 4</h2>
              <p>
                Upload the required and recommended documents to support your
                claim. Providing complete documentation helps ensure faster
                processing of your application.
              </p>
            </div>

            {/* Progress */}
            <div className="portal-card">
              <div className="portal-progress">
                <span className="portal-progress-label">Your Application</span>
                <span className="portal-progress-step">Step 3 of 4 &mdash; Documents</span>
              </div>
              <div className="portal-progress-bar">
                <div className="portal-progress-fill" style={{ width: '50%' }} />
              </div>
            </div>

            {/* Document checklist */}
            <div className="portal-card">
              <h2>Document Checklist</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                {/* DD-214 — Required, Missing */}
                <div className="portal-doc-card" style={{ borderLeft: '4px solid #dc2626' }}>
                  <div className="portal-doc-info">
                    <h3>DD-214 (Certificate of Release or Discharge)</h3>
                    <div className="portal-doc-meta">
                      <span className="portal-badge portal-badge-red">Missing</span>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>Required</span>
                    </div>
                  </div>
                  <button className="portal-btn portal-btn-primary" aria-label="Upload DD-214">
                    Upload DD-214
                  </button>
                </div>

                {/* Medical Records — Optional */}
                <div className="portal-doc-card">
                  <div className="portal-doc-info">
                    <h3>Medical Records</h3>
                    <div className="portal-doc-meta">
                      <span className="portal-badge portal-badge-gray">Not uploaded</span>
                      <span style={{ color: '#6b7280' }}>Optional</span>
                    </div>
                  </div>
                  <button className="portal-btn portal-btn-secondary" aria-label="Upload Medical Records">
                    Upload
                  </button>
                </div>

                {/* Personal Statement — Recommended */}
                <div className="portal-doc-card">
                  <div className="portal-doc-info">
                    <h3>Personal Statement</h3>
                    <div className="portal-doc-meta">
                      <span className="portal-badge portal-badge-amber">Not uploaded</span>
                      <span style={{ color: '#d97706', fontWeight: 500 }}>Recommended</span>
                    </div>
                  </div>
                  <button className="portal-btn portal-btn-secondary" aria-label="Upload Personal Statement">
                    Upload
                  </button>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="portal-info">
              <span>&#9432;</span>
              <div>
                <strong>Accepted formats:</strong> PDF, JPG, PNG.
                Maximum file size: 10MB per document. You may upload
                multiple files for each category.
              </div>
            </div>

            {/* Action buttons */}
            <div className="portal-card">
              <div className="portal-btn-row" style={{ borderTop: 'none', paddingTop: 0 }}>
                <a href="/demo-portal/claim-details" className="portal-btn portal-btn-secondary">
                  &larr; Back
                </a>
                <div className="portal-btn-row-right">
                  <button className="portal-btn portal-btn-link">
                    Skip for Now
                  </button>
                  <button className="portal-btn portal-btn-primary" title="1 required document is missing">
                    Review &amp; Submit Application &rarr;
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '8px', textAlign: 'right' }}>
                &#9888; 1 required document (DD-214) has not been uploaded.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="portal-sidebar">
            <div className="portal-notice">
              <span className="portal-notice-icon">&#9888;</span>
              <div>
                Your DD-214 is <strong>required</strong> to process your claim.
                Applications submitted without a DD-214 will be placed on hold
                until the document is received.
              </div>
            </div>

            <div className="portal-card">
              <h3>Where to Find Your DD-214</h3>
              <p style={{ marginBottom: '10px' }}>
                If you do not have a copy of your DD-214, you can request one
                from the National Personnel Records Center.
              </p>
              <ul className="portal-help-links">
                <li><a href="#">&#128196; Request DD-214 Online</a></li>
                <li><a href="#">&#128222; Call 1-314-801-0800</a></li>
              </ul>
            </div>

            <div className="portal-card">
              <h3>Tips for Uploading</h3>
              <ul className="portal-help-links">
                <li><a href="#">How to scan documents</a></li>
                <li><a href="#">Ensuring legible uploads</a></li>
                <li><a href="#">What if my documents are incomplete?</a></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
