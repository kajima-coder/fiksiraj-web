import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { CheckCircle, Mail, ArrowLeft, ArrowRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSubmitted(true);
      toast.success('Email za resetiranje lozinke je poslan!');
    } catch (error) {
      toast.error('Greška pri slanju emaila');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mp-auth-container">
        <div className="mp-auth-card">
          <div className="mp-auth-form-card text-center" style={{ padding: '48px 32px' }}>
            <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Sora', sans-serif"}}>
              Provjerite email
            </h1>
            <p className="text-base text-gray-600 mb-8">
              Ako postoji račun s tim emailom, poslali smo vam link za resetiranje lozinke.
            </p>
            <Link to="/prijava">
              <button className="mp-btn-primary w-full">
                Povratak na prijavu
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-auth-container">
      <div className="mp-auth-card">
        {/* Logo & Header */}
        <div className="mp-auth-logo">
          <Link to="/">
            <h1 className="hover:opacity-80 transition-opacity cursor-pointer">Fiksiraj</h1>
          </Link>
          <p>Resetirajte svoju lozinku</p>
        </div>

        {/* Form Card */}
        <div className="mp-auth-form-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mp-form-group" style={{ marginBottom: '16px' }}>
              <label className="mp-form-label">Email adresa</label>
              <div className="mp-form-input-icon">
                <Mail />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mp-form-input"
                  placeholder="ivan@example.com"
                  data-testid="forgot-password-email-input"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Poslat ćemo vam link za resetiranje lozinke na vaš email.
              </p>
            </div>

            <button
              type="submit"
              className="mp-btn-primary w-full"
              disabled={loading}
              data-testid="forgot-password-submit-button"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Pošalji link</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/prijava" className="text-sm text-blue-600 font-semibold hover:underline flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Povratak na prijavu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
