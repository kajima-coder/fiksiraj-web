import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { getErrorMessage } from '@/utils/errorUtils';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Uspješna prijava!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Greška pri prijavi'));
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
          <p>Prijavite se na svoj račun</p>
        </div>

        {/* Login Card */}
        <div className="mp-auth-form-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mp-form-group">
              <label className="mp-form-label">Email</label>
              <div className="mp-form-input-icon">
                <Mail />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mp-form-input"
                  placeholder="ivan@example.com"
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div className="mp-form-group" style={{ marginBottom: 0 }}>
              <label className="mp-form-label">Lozinka</label>
              <div className="mp-form-input-icon relative">
                <Lock />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mp-form-input"
                  style={{ paddingRight: '52px' }}
                  placeholder="••••••••"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  data-testid="login-toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mp-btn-primary w-full"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Prijavi se</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/zaboravili-lozinku" className="text-sm text-blue-600 font-semibold hover:underline" data-testid="forgot-password-link">
              Zaboravili ste lozinku?
            </Link>
          </div>

          <div className="mp-auth-footer">
            <p>
              Nemate račun?{' '}
              <Link to="/registracija" data-testid="register-link">
                Registrirajte se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
