import { useState } from 'react'

const SCREENS = {
  welcome: 'welcome',
  login: 'login',
  confirmation: 'confirmation',
  photo: 'photo',
  badge: 'badge',
}

const SAMPLE_VISIT = {
  name: 'John Doe',
  company: 'ABC Corporation',
  host: 'Sarah Johnson',
  purpose: 'Business Meeting',
  floor: 'Third Floor - IT Department',
}

export default function Kiosk({ onBack }) {
  const [screen, setScreen] = useState(SCREENS.welcome)
  const [visitId, setVisitId] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')

  const showScreen = (s) => setScreen(s)

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Visitor Kiosk</h2>
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              <i className="fas fa-arrow-left me-1"></i> Back to Dashboard
            </button>
          </div>

          <div className="kiosk-container">
            <div className="kiosk-header">
              <h3><i className="fas fa-building me-2"></i> Welcome to Our Company</h3>
              <p>Please check in using the form below</p>
            </div>

            <div className="kiosk-body">
              {screen === SCREENS.welcome && (
                <div className="welcome-screen">
                  <div className="mb-4">
                    <i className="fas fa-hand-point-down fa-4x text-primary"></i>
                  </div>
                  <h3>Welcome Visitor!</h3>
                  <p className="text-muted">Please tap the button below to begin the check-in process</p>
                  <button type="button" className="btn btn-primary btn-lg mt-3" onClick={() => showScreen(SCREENS.login)}>
                    Start Check-In <i className="fas fa-arrow-right ms-2"></i>
                  </button>
                </div>
              )}

              {screen === SCREENS.login && (
                <>
                  <h4 className="text-center mb-4">Enter Your Credentials</h4>
                  <div className="mb-3">
                    <label htmlFor="visitId" className="form-label">Visit ID</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="visitId"
                      placeholder="Enter your visit ID"
                      value={visitId}
                      onChange={(e) => setVisitId(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="visitorEmail" className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="visitorEmail"
                      placeholder="Enter your email"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                    />
                  </div>
                  <div className="d-grid">
                    <button type="button" className="btn btn-primary btn-lg" onClick={() => showScreen(SCREENS.confirmation)}>
                      Continue <i className="fas fa-arrow-right ms-2"></i>
                    </button>
                  </div>
                </>
              )}

              {screen === SCREENS.confirmation && (
                <>
                  <h4 className="text-center mb-4">Confirm Your Details</h4>
                  <div className="card mb-4">
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-sm-4 fw-bold">Name:</div>
                        <div className="col-sm-8">{SAMPLE_VISIT.name}</div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-sm-4 fw-bold">Company:</div>
                        <div className="col-sm-8">{SAMPLE_VISIT.company}</div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-sm-4 fw-bold">Host:</div>
                        <div className="col-sm-8">{SAMPLE_VISIT.host}</div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-sm-4 fw-bold">Purpose:</div>
                        <div className="col-sm-8">{SAMPLE_VISIT.purpose}</div>
                      </div>
                      <div className="row">
                        <div className="col-sm-4 fw-bold">Floor:</div>
                        <div className="col-sm-8">{SAMPLE_VISIT.floor}</div>
                      </div>
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <button type="button" className="btn btn-success btn-lg" onClick={() => showScreen(SCREENS.photo)}>
                      <i className="fas fa-check-circle me-2"></i> Confirm Details
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => showScreen(SCREENS.login)}>
                      <i className="fas fa-edit me-2"></i> Edit Information
                    </button>
                  </div>
                </>
              )}

              {screen === SCREENS.photo && (
                <>
                  <h4 className="text-center mb-4">Capture Your Photo</h4>
                  <div className="text-center mb-4">
                    <div className="bg-light rounded-circle d-inline-block p-4 mb-3">
                      <i className="fas fa-camera fa-3x text-secondary"></i>
                    </div>
                    <p className="text-muted">Please look at the camera for your badge photo</p>
                  </div>
                  <div className="d-grid gap-2">
                    <button type="button" className="btn btn-primary btn-lg" onClick={() => showScreen(SCREENS.badge)}>
                      <i className="fas fa-camera me-2"></i> Capture Photo
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => showScreen(SCREENS.confirmation)}>
                      <i className="fas fa-arrow-left me-2"></i> Go Back
                    </button>
                  </div>
                </>
              )}

              {screen === SCREENS.badge && (
                <>
                  <h4 className="text-center mb-4">Your Visitor Badge</h4>
                  <div className="visitor-badge mb-4">
                    <div className="text-center mb-3">
                      <h4 className="mb-1">Company Name</h4>
                      <p className="text-muted">Visitor Pass</p>
                    </div>
                    <div className="text-center mb-3">
                      <div className="photo-placeholder">
                        <i className="fas fa-user"></i>
                      </div>
                    </div>
                    <div className="text-center">
                      <h5 className="mb-1">{SAMPLE_VISIT.name}</h5>
                      <p className="text-muted mb-1">{SAMPLE_VISIT.company}</p>
                      <p className="mb-1">Host: {SAMPLE_VISIT.host}</p>
                      <p className="mb-1">Floor: Third Floor - IT</p>
                      <p className="mb-1">Valid until: 04:00 PM</p>
                    </div>
                    <div className="text-center mt-3">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VISITOR-1234" alt="QR Code" />
                    </div>
                  </div>
                  <div className="d-grid">
                    <button type="button" className="btn btn-success btn-lg">
                      <i className="fas fa-print me-2"></i> Print Badge
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
