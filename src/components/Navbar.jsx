export default function Navbar({ username, onNavigate, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark" id="mainNav">
      <div className="container">
        <a className="navbar-brand" href="#">
          <i className="fas fa-building me-2"></i>Visitor Management System
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                <i className="fas fa-home me-1"></i> Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); onNavigate('visitors'); }}>
                <i className="fas fa-users me-1"></i> Visitors
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); onNavigate('appointments'); }}>
                <i className="fas fa-calendar-alt me-1"></i> Appointments
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); onNavigate('reports'); }}>
                <i className="fas fa-chart-bar me-1"></i> Reports
              </a>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                <i className="fas fa-user me-1"></i> <span>{username}</span>
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#"><i className="fas fa-cog me-2"></i> Settings</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}><i className="fas fa-sign-out-alt me-2"></i> Logout</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
