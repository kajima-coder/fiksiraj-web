import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Lock, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Lozinke se ne podudaraju');
      return;
    }

    if (password.length < 6) {
      toast.error('Lozinka mora imati najmanje 6 znakova');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        token,
        new_password: password
      });
      toast.success('Lozinka uspješno promijenjena!');
      navigate('/prijava');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Greška pri resetiranju lozinke');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mp-auth-container">
      <div className="mp-auth-card">
        {/* Logo & Header */}
        <div className="mp-auth-logo">
          <Link to="/">
            <h1 className="hover:opacity-80 transition-opacity cursor-pointer">Fiksiraj</h1>
          </Link>
          <p>Unesite novu lozinku</p>
        </div>

        {/* Form Card */}
        <div className="mp-auth-form-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mp-form-group">
              <label className="mp-form-label">Nova lozinka</label>
              <div className="mp-form-input-icon relative">
                <Lock />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mp-form-input"
                  style={{ paddingRight: '52px' }}
                  placeholder="••••••••"
                  data-testid="reset-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="mp-form-group" style={{ marginBottom: '24px' }}>
              <label className="mp-form-label">Potvrdite lozinku</label>
              <div className="mp-form-input-icon relative">
                <Lock />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mp-form-input"
                  style={{ paddingRight: '52px' }}
                  placeholder="••••••••"
                  data-testid="reset-password-confirm-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mp-btn-primary w-full"
              disabled={loading}
              data-testid="reset-password-submit-button"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Resetiraj lozinku</span>
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

export default ResetPasswordPage;
