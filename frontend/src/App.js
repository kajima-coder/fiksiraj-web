import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import LandingPage from "@/pages/LandingPage";
import RegisterPage from "@/pages/RegisterPage";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import Dashboard from "@/pages/Dashboard";
import ServicesPage from "@/pages/ServicesPage";
import WorkingHoursPage from "@/pages/WorkingHoursPage";
import BookingsPage from "@/pages/BookingsPage";
import SettingsPage from "@/pages/SettingsPage";
import PublicBookingPage from "@/pages/PublicBookingPage";
import SearchResultsPage from "@/pages/SearchResultsPage";
import ReviewPage from "@/pages/ReviewPage";
import DeleteAccountPage from "@/pages/DeleteAccountPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";

import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DebugErrorScreen from "@/components/DebugErrorScreen";
import DebugBoundary from "@/components/DebugBoundary";

function StartupDebugBanner() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 999998,
        background: "lime",
        color: "black",
        fontSize: 10,
        padding: 4,
        maxWidth: "100%",
        overflowWrap: "break-word",
      }}
    >
      React mounted: {window.location.href}
    </div>
  );
}

function App() {
  return (
    <DebugBoundary>
      <StartupDebugBanner />

      <AuthProvider>
        <div className="App">
          <DebugErrorScreen />

          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pretraga" element={<SearchResultsPage />} />
              <Route path="/registracija" element={<RegisterPage />} />
              <Route path="/prijava" element={<LoginPage />} />
              <Route path="/zaboravili-lozinku" element={<ForgotPasswordPage />} />
              <Route path="/resetiraj-lozinku/:token" element={<ResetPasswordPage />} />
              <Route path="/ocijeni/:bookingId/:token" element={<ReviewPage />} />
              <Route path="/politika-privatnosti" element={<PrivacyPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/uvjeti-koristenja" element={<TermsPage />} />
              <Route path="/terms" element={<TermsPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/usluge"
                element={
                  <ProtectedRoute>
                    <ServicesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/radno-vrijeme"
                element={
                  <ProtectedRoute>
                    <WorkingHoursPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rezervacije"
                element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/postavke"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/majstor/:slug" element={<PublicBookingPage />} />
              <Route path="/delete-account" element={<DeleteAccountPage />} />

              <Route path="*" element={<LandingPage />} />
            </Routes>
          </BrowserRouter>

          <Toaster position="top-center" richColors />
        </div>
      </AuthProvider>
    </DebugBoundary>
  );
}

export default App;