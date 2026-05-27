import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pretraga" element={<SearchResultsPage />} />
            <Route path="/registracija" element={<RegisterPage />} />
            <Route path="/prijava" element={<LoginPage />} />
            <Route path="/zaboravili-lozinku" element={<ForgotPasswordPage />} />
            <Route path="/resetiraj-lozinku/:token" element={<ResetPasswordPage />} />
            <Route path="/ocijeni/:bookingId/:token" element={<ReviewPage />} />
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
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </AuthProvider>
  );
}

export default App;
