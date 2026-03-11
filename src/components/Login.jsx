import { useState } from 'react'

const DEMO_USERS = {
  staff: { email: 'john.staff@company.com', name: 'John Staff', role: 'staff' },
  head: { email: 'sarah.head@company.com', name: 'Sarah Head', role: 'head' },
  admin: { email: 'michael.admin@company.com', name: 'Michael Admin', role: 'admin' },
  security: { email: 'david.security@company.com', name: 'David Security', role: 'security' },
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      alert('Please enter both email and password')
      return
    }
    const name = email.split('@')[0].split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
    onLogin({ email, name, role: 'admin' })
  }

  const quickLogin = (role) => {
    const user = DEMO_USERS[role]
    setEmail(user.email)
    setPassword('password')
    onLogin(user)
  }

  return (
    <div className="container">
      <div className="login-container">
        <div className="text-center mb-4">
          <i className="fas fa-building fa-3x text-primary mb-3"></i>
          <h2>Visitor Management System</h2>
          <p className="text-muted">Please sign in to continue</p>
        </div>

        <form id="loginForm" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="loginEmail" className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              id="loginEmail"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="loginPassword" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="loginPassword"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
          </div>
          <div className="d-grid">
            <button type="submit" className="btn btn-primary btn-lg">
              <i className="fas fa-sign-in-alt me-2"></i> Sign In
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="mb-0">Demo Access:</p>
          <div className="btn-group mt-2" role="group">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => quickLogin('staff')}>Staff</button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => quickLogin('head')}>Dept Head</button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => quickLogin('admin')}>Admin</button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => quickLogin('security')}>Security</button>
          </div>
        </div>
      </div>
    </div>
  )
}
