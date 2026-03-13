export default function ClaimDetails() {
  return (
    <>
      <nav className="portal-breadcrumb">
        <a href="/demo-portal">Home</a>
        <span>&rsaquo;</span>
        <a href="/demo-portal">New Claim</a>
        <span>&rsaquo;</span>
        Claim Details
      </nav>

      <main className="portal-main">
        <div className="portal-layout">
          {/* Main content */}
          <div className="portal-content">
            <div className="portal-card">
              <h2>Claim Details &mdash; Step 2 of 4</h2>
              <p>
                Please provide information about your service and the condition
                for which you are filing a claim. All fields marked with an
                asterisk (*) are required.
              </p>
            </div>

            {/* Progress */}
            <div className="portal-card">
              <div className="portal-progress">
                <span className="portal-progress-label">Your Application</span>
                <span className="portal-progress-step">Step 2 of 4 &mdash; Claim Details</span>
              </div>
              <div className="portal-progress-bar">
                <div className="portal-progress-fill" style={{ width: '25%' }} />
              </div>
            </div>

            {/* Form */}
            <div className="portal-card">
              {/* Service Information */}
              <div className="portal-form-section">
                <h3>Service Information</h3>
                <div className="portal-form-row">
                  <div className="portal-form-group">
                    <label htmlFor="branch">
                      Branch of Service<span className="required">*</span>
                    </label>
                    <select id="branch" name="branch" defaultValue="">
                      <option value="" disabled>Select branch...</option>
                      <option value="army">Army</option>
                      <option value="navy">Navy</option>
                      <option value="air-force">Air Force</option>
                      <option value="marines">Marines</option>
                      <option value="coast-guard">Coast Guard</option>
                      <option value="space-force">Space Force</option>
                    </select>
                  </div>
                  <div className="portal-form-group">
                    <label htmlFor="service-number">
                      Service Number<span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="service-number"
                      name="service-number"
                      placeholder="Enter your service number"
                    />
                  </div>
                </div>
                <div className="portal-form-row">
                  <div className="portal-form-group">
                    <label htmlFor="service-start">
                      Service Start Date<span className="required">*</span>
                    </label>
                    <input type="date" id="service-start" name="service-start" />
                  </div>
                  <div className="portal-form-group">
                    <label htmlFor="service-end">
                      Service End Date<span className="required">*</span>
                    </label>
                    <input type="date" id="service-end" name="service-end" />
                  </div>
                </div>
              </div>

              {/* Condition Summary */}
              <div className="portal-form-section">
                <h3>Condition Summary</h3>
                <div className="portal-form-row">
                  <div className="portal-form-group">
                    <label htmlFor="condition-name">
                      Condition or Disability<span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="condition-name"
                      name="condition-name"
                      placeholder="e.g., Post-Traumatic Stress Disorder"
                    />
                  </div>
                  <div className="portal-form-group">
                    <label htmlFor="severity">
                      Severity<span className="required">*</span>
                    </label>
                    <select id="severity" name="severity" defaultValue="">
                      <option value="" disabled>Select severity...</option>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Symptoms */}
              <div className="portal-form-section">
                <h3>Symptoms</h3>
                <div className="portal-form-group">
                  <label htmlFor="symptoms">
                    Describe your symptoms<span className="required">*</span>
                  </label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    placeholder="Please describe your current symptoms and how they affect your daily activities..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Treatment History */}
              <div className="portal-form-section">
                <h3>Treatment History</h3>
                <div className="portal-form-group">
                  <label>Are you currently receiving treatment for this condition?</label>
                  <div className="portal-radio-group">
                    <label>
                      <input type="radio" name="treatment" value="yes" /> Yes
                    </label>
                    <label>
                      <input type="radio" name="treatment" value="no" /> No
                    </label>
                  </div>
                </div>
                <div className="portal-form-group">
                  <label htmlFor="treatment-details">
                    Treatment details (if applicable)
                  </label>
                  <textarea
                    id="treatment-details"
                    name="treatment-details"
                    placeholder="Name of treating facility, physician, and frequency of treatment..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="portal-btn-row">
                <a href="/demo-portal" className="portal-btn portal-btn-secondary">
                  &larr; Back
                </a>
                <div className="portal-btn-row-right">
                  <button className="portal-btn portal-btn-secondary">
                    Save Draft
                  </button>
                  <a href="/demo-portal/documents" className="portal-btn portal-btn-primary">
                    Continue to Supporting Documents &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="portal-sidebar">
            <div className="portal-info">
              <span>&#9432;</span>
              <div>
                All fields with <strong>*</strong> are required. You can save a
                draft and return later to complete your application.
              </div>
            </div>

            <div className="portal-card">
              <h3>Tips</h3>
              <ul className="portal-help-links">
                <li><a href="#">How to describe your condition</a></li>
                <li><a href="#">What counts as a service-connected disability</a></li>
                <li><a href="#">Understanding severity ratings</a></li>
              </ul>
            </div>

            <div className="portal-card">
              <h3>Need Help?</h3>
              <p>
                A Veterans Service Officer (VSO) can help you complete this form
                at no cost.
              </p>
              <ul className="portal-help-links" style={{ marginTop: '10px' }}>
                <li><a href="#">&#128222; Call 1-800-827-1000</a></li>
                <li><a href="#">&#127970; Find a Regional Office</a></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
