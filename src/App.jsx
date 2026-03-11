import { useState, useCallback } from 'react'
import Navbar from './components/Navbar'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import PreRegister from './components/PreRegister'
import Kiosk from './components/Kiosk'
import VisitorsView from './components/VisitorsView'
import AppointmentsView from './components/AppointmentsView'
import ReportsView from './components/ReportsView'

const VIEWS = {
  login: 'login',
  dashboard: 'dashboard',
  preregister: 'preregister',
  kiosk: 'kiosk',
  visitors: 'visitors',
  appointments: 'appointments',
  reports: 'reports',
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentView, setCurrentView] = useState(VIEWS.login)

  const showView = useCallback((viewId) => {
    setCurrentView(viewId)
    window.scrollTo(0, 0)
  }, [])

  const handleLogin = useCallback((user) => {
    setCurrentUser(user)
    setCurrentView(VIEWS.dashboard)
  }, [])

  const handleLogout = useCallback(() => {
    setCurrentUser(null)
    setCurrentView(VIEWS.login)
  }, [])

  return (
    <>
      {currentUser && (
        <Navbar
          username={currentUser.name}
          onNavigate={showView}
          onLogout={handleLogout}
        />
      )}

      {currentView === VIEWS.login && (
        <Login onLogin={handleLogin} />
      )}

      {currentView === VIEWS.dashboard && (
        <Dashboard onNavigate={showView} />
      )}

      {currentView === VIEWS.preregister && (
        <PreRegister onBack={() => showView(VIEWS.dashboard)} onSubmit={() => showView(VIEWS.dashboard)} />
      )}

      {currentView === VIEWS.kiosk && (
        <Kiosk onBack={() => showView(VIEWS.dashboard)} />
      )}

      {currentView === VIEWS.visitors && (
        <VisitorsView />
      )}

      {currentView === VIEWS.appointments && (
        <AppointmentsView />
      )}

      {currentView === VIEWS.reports && (
        <ReportsView />
      )}
    </>
  )
}
