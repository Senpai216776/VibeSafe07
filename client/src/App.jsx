import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { IncidentModal } from './components/IncidentModal';
import { DeviceSimulatorModal } from './components/DeviceSimulatorModal';
import { ToastNotification } from './components/ToastNotification';

import { Dashboard } from './pages/Dashboard';
import { AlertsHistory } from './pages/AlertsHistory';
import { Devices } from './pages/Devices';
import { FirmwareGuide } from './pages/FirmwareGuide';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-gray-400">Loading VibeSafe Command Center...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main Layout Wrapper
const DashboardLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col">
      {/* Top Emergency Flashing Banner */}
      <EmergencyBanner />

      {/* Main Top Navigation */}
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Body with Sidebar and Main Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Incident Modal */}
      <IncidentModal />

      {/* Hardware Simulator Modal */}
      <DeviceSimulatorModal />

      {/* Real-time Toast Notifications */}
      <ToastNotification />
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <AlertProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AlertsHistory />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/devices"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Devices />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/firmware"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <FirmwareGuide />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
};

export default App;
