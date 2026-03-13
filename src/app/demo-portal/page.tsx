export default function PortalHome() {
  return (
    <>
      <nav className="portal-breadcrumb">
        <a href="/demo-portal">Home</a>
        <span>&rsaquo;</span>
        Dashboard
      </nav>

      <main className="portal-main">
        <div className="portal-layout">
          {/* Main content */}
          <div className="portal-content">
            <div className="portal-card">
              <h2>Welcome to the Veteran Benefits Portal</h2>
              <p>
                This portal allows eligible veterans and their dependents to file
                new benefit claims, check the status of existing applications, and
                upload required supporting documents. All information submitted
                through this portal is encrypted and handled in accordance with
                federal privacy regulations.
              </p>
            </div>

            {/* Notice banner */}
            <div className="portal-notice">
              <span className="portal-notice-icon">&#9888;</span>
              <div>
                <strong>Important:</strong> The deadline for FY2026 disability
                compensation claims is September 30, 2026. Claims submitted after
                this date may be subject to delayed processing. Please ensure all
                required documents are uploaded before submission.
              </div>
            </div>

            {/* Progress card */}
            <div className="portal-card">
              <div className="portal-progress">
                <span className="portal-progress-label">Your Application</span>
                <span className="portal-progress-step">Step 1 of 4 &mdash; Not Started</span>
              </div>
              <div className="portal-progress-bar">
                <div className="portal-progress-fill" style={{ width: '0%' }} />
              </div>
            </div>

            {/* Action cards */}
            <div className="portal-actions">
              <div className="portal-action-card">
                <div className="portal-action-info">
                  <h3>Start New Claim</h3>
                  <p>Begin a new disability compensation or pension claim</p>
                </div>
                <a href="/demo-portal/claim-details" className="portal-btn portal-btn-primary">
                  Start New Claim &rarr;
                </a>
              </div>

              <div className="portal-action-card">
                <div className="portal-action-info">
                  <h3>Continue Saved Application</h3>
                  <p>No saved applications found</p>
                </div>
                <button className="portal-btn portal-btn-disabled" disabled>
                  Continue
                </button>
              </div>

              <div className="portal-action-card">
                <div className="portal-action-info">
                  <h3>Check Claim Status</h3>
                  <p>View the status of a previously submitted claim</p>
                </div>
                <a href="#" className="portal-btn portal-btn-secondary">
                  Check Status
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="portal-sidebar">
            <div className="portal-card">
              <h3>Need Help?</h3>
              <p style={{ marginBottom: '12px' }}>
                If you need assistance filing your claim, the following resources
                are available:
              </p>
              <ul className="portal-help-links">
                <li><a href="#">&#128196; Frequently Asked Questions</a></li>
                <li><a href="#">&#128222; Call 1-800-827-1000</a></li>
                <li><a href="#">&#127970; Find a Regional Office</a></li>
                <li><a href="#">&#128172; Live Chat Support</a></li>
              </ul>
            </div>

            <div className="portal-card">
              <h3>Quick Links</h3>
              <ul className="portal-help-links">
                <li><a href="#">Eligibility Requirements</a></li>
                <li><a href="#">Required Documents Checklist</a></li>
                <li><a href="#">Appeal a Decision</a></li>
                <li><a href="#">Update Personal Information</a></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
