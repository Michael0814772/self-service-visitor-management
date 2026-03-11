import { useState, useEffect } from 'react'

const HOSTS = [
  { value: '1', label: 'Sarah Johnson (Finance)' },
  { value: '2', label: 'Michael Brown (HR)' },
  { value: '3', label: 'Amanda Wilson (IT)' },
  { value: '4', label: 'David Miller (Operations)' },
]

const FLOORS = [
  { value: '1', label: 'Ground Floor - Reception' },
  { value: '2', label: 'First Floor - Finance' },
  { value: '3', label: 'Second Floor - HR' },
  { value: '4', label: 'Third Floor - IT' },
]

export default function PreRegister({ onBack, onSubmit }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    host: '',
    floor: '',
    date: '',
    time: '',
  })

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setForm(prev => ({ ...prev, date: today }))
  }, [])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const el = document.getElementById('preregisterForm')
    if (!el.checkValidity()) {
      el.reportValidity()
      return
    }
    alert('Visitor pre-registered successfully! It will now be sent for approval.')
    onSubmit()
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Pre-register Visitor</h2>
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              <i className="fas fa-arrow-left me-1"></i> Back to Dashboard
            </button>
          </div>

          <div className="card">
            <div className="card-header">Visitor Information</div>
            <div className="card-body">
              <form id="preregisterForm" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input type="text" className="form-control" id="firstName" value={form.firstName} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input type="text" className="form-control" id="lastName" value={form.lastName} onChange={handleChange} required />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input type="email" className="form-control" id="email" value={form.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">Phone Number</label>
                      <input type="tel" className="form-control" id="phone" value={form.phone} onChange={handleChange} required />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="company" className="form-label">Company</label>
                  <input type="text" className="form-control" id="company" value={form.company} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                  <label htmlFor="purpose" className="form-label">Purpose of Visit</label>
                  <textarea className="form-control" id="purpose" rows={3} value={form.purpose} onChange={handleChange} required></textarea>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="host" className="form-label">Host</label>
                      <select className="form-select" id="host" value={form.host} onChange={handleChange} required>
                        <option value="">Select Host</option>
                        {HOSTS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="floor" className="form-label">Floor Access</label>
                      <select className="form-select" id="floor" value={form.floor} onChange={handleChange} required>
                        <option value="">Select Floor</option>
                        {FLOORS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="date" className="form-label">Visit Date</label>
                      <input type="date" className="form-control" id="date" value={form.date} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="time" className="form-label">Visit Time</label>
                      <input type="time" className="form-control" id="time" value={form.time} onChange={handleChange} required />
                    </div>
                  </div>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary btn-lg">
                    <i className="fas fa-paper-plane me-2"></i> Submit for Approval
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
