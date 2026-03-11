const STATS = [
  { icon: 'fa-users', value: 24, label: 'Visitors Today' },
  { icon: 'fa-user-check', value: 18, label: 'Checked In' },
  { icon: 'fa-clock', value: 5, label: 'Pending Approval' },
  { icon: 'fa-building', value: 7, label: 'Floors' },
]

const RECENT_VISITORS = [
  { name: 'John Doe', company: 'ABC Corporation', host: 'Sarah Johnson', checkIn: '10:15 AM', status: 'checkedin', statusLabel: 'Checked In' },
  { name: 'Jane Smith', company: 'XYZ Ltd', host: 'Michael Brown', checkIn: '9:30 AM', status: 'checkedout', statusLabel: 'Checked Out' },
  { name: 'Robert Johnson', company: 'Tech Solutions', host: 'Amanda Wilson', checkIn: '11:05 AM', status: 'checkedin', statusLabel: 'Checked In' },
  { name: 'Emily Davis', company: 'Global Services', host: 'David Miller', checkIn: 'Pending', status: 'pending', statusLabel: 'Awaiting Approval' },
  { name: 'Christopher Lee', company: 'Data Systems Inc', host: 'Jennifer Taylor', checkIn: '10:45 AM', status: 'approved', statusLabel: 'Approved' },
]

const UPCOMING = [
  { time: '11', period: 'AM', name: 'Mark Thompson', company: 'Omega Solutions' },
  { time: '1', period: 'PM', name: 'Lisa Anderson', company: 'Nexus Technologies' },
  { time: '3', period: 'PM', name: 'James Wilson', company: 'Prime Data Corp' },
]

export default function Dashboard({ onNavigate }) {
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-12">
          <h2 className="mb-4">Dashboard</h2>
        </div>

        {STATS.map((stat, i) => (
          <div key={i} className="col-md-3">
            <div className="dashboard-stat card">
              <div className="card-body">
                <div className="dashboard-icon">
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}

        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Recent Visitors</span>
              <a href="#" className="btn btn-sm btn-light">View All</a>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Host</th>
                      <th>Check-In</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_VISITORS.map((v, i) => (
                      <tr key={i}>
                        <td>{v.name}</td>
                        <td>{v.company}</td>
                        <td>{v.host}</td>
                        <td>{v.checkIn}</td>
                        <td><span className={`status-badge status-${v.status}`}>{v.statusLabel}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">Quick Actions</div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-primary mb-2" onClick={() => onNavigate('preregister')}>
                  <i className="fas fa-user-plus me-2"></i> Pre-register Visitor
                </button>
                <button className="btn btn-success mb-2" onClick={() => onNavigate('kiosk')}>
                  <i className="fas fa-desktop me-2"></i> Kiosk Check-In
                </button>
                <button className="btn btn-info mb-2">
                  <i className="fas fa-qrcode me-2"></i> Generate Badge
                </button>
                <button className="btn btn-warning mb-2">
                  <i className="fas fa-file-export me-2"></i> Generate Report
                </button>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">Upcoming Appointments</div>
            <div className="card-body">
              {UPCOMING.map((apt, i) => (
                <div key={i} className="d-flex align-items-center mb-3">
                  <div className="flex-shrink-0">
                    <div className="bg-primary text-white rounded p-2 text-center" style={{ width: 50 }}>
                      <div>{apt.time}</div>
                      <div>{apt.period}</div>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="fw-bold">{apt.name}</div>
                    <div className="text-muted">{apt.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
